import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { RegistrationStatus } from "@/types/hackathon";
import { Database, VerificationCheckType } from "@/types/database.types";
import {
  getIstCalendarDate,
  isSameIstDay,
  formatIstDate,
  formatIstDateTime,
  getEndOfIstDayUtc,
  getIstDaysDifference,
} from "./ist-utils";

export interface StatusEvaluationParams {
  registrationDeadline: string | Date;
  isDateOnlyDeadline?: boolean;
  startDate: string | Date;
  endDate: string | Date;
  lastVerifiedAt?: string | Date;
  sourceAccessible?: boolean;
  isExplicitlyCancelled?: boolean;
  cancellationKeywordFound?: boolean;
  referenceTime?: Date;
  staleThresholdHours?: number; // default 48
}

export interface StatusEvaluationResult {
  status: RegistrationStatus;
  daysRemaining: number;
  reason: string;
  nextVerificationDueAt: Date;
  isDateOnly: boolean;
}

/**
 * Pure evaluation function for HackMitra's 10 supported registration statuses
 * Strictly enforces Asia/Kolkata timezone rules and source accessibility constraints.
 */
export function evaluateRegistrationStatus(
  params: StatusEvaluationParams
): StatusEvaluationResult {
  const refTime = params.referenceTime || new Date();
  const staleThreshold = params.staleThresholdHours || 48;
  const isDateOnly = params.isDateOnlyDeadline ?? false;

  const deadlineDate = new Date(params.registrationDeadline);
  const startDate = new Date(params.startDate);
  const endDate = new Date(params.endDate);

  // 1. Cancellation check
  if (params.isExplicitlyCancelled || params.cancellationKeywordFound) {
    return {
      status: "cancelled",
      daysRemaining: 0,
      reason: "Event has been cancelled or registration suspended by organizers",
      nextVerificationDueAt: new Date(refTime.getTime() + 7 * 86400000),
      isDateOnly,
    };
  }

  // 2. Source Inaccessibility Guard
  // RULE: "An inaccessible source must not be treated as proof of an open registration."
  if (params.sourceAccessible === false) {
    return {
      status: "unverified",
      daysRemaining: 0,
      reason: "Authoritative registration link is unreachable (HTTP error or dead link). Cannot confirm open registration.",
      nextVerificationDueAt: new Date(refTime.getTime() + 2 * 3600000), // recheck in 2 hours
      isDateOnly,
    };
  }

  // 3. Stale Verification Guard
  // RULE: "Mark overdue verification records as stale."
  if (params.lastVerifiedAt) {
    const lastVerMs = new Date(params.lastVerifiedAt).getTime();
    const hoursSinceVerification = (refTime.getTime() - lastVerMs) / (1000 * 60 * 60);
    if (hoursSinceVerification > staleThreshold) {
      return {
        status: "stale",
        daysRemaining: 0,
        reason: `Verification record is ${Math.round(hoursSinceVerification)} hours old and needs reverification`,
        nextVerificationDueAt: new Date(refTime.getTime() + 1 * 3600000),
        isDateOnly,
      };
    }
  }

  // 4. Completed Event Check
  // If the event end date has elapsed in Asia/Kolkata
  if (refTime.getTime() > endDate.getTime()) {
    return {
      status: "completed",
      daysRemaining: 0,
      reason: `Event concluded on ${formatIstDate(endDate)}`,
      nextVerificationDueAt: new Date(refTime.getTime() + 30 * 86400000),
      isDateOnly,
    };
  }

  // 5. Ongoing Event Check
  // Event has started but not yet ended
  if (refTime.getTime() >= startDate.getTime() && refTime.getTime() <= endDate.getTime()) {
    return {
      status: "ongoing",
      daysRemaining: 0,
      reason: `Hackathon is currently underway (${formatIstDate(startDate)} to ${formatIstDate(endDate)})`,
      nextVerificationDueAt: new Date(refTime.getTime() + 6 * 3600000),
      isDateOnly,
    };
  }

  // 6. Registration Deadline Evaluation
  // RULE: "A future event date does not prove that registration remains open."
  // RULE: "Handle date-only deadlines without inventing an exact closing time."

  if (isDateOnly) {
    const deadlineCalDate = getIstCalendarDate(deadlineDate);
    const refCalDate = getIstCalendarDate(refTime);

    // If today is the deadline date in Asia/Kolkata
    if (deadlineCalDate === refCalDate) {
      return {
        status: "deadline_today",
        daysRemaining: 0,
        reason: `Registration closes today (${formatIstDate(deadlineDate)}) - exact closing time unspecified by organizer`,
        nextVerificationDueAt: new Date(refTime.getTime() + 2 * 3600000), // check every 2 hours on deadline day
        isDateOnly: true,
      };
    }

    // If calendar day in Asia/Kolkata has passed
    if (refCalDate > deadlineCalDate) {
      return {
        status: "closed",
        daysRemaining: 0,
        reason: `Registration deadline passed on ${formatIstDate(deadlineDate)}`,
        nextVerificationDueAt: new Date(refTime.getTime() + 48 * 3600000),
        isDateOnly: true,
      };
    }

    // Future date-only deadline: compute difference in full calendar days in IST
    const daysDiff = getIstDaysDifference(deadlineDate, refTime);

    if (daysDiff <= 3) {
      return {
        status: "closing_soon",
        daysRemaining: daysDiff,
        reason: `Registration closes in ${daysDiff} day${daysDiff === 1 ? "" : "s"} (${formatIstDate(deadlineDate)})`,
        nextVerificationDueAt: new Date(refTime.getTime() + 4 * 3600000),
        isDateOnly: true,
      };
    }

    return {
      status: "open",
      daysRemaining: daysDiff,
      reason: `Registrations open until ${formatIstDate(deadlineDate)}`,
      nextVerificationDueAt: new Date(refTime.getTime() + 12 * 3600000),
      isDateOnly: true,
    };
  } else {
    // Exact Timestamp Deadline
    const diffMs = deadlineDate.getTime() - refTime.getTime();

    if (diffMs <= 0) {
      return {
        status: "closed",
        daysRemaining: 0,
        reason: `Registration closed on ${formatIstDateTime(deadlineDate)}`,
        nextVerificationDueAt: new Date(refTime.getTime() + 48 * 3600000),
        isDateOnly: false,
      };
    }

    // If deadline falls on today's calendar date in IST
    if (isSameIstDay(refTime, deadlineDate)) {
      const hoursRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
      return {
        status: "deadline_today",
        daysRemaining: 0,
        reason: `Closes today at ${formatIstDateTime(deadlineDate)} (~${hoursRemaining}h remaining)`,
        nextVerificationDueAt: new Date(refTime.getTime() + 2 * 3600000),
        isDateOnly: false,
      };
    }

    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (daysRemaining <= 3) {
      return {
        status: "closing_soon",
        daysRemaining,
        reason: `Closes in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} (${formatIstDateTime(deadlineDate)})`,
        nextVerificationDueAt: new Date(refTime.getTime() + 4 * 3600000),
        isDateOnly: false,
      };
    }

    return {
      status: "open",
      daysRemaining,
      reason: `Registrations open until ${formatIstDateTime(deadlineDate)}`,
      nextVerificationDueAt: new Date(refTime.getTime() + 12 * 3600000),
      isDateOnly: false,
    };
  }
}

