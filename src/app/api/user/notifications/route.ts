import { NextRequest, NextResponse } from "next/server";
import { requireUserAuth } from "@/lib/auth/user-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NotificationEngine } from "@/lib/notifications/notification-engine";

/**
 * User Notifications Endpoint
 * 
 * GET: Lists delivery audit history and pending reminders for the user
 * POST: Dispatches a verified end-to-end test notification to the user's email
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

  // 1. Fetch delivery logs for this user
  const { data: deliveryLogs, error: logError } = await supabase
    .from("notification_delivery_logs")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (logError) {
    return NextResponse.json({ error: logError.message }, { status: 500 });
  }

  // 2. Fetch scheduled reminders
  const { data: reminders, error: remError } = await supabase
    .from("scheduled_reminders")
    .select(`
      *,
      hackathons:hackathon_id (
        id,
        title,
        registration_deadline,
        district_name
      )
    `)
    .eq("user_id", auth.user.id)
    .order("scheduled_for", { ascending: true });

  if (remError) {
    return NextResponse.json({ error: remError.message }, { status: 500 });
  }

  return NextResponse.json({
    deliveryLogs: deliveryLogs || [],
    scheduledReminders: reminders || [],
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireUserAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const email = (typeof body.email === "string" && body.email.includes("@")) ? body.email.trim() : auth.user.email;

    if (!email) {
      return NextResponse.json(
        { error: "Validation error", message: "A valid email address is required." },
        { status: 400 }
      );
    }

    const result = await NotificationEngine.sendTestNotification(auth.user.id, email);

    if (!result.success) {
      return NextResponse.json(
        { error: "Delivery failed", message: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test alert successfully dispatched to ${email}.`,
      messageId: result.messageId,
    });
  } catch {
    return NextResponse.json(
      { error: "Bad request", message: "Failed to dispatch test notification" },
      { status: 400 }
    );
  }
}
