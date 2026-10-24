import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { normalizeCanonicalUrl } from "@/lib/discovery/normalizer";

export const dynamic = "force-dynamic";

/**
 * Administrative Single Event Management API
 * (Review approval, rejection, editing, status override, and audit logging)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;
  const adminClient = createAdminSupabaseClient();
  if (!adminClient) {
    return NextResponse.json({ success: false, error: "Database client unavailable" }, { status: 500 });
  }

  try {
    // 1. Fetch Event
    const { data: hackathon, error: hError } = await adminClient
      .from("hackathons")
      .select("*")
      .eq("id", id)
      .single();

    if (hError || !hackathon) {
      return NextResponse.json({ success: false, error: "Hackathon not found" }, { status: 404 });
    }

    // 2. Fetch Source Records
    const { data: sourceRecords } = await adminClient
      .from("hackathon_source_records")
      .select("*")
      .eq("hackathon_id", id);

    // 3. Fetch Complete Verification History
    const { data: verificationLogs } = await adminClient
      .from("verification_logs")
      .select("*")
      .eq("hackathon_id", id)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      success: true,
      hackathon,
      sourceRecords: sourceRecords || [],
      verificationLogs: verificationLogs || [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;
  const adminClient = createAdminSupabaseClient();
  if (!adminClient) {
    return NextResponse.json({ success: false, error: "Database client unavailable" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const action = body.action || "edit"; // 'approve' | 'reject' | 'edit' | 'override_status'
    const reason = (body.reason || "").trim();

    // Security Rule: "Record who changed an event and why."
    if (!reason) {
      return NextResponse.json(
        { success: false, error: "A specific reason for this modification is required for the audit trail" },
        { status: 400 }
      );
    }

    // Get current record for diff tracking
    const { data: current, error: fetchError } = await adminClient
      .from("hackathons")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ success: false, error: "Hackathon not found" }, { status: 404 });
    }

    const previousStatus = current.current_status;
    const previousVerStatus = current.verification_status;
    let newCurrentStatus = previousStatus;
    let newVerStatus = previousVerStatus;
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
      last_verified_at: new Date().toISOString(),
    };

    if (action === "approve") {
      newVerStatus = "verified";
      newCurrentStatus = body.currentStatus || "open";
      updates.verification_status = newVerStatus;
      updates.current_status = newCurrentStatus;
      updates.verification_notes = `Approved by moderator ${auth.user.email}. Reason: ${reason}`;
    } else if (action === "reject") {
      newVerStatus = "rejected";
      newCurrentStatus = "cancelled";
      updates.verification_status = newVerStatus;
      updates.current_status = newCurrentStatus;
      updates.verification_notes = `Rejected by moderator ${auth.user.email}. Reason: ${reason}`;
    } else if (action === "override_status") {
      newCurrentStatus = body.currentStatus || previousStatus;
      updates.current_status = newCurrentStatus;
      updates.verification_notes = `Status overridden to ${newCurrentStatus} by moderator ${auth.user.email}. Reason: ${reason}`;
    } else if (action === "edit") {
      // Apply field updates
      if (body.title) updates.title = body.title.trim();
      if (body.tagline !== undefined) updates.tagline = body.tagline.trim();
      if (body.description) updates.description = body.description.trim();
      if (body.organizer) updates.organizer = body.organizer.trim();
      if (body.organizerType) updates.organizer_type = body.organizerType;
      if (body.city) updates.city = body.city.trim();
      if (body.venue) updates.venue = body.venue.trim();
      if (body.format) updates.format = body.format;
      if (body.registrationUrl) updates.registration_url = normalizeCanonicalUrl(body.registrationUrl);
      if (body.officialWebsiteUrl) updates.official_website_url = normalizeCanonicalUrl(body.officialWebsiteUrl);
      if (body.registrationDeadline) updates.registration_deadline = new Date(body.registrationDeadline).toISOString();
      if (body.startDate) updates.start_date = new Date(body.startDate).toISOString();
      if (body.endDate) updates.end_date = new Date(body.endDate).toISOString();
      if (body.eligibility) updates.eligibility = body.eligibility.trim();
      if (body.teamSizeMin !== undefined) updates.team_size_min = parseInt(String(body.teamSizeMin), 10);
      if (body.teamSizeMax !== undefined) updates.team_size_max = parseInt(String(body.teamSizeMax), 10);
      if (body.prizePoolInr !== undefined) {
        updates.prize_pool_inr = parseInt(String(body.prizePoolInr), 10);
        updates.prize_pool_text = updates.prize_pool_inr > 0 ? `₹${updates.prize_pool_inr.toLocaleString("en-IN")}` : "₹0";
      }
      if (body.isFree !== undefined) updates.is_free = Boolean(body.isFree);
      if (body.registrationFeeInr !== undefined) updates.registration_fee_inr = parseInt(String(body.registrationFeeInr), 10);
      if (body.technologyDomains) updates.technology_domains = body.technologyDomains;
      if (body.currentStatus) {
        newCurrentStatus = body.currentStatus;
        updates.current_status = newCurrentStatus;
      }
      updates.verification_notes = `Moderator correction by ${auth.user.email}: ${reason}`;
    }

    // Apply database update
    const { error: updateError } = await adminClient
      .from("hackathons")
      .update(updates as any)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    // Insert moderator audit log in verification_logs
    await adminClient.from("verification_logs").insert({
      hackathon_id: id,
      verifier_type: "moderator",
      verifier_identity: auth.user.email,
      previous_status: previousStatus,
      new_status: newCurrentStatus,
      verification_check_type: "manual_audit",
      is_verified: newVerStatus === "verified",
      notes: `[Action: ${action.toUpperCase()}] By ${auth.user.email}. Reason: ${reason}`,
      metadata: {
        is_admin_override: true,
        action,
        reason,
        previous_verification_status: previousVerStatus,
        new_verification_status: newVerStatus,
        updated_fields: Object.keys(updates),
      },
    } as any);

    return NextResponse.json({
      success: true,
      message: `Event successfully updated (${action})`,
      action,
      previousStatus,
      newStatus: newCurrentStatus,
      verificationStatus: newVerStatus,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;
  const adminClient = createAdminSupabaseClient();
  if (!adminClient) {
    return NextResponse.json({ success: false, error: "Database client unavailable" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get("reason") || "Deleted by moderator";

    // Delete linked records first to satisfy cascade constraints
    await adminClient.from("hackathon_source_records").delete().eq("hackathon_id", id);
    await adminClient.from("verification_logs").delete().eq("hackathon_id", id);
    const { error: delError } = await adminClient.from("hackathons").delete().eq("id", id);

    if (delError) {
      return NextResponse.json({ success: false, error: delError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Hackathon ${id} deleted successfully. Reason: ${reason}`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
