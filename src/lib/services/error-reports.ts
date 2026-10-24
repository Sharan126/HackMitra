import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type ErrorReportType =
  | "dead_link"
  | "expired_early"
  | "incorrect_dates"
  | "fake_prize"
  | "duplicate"
  | "other";

export type ReportStatus = "pending" | "investigating" | "resolved" | "dismissed";

export interface UserErrorReport {
  id: string;
  hackathonId?: string | null;
  hackathonTitle?: string | null;
  reporterEmail: string;
  reportType: ErrorReportType;
  details: string;
  status: ReportStatus;
  resolutionNotes?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

// In-memory fallback / cache for error reports to guarantee resilience
const inMemoryErrorReports: UserErrorReport[] = [
  {
    id: "rep_sample_01",
    hackathonId: "kle-hack-2026",
    hackathonTitle: "KLE Tech Innovate 2026: Beyond Bengaluru Hackathon",
    reporterEmail: "student.council@kletech.ac.in",
    reportType: "incorrect_dates",
    details: "Registration deadline was extended to Nov 10th by the Dean of Student Affairs.",
    status: "resolved",
    resolutionNotes: "Verified with KLE Tech official circular. Updated registration deadline to Nov 10, 2026.",
    resolvedBy: "admin@hackmitra.in",
    resolvedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "rep_sample_02",
    hackathonId: "nitk-hackverse-2026",
    hackathonTitle: "HackVerse 5.0: Coastal Innovation Sprint",
    reporterEmail: "lead@nitk.edu.in",
    reportType: "dead_link",
    details: "Unstop portal had brief 503 maintenance window. Link is back online.",
    status: "pending",
    resolutionNotes: null,
    resolvedBy: null,
    resolvedAt: null,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
];

export async function submitErrorReport(params: {
  hackathonId?: string;
  hackathonTitle?: string;
  reporterEmail: string;
  reportType: ErrorReportType;
  details: string;
}): Promise<UserErrorReport> {
  const adminClient = createAdminSupabaseClient();
  const id = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  const report: UserErrorReport = {
    id,
    hackathonId: params.hackathonId || null,
    hackathonTitle: params.hackathonTitle || null,
    reporterEmail: params.reporterEmail.trim(),
    reportType: params.reportType,
    details: params.details.trim(),
    status: "pending",
    createdAt: nowIso,
  };

  inMemoryErrorReports.unshift(report);

  // If hackathonId exists, also log in verification_logs for persistent audit history
  if (adminClient && params.hackathonId) {
    try {
      await adminClient.from("verification_logs").insert({
        hackathon_id: params.hackathonId,
        verifier_type: "campus_scout",
        verifier_identity: params.reporterEmail,
        new_status: "pending_verification",
        verification_check_type: "manual_audit",
        is_verified: false,
        notes: `User Error Report (${params.reportType}): ${params.details}`,
        metadata: {
          report_id: id,
          reporter_email: params.reporterEmail,
          report_type: params.reportType,
          details: params.details,
        },
      } as any);
    } catch (err) {
      console.warn("Failed to insert verification log for error report:", err);
    }
  }

  return report;
}

export async function getAllErrorReports(options?: {
  status?: ReportStatus | "all";
}): Promise<UserErrorReport[]> {
  const statusFilter = options?.status;
  if (!statusFilter || statusFilter === "all") {
    return inMemoryErrorReports;
  }
  return inMemoryErrorReports.filter((r) => r.status === statusFilter);
}

export async function resolveErrorReport(
  reportId: string,
  resolution: {
    status: "resolved" | "dismissed";
    notes: string;
    resolvedBy: string;
  }
): Promise<UserErrorReport | null> {
  const adminClient = createAdminSupabaseClient();
  const report = inMemoryErrorReports.find((r) => r.id === reportId);
  if (!report) return null;

  const nowIso = new Date().toISOString();
  report.status = resolution.status;
  report.resolutionNotes = resolution.notes;
  report.resolvedBy = resolution.resolvedBy;
  report.resolvedAt = nowIso;

  // Log moderator audit in verification_logs if hackathonId is attached
  if (adminClient && report.hackathonId) {
    try {
      await adminClient.from("verification_logs").insert({
        hackathon_id: report.hackathonId,
        verifier_type: "moderator",
        verifier_identity: resolution.resolvedBy,
        new_status: "verified",
        verification_check_type: "manual_audit",
        is_verified: true,
        notes: `Resolved Error Report (${report.reportType}) [${resolution.status}]: ${resolution.notes}`,
        metadata: {
          report_id: reportId,
          resolution_status: resolution.status,
          resolution_notes: resolution.notes,
          is_admin_override: true,
        },
      } as any);
    } catch (err) {
      console.warn("Failed to log error report resolution in verification_logs:", err);
    }
  }

  return report;
}