/**
 * Link Liveness and Content Inspection Worker
 * Performs a HEAD or GET check to test link availability and check for cancellations
 */
export async function inspectOfficialEventUrl(url: string): Promise<{
  accessible: boolean;
  httpStatus?: number;
  error?: string;
  cancellationDetected: boolean;
  notes: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "HackMitra-Verification-Engine/1.0 (+https://hackmitra.in; registrar@hackmitra.in)",
        "Accept": "text/html,application/json,*/*",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return {
        accessible: false,
        httpStatus: res.status,
        cancellationDetected: false,
        notes: `HTTP error status ${res.status} returned by source URL`,
      };
    }

    // Inspect content preview for cancellation indicators
    const textSample = (await res.text().catch(() => "")).slice(0, 50000).toLowerCase();
    const cancellationKeywords = [
      "hackathon cancelled",
      "hackathon has been cancelled",
      "event cancelled",
      "postponed indefinitely",
      "registrations suspended",
      "registration has closed",
    ];

    const foundKeyword = cancellationKeywords.find((kw) => textSample.includes(kw));

    return {
      accessible: true,
      httpStatus: res.status,
      cancellationDetected: Boolean(foundKeyword),
      notes: foundKeyword
        ? `Cancellation signal detected in source content: '${foundKeyword}'`
        : "Link is live, active, and accessible (HTTP 200)",
    };
  } catch (error: any) {
    return {
      accessible: false,
      error: error.message || "Failed to reach source URL",
      cancellationDetected: false,
      notes: `Network error reaching source URL: ${error.message}`,
    };
  }
}

