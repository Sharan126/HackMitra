import { NextRequest, NextResponse } from "next/server";
import { requireUserAuth } from "@/lib/auth/user-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NotificationEngine } from "@/lib/notifications/notification-engine";

/**
 * User Saved Events Endpoint
 * 
 * GET: Lists saved hackathons for authenticated user
 * POST: Saves a hackathon and schedules deadline reminders
 * DELETE: Unsaves a hackathon and cancels pending reminders
 * 
 * Protected by server-side authorization guard.
 */

export async function GET(request: NextRequest) {
  const auth = await requireUserAuth(request);
  if ("response" in auth) return auth.response;

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }

  const { data: savedEvents, error } = await supabase
    .from("saved_events")
    .select(`
      id,
      notes,
      created_at,
      hackathon_id,
      hackathons:hackathon_id (
        id,
        slug,
        title,
        organizer,
        organizer_type,
        city,
        district_id,
        district_name,
        format,
        current_status,
        registration_deadline,
        start_date,
        end_date,
        prize_pool_text,
        is_free,
        registration_url,
        is_beyond_bengaluru
      )
    `)
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also fetch scheduled reminders for these events
  const { data: reminders } = await supabase
    .from("scheduled_reminders")
    .select("*")
    .eq("user_id", auth.user.id)
    .eq("status", "pending");

  return NextResponse.json({
    savedEvents: savedEvents || [],
    pendingReminders: reminders || [],
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireUserAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const body = await request.json();
    const { hackathonId, notes } = body;

    if (!hackathonId || typeof hackathonId !== "string") {
      return NextResponse.json(
        { error: "Validation error", message: "hackathonId is required." },
        { status: 400 }
      );
    }

    const result = await NotificationEngine.saveHackathon(
      auth.user.id,
      hackathonId,
      notes
    );

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to save event", message: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Event saved to your radar with automated deadline reminders.",
    });
  } catch {
    return NextResponse.json(
      { error: "Bad request", message: "Invalid JSON payload" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireUserAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const body = await request.json();
    const { hackathonId } = body;

    if (!hackathonId || typeof hackathonId !== "string") {
      return NextResponse.json(
        { error: "Validation error", message: "hackathonId is required." },
        { status: 400 }
      );
    }

    const result = await NotificationEngine.unsaveHackathon(
      auth.user.id,
      hackathonId
    );

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to remove event", message: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Event removed from saved list and pending reminders cancelled.",
    });
  } catch {
    return NextResponse.json(
      { error: "Bad request", message: "Invalid JSON payload" },
      { status: 400 }
    );
  }
}
