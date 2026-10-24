import { NextRequest, NextResponse } from "next/server";
import { NotificationEngine } from "@/lib/notifications/notification-engine";
import { getAdminSessionFromRequest } from "@/lib/auth/admin-auth";

/**
 * Scheduled Notification & Reminder Worker Endpoint
 * 
 * Invoked by automated cron runner (or background worker)
 * to process pending 48h and 24h deadline reminders.
 * 
 * Protected by CRON_SECRET or Admin Session.
 */

export async function POST(request: NextRequest) {
  // 1. Authorization check: Either Bearer CRON_SECRET or Admin Session
  const authHeader = request.headers.get("authorization") || "";
  const cronSecret = process.env.CRON_SECRET || "hackmitra_cron_secure_token_2026";
  const isCronAuthorized = authHeader === `Bearer ${cronSecret}`;

  const adminSession = getAdminSessionFromRequest(request);
  const isAdminAuthorized = Boolean(adminSession && adminSession.authorized);

  if (!isCronAuthorized && !isAdminAuthorized) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid or missing cron credentials." },
      { status: 401 }
    );
  }

  try {
    const result = await NotificationEngine.processPendingReminders();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      sentCount: result.sentCount,
      skippedCount: result.skippedCount,
      failedCount: result.failedCount,
      logs: result.logs,
    });
  } catch (err: any) {
    console.error("[CronNotifications] Error processing reminders:", err);
    return NextResponse.json(
      { error: "Internal processing error", message: err.message },
      { status: 500 }
    );
  }
}