/**
 * Verifies a single hackathon, detects deadline extensions or status transitions,
 * preserves verification audit history, and updates database records.
 */
export async function verifySingleHackathonRecord(
  hackathonId: string,
  options?: { skipNetwork?: boolean; referenceTime?: Date }
) {
  const adminClient = createAdminSupabaseClient();
  if (!adminClient) return null;

  const { data: hackathon, error: hError } = await adminClient
    .from("hackathons")
    .select("*")
    .eq("id", hackathonId)
    .single();

  if (hError || !hackathon) return null;

  const refTime = options?.referenceTime || new Date();

  // 1. Inspect source URL if network check enabled
  let sourceAccessible = true;
  let cancellationDetected = false;
  let checkNotes = "Manual or automated status recheck";

  if (!options?.skipNetwork && hackathon.registration_url) {
    const inspection = await inspectOfficialEventUrl(hackathon.registration_url);
    sourceAccessible = inspection.accessible;
    cancellationDetected = inspection.cancellationDetected;
    checkNotes = inspection.notes;
  }

  // 2. Evaluate Status
  const evalResult = evaluateRegistrationStatus({
    registrationDeadline: hackathon.registration_deadline,
    isDateOnlyDeadline: hackathon.is_date_only_deadline,
    startDate: hackathon.start_date,
    endDate: hackathon.end_date,
    lastVerifiedAt: hackathon.last_verified_at,
    sourceAccessible,
    cancellationKeywordFound: cancellationDetected,
    referenceTime: refTime,
  });

  const previousStatus = hackathon.current_status;
  const newStatus = evalResult.status;
  const statusChanged = previousStatus !== newStatus;

  // Determine verification check type
  let checkType: VerificationCheckType = "deadline_recheck";
  if (!sourceAccessible) checkType = "link_liveness";
  else if (cancellationDetected) checkType = "cancellation_check";
  else if (newStatus === "stale") checkType = "stale_detection";

  // 3. Update Hackathon
  await adminClient
    .from("hackathons")
    .update({
      current_status: newStatus,
      last_verified_at: refTime.toISOString(),
      next_verification_due_at: evalResult.nextVerificationDueAt.toISOString(),
      verification_notes: evalResult.reason,
      updated_at: refTime.toISOString(),
    } as any)
    .eq("id", hackathonId);

  // 4. Log in verification_logs if status changed or upon explicit check
  await adminClient.from("verification_logs").insert({
    hackathon_id: hackathonId,
    verifier_type: "automated_bot",
    verifier_identity: "verification_engine_v1",
    previous_status: previousStatus,
    new_status: newStatus,
    verification_check_type: checkType,
    is_verified: sourceAccessible && !cancellationDetected,
    notes: `${evalResult.reason}. Inspection: ${checkNotes}`,
    metadata: {
      days_remaining: evalResult.daysRemaining,
      is_date_only: evalResult.isDateOnly,
      source_accessible: sourceAccessible,
    },
  } as any);

  return {
    hackathonId,
    previousStatus,
    newStatus,
    statusChanged,
    evaluation: evalResult,
    inspectionNotes: checkNotes,
  };
}

/**
 * Batch Worker: Prioritizes and rechecks events with approaching deadlines
 * RULE: "Prioritize events with approaching deadlines."
 */
export async function runPriorityDeadlineRechecks(options?: {
  limit?: number;
  skipNetwork?: boolean;
}) {
  const adminClient = createAdminSupabaseClient();
  if (!adminClient) return [];

  const limit = options?.limit || 20;

  // Query events prioritized by closest deadline
  const { data: queue, error } = await adminClient
    .from("hackathons")
    .select("id, title, registration_deadline, current_status")
    .in("current_status", ["open", "deadline_today", "closing_soon", "upcoming"])
    .order("registration_deadline", { ascending: true })
    .limit(limit);

  if (error || !queue) return [];

  const results = [];
  for (const item of queue) {
    const res = await verifySingleHackathonRecord(item.id, {
      skipNetwork: options?.skipNetwork ?? false,
    });
    if (res) results.push(res);
  }

  return results;
}

/**
 * Identifies events overdue for verification (>48 hours) and flags them as stale
 * RULE: "Mark overdue verification records as stale."
 */
