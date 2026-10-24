import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { discoveryEngine } from "@/lib/discovery/engine";

export const dynamic = "force-dynamic";

/**
 * Administrative Source Controls & Health API
 * Allows enabling/disabling discovery sources and inspecting failure details
 */
export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const summary = await discoveryEngine.getSourceHealthSummary();
    return NextResponse.json({ success: true, sources: summary });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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
    const { sourceId, isActive, reason } = body;

    if (!sourceId || isActive === undefined) {
      return NextResponse.json(
        { success: false, error: "sourceId and isActive boolean are required" },
        { status: 400 }
      );
    }

    if (!reason || reason.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Reason for modifying source configuration is required for audit trail" },
        { status: 400 }
      );
    }

    const { error } = await adminClient
      .from("event_sources")
      .update({
        is_active: Boolean(isActive),
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", sourceId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Source '${sourceId}' ${isActive ? "enabled" : "disabled"} by ${auth.user.email}. Reason: ${reason}`,
      sourceId,
      isActive,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
