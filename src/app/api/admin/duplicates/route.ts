import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Administrative Duplicate Detection and Resolution API
 */
export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  const adminClient = createAdminSupabaseClient();
  if (!adminClient) {
    return NextResponse.json({ success: false, error: "Database client unavailable" }, { status: 500 });
  }

  try {
    // Query all hackathons to compute potential duplicate clusters
    const { data: events, error } = await adminClient
      .from("hackathons")
      .select("id, slug, title, organizer, district_id, district_name, registration_url, current_status, created_at");

    if (error || !events) {
      return NextResponse.json({ success: false, error: error?.message || "Failed to query events" }, { status: 500 });
    }

    // Identify duplicate clusters by title similarity or matching registration URL
    const duplicateGroups: Array<{
      key: string;
      reason: string;
      events: typeof events;
    }> = [];

    const urlMap = new Map<string, typeof events>();
    const titleDistrictMap = new Map<string, typeof events>();

    for (const e of events) {
      // Group by canonical registration URL
      if (e.registration_url) {
        const cleanUrl = e.registration_url.replace(/\/+$/, "").toLowerCase();
        const list = urlMap.get(cleanUrl) || [];
        list.push(e);
        urlMap.set(cleanUrl, list);
      }

      // Group by normalized title + district
      const normTitle = e.title.toLowerCase().replace(/[^a-z0-9]/g, "");
      const titleKey = `${normTitle}_${e.district_id}`;
      const tList = titleDistrictMap.get(titleKey) || [];
      tList.push(e);
      titleDistrictMap.set(titleKey, tList);
    }

    // Filter clusters with >1 item
    for (const [url, list] of urlMap.entries()) {
      if (list.length > 1) {
        duplicateGroups.push({
          key: url,
          reason: "Identical registration URL across multiple records",
          events: list,
        });
      }
    }

    for (const [titleKey, list] of titleDistrictMap.entries()) {
      if (list.length > 1) {
        // Only add if not already captured by URL
        const ids = list.map((l) => l.id).sort().join(",");
        const alreadyExists = duplicateGroups.some((g) => g.events.map((e) => e.id).sort().join(",") === ids);
        if (!alreadyExists) {
          duplicateGroups.push({
            key: titleKey,
            reason: "Matching title and district name",
            events: list,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      duplicateGroupsCount: duplicateGroups.length,
      duplicateGroups,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  const adminClient = createAdminSupabaseClient();
  if (!adminClient) {
    return NextResponse.json({ success: false, error: "Database client unavailable" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { canonicalId, duplicateId, reason } = body;

    if (!canonicalId || !duplicateId) {
      return NextResponse.json(
        { success: false, error: "canonicalId and duplicateId are required" },
        { status: 400 }
      );
    }

    if (canonicalId === duplicateId) {
      return NextResponse.json(
        { success: false, error: "Canonical ID and duplicate ID cannot be identical" },
        { status: 400 }
      );
    }

    const resolutionReason = (reason || "Merged duplicate record into canonical hackathon").trim();

    // 1. Move all source records from duplicateId to canonicalId
    await adminClient
      .from("hackathon_source_records")
      .update({ hackathon_id: canonicalId, ingestion_status: "mapped" } as any)
      .eq("hackathon_id", duplicateId);

    // 2. Insert audit log on canonical record
    await adminClient.from("verification_logs").insert({
      hackathon_id: canonicalId,
      verifier_type: "moderator",
      verifier_identity: auth.user.email,
      new_status: "verified",
      verification_check_type: "manual_audit",
      is_verified: true,
      notes: `Merged duplicate event ${duplicateId} into canonical event. Reason: ${resolutionReason}`,
      metadata: {
        is_admin_override: true,
        action: "merge_duplicate",
        duplicate_id: duplicateId,
        reason: resolutionReason,
      },
    } as any);

    // 3. Delete duplicate hackathon row
    await adminClient.from("hackathons").delete().eq("id", duplicateId);

    return NextResponse.json({
      success: true,
      message: `Duplicate ${duplicateId} successfully merged into canonical ${canonicalId}`,
      canonicalId,
      duplicateId,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