export async function markStaleEventsForReverification(options?: {
  staleThresholdHours?: number;
  limit?: number;
}) {
  const adminClient = createAdminSupabaseClient();
  if (!adminClient) return [];

  const thresholdHours = options?.staleThresholdHours || 48;
  const limit = options?.limit || 50;
  const staleThresholdDate = new Date(Date.now() - thresholdHours * 60 * 60 * 1000).toISOString();
  const nowIso = new Date().toISOString();

  // Find active events that haven't been verified within threshold
  const { data: staleCandidates, error } = await adminClient
    .from("hackathons")
    .select("id, title, current_status, last_verified_at, next_verification_due_at")
    .in("current_status", ["open", "closing_soon", "deadline_today", "upcoming"])
    .or(`last_verified_at.lt.${staleThresholdDate},next_verification_due_at.lte.${nowIso}`)
    .limit(limit);

  if (error || !staleCandidates) return [];

  const markedStale = [];
  for (const item of staleCandidates) {
    const prevStatus = item.current_status;
    const hoursSince = Math.round(
      (Date.now() - new Date(item.last_verified_at).getTime()) / (1000 * 60 * 60)
    );

    await adminClient
      .from("hackathons")
      .update({
        current_status: "stale",
        verification_notes: `Marked stale: last verified ${hoursSince}h ago (>48h threshold). Flagged for automated reverification.`,
        updated_at: nowIso,
      } as any)
      .eq("id", item.id);

    await adminClient.from("verification_logs").insert({
      hackathon_id: item.id,
      verifier_type: "automated_bot",
      verifier_identity: "verification_stale_detector",
      previous_status: prevStatus,
      new_status: "stale",
      verification_check_type: "stale_detection",
      is_verified: false,
      notes: `Event marked stale (${hoursSince}h since last verification). Queueing for immediate priority recheck.`,
      metadata: { hours_since_verification: hoursSince },
    } as any);

    markedStale.push({
      hackathonId: item.id,
      title: item.title,
      previousStatus: prevStatus,
      hoursSince,
    });
  }

  return markedStale;
}

/**
 * Updates event dates and status when evidence confirms a registration extension
 * RULE: "Update event dates and registration status when evidence supports changes."
 */
export async function detectAndApplyDeadlineExtension(
  hackathonId: string,
  newDeadlineIso: string,
  options?: { evidenceUrl?: string; notes?: string }
) {
  const adminClient = createAdminSupabaseClient();
  if (!adminClient) return null;

  const { data: current, error } = await adminClient
    .from("hackathons")
    .select("id, title, current_status, registration_deadline, start_date, end_date")
    .eq("id", hackathonId)
    .single();

  if (error || !current) return null;

  const prevStatus = current.current_status;
  const prevDeadline = current.registration_deadline;
  const nowIso = new Date().toISOString();

  // Evaluate new status with updated deadline
  const evalResult = evaluateRegistrationStatus({
    registrationDeadline: newDeadlineIso,
    startDate: current.start_date,
    endDate: current.end_date,
    sourceAccessible: true,
  });

  // Update hackathon with new deadline & status
  await adminClient
    .from("hackathons")
    .update({
      registration_deadline: newDeadlineIso,
      current_status: evalResult.status,
      last_verified_at: nowIso,
      next_verification_due_at: evalResult.nextVerificationDueAt.toISOString(),
      verification_notes: `Deadline extended from ${prevDeadline} to ${newDeadlineIso}. ${options?.notes || ""}`,
      updated_at: nowIso,
    } as any)
    .eq("id", hackathonId);

  // Log in verification audit trail
  await adminClient.from("verification_logs").insert({
    hackathon_id: hackathonId,
    verifier_type: "automated_bot",
    verifier_identity: "verification_extension_detector",
    previous_status: prevStatus,
    new_status: evalResult.status,
    verification_check_type: "extension_detected",
    is_verified: true,
    notes: `Deadline extension applied: ${prevDeadline} -> ${newDeadlineIso}. Status transitioned from ${prevStatus} to ${evalResult.status}. ${options?.notes || ""}`,
    metadata: {
      previous_deadline: prevDeadline,
      new_deadline: newDeadlineIso,
      evidence_url: options?.evidenceUrl,
    },
  } as any);

  return {
    hackathonId,
    previousDeadline: prevDeadline,
    newDeadline: newDeadlineIso,
    previousStatus: prevStatus,
    newStatus: evalResult.status,
  };
}
