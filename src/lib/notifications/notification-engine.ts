import { createAdminSupabaseClient } from "../supabase/admin";
import { assertServerOnly } from "../supabase/config";
import { NotificationProvider } from "./email-provider";
import { Database, NotificationType, DeliveryStatus, ReminderType } from "@/types/database.types";

/**
 * HackMitra Notification & Reminder Processing Engine
 * 
 * STRICT SERVER-ONLY USAGE.
 * Features:
 * - Save & Unsave hackathons
 * - Preference-based filtering (Districts, Themes, Toggles)
 * - Anti-duplication via unique cryptographic dedup keys
 * - Dynamic rescheduling/cancellation on deadline modifications
 * - Full audit logs in notification_delivery_logs
 */

export interface NotificationResult {
  sentCount: number;
  skippedCount: number;
  failedCount: number;
  logs: Array<{
    recipient: string;
    type: string;
    status: DeliveryStatus;
    reason?: string;
  }>;
}

export class NotificationEngine {
  /**
   * Saves a hackathon for a user and creates deadline reminders
   */
  public static async saveHackathon(
    userId: string,
    hackathonId: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    assertServerOnly();
    const supabase = createAdminSupabaseClient();
    if (!supabase) return { success: false, error: "Database unavailable" };

    // 1. Insert into saved_events
    const { error: saveError } = await supabase.from("saved_events").upsert(
      {
        user_id: userId,
        hackathon_id: hackathonId,
        notes: notes || null,
      },
      { onConflict: "user_id,hackathon_id" }
    );

    if (saveError) {
      return { success: false, error: saveError.message };
    }

    // 2. Fetch event deadline to schedule reminders
    const { data: hackathon } = await supabase
      .from("hackathons")
      .select("id, title, registration_deadline, current_status")
      .eq("id", hackathonId)
      .single();

    if (hackathon && hackathon.registration_deadline) {
      await this.scheduleRemindersForEvent(userId, hackathon);
    }

    return { success: true };
  }

  /**
   * Unsaves a hackathon and cancels any pending reminders
   */
  public static async unsaveHackathon(
    userId: string,
    hackathonId: string
  ): Promise<{ success: boolean; error?: string }> {
    assertServerOnly();
    const supabase = createAdminSupabaseClient();
    if (!supabase) return { success: false, error: "Database unavailable" };

    // 1. Delete from saved_events
    const { error: deleteError } = await supabase
      .from("saved_events")
      .delete()
      .eq("user_id", userId)
      .eq("hackathon_id", hackathonId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // 2. Cancel all pending reminders for this user & hackathon
    await supabase
      .from("scheduled_reminders")
      .update({ status: "cancelled" })
      .eq("user_id", userId)
      .eq("hackathon_id", hackathonId)
      .eq("status", "pending");

    return { success: true };
  }

  /**
   * Schedules 48h and 24h reminders before verified registration deadline
   */
  public static async scheduleRemindersForEvent(
    userId: string,
    hackathon: { id: string; title: string; registration_deadline: string; current_status: string }
  ): Promise<void> {
    assertServerOnly();
    const supabase = createAdminSupabaseClient();
    if (!supabase) return;

    const deadline = new Date(hackathon.registration_deadline);
    const now = new Date();

    // If deadline has already passed or event closed, do not schedule
    if (deadline.getTime() <= now.getTime() || hackathon.current_status === "closed" || hackathon.current_status === "cancelled") {
      return;
    }

    const remindersToCreate: Array<{
      type: ReminderType;
      scheduledFor: Date;
    }> = [
      {
        type: "48h_before_deadline",
        scheduledFor: new Date(deadline.getTime() - 48 * 60 * 60 * 1000),
      },
      {
        type: "24h_before_deadline",
        scheduledFor: new Date(deadline.getTime() - 24 * 60 * 60 * 1000),
      },
    ];

    for (const rem of remindersToCreate) {
      // If the reminder date is in the future, insert or update
      if (rem.scheduledFor.getTime() > now.getTime()) {
        await supabase.from("scheduled_reminders").upsert(
          {
            user_id: userId,
            hackathon_id: hackathon.id,
            reminder_type: rem.type,
            target_deadline: deadline.toISOString(),
            scheduled_for: rem.scheduledFor.toISOString(),
            status: "pending",
          },
          { onConflict: "user_id,hackathon_id,reminder_type" }
        );
      }
    }
  }

  /**
   * Reschedules or cancels reminders when an event's deadline or status changes
   * Requirement 4: "Update or cancel reminders when deadlines change."
   */
  public static async syncEventReminders(
    hackathonId: string,
    newDeadlineIso: string,
    newStatus: string,
    reason?: string
  ): Promise<{ updatedReminders: number; notifiedUsers: number }> {
    assertServerOnly();
    const supabase = createAdminSupabaseClient();
    if (!supabase) return { updatedReminders: 0, notifiedUsers: 0 };

    const newDeadline = new Date(newDeadlineIso);
    const now = new Date();
    const isTerminated = newStatus === "cancelled" || newStatus === "closed" || newDeadline.getTime() <= now.getTime();

    // 1. Fetch pending reminders for this event
    const { data: reminders } = await supabase
      .from("scheduled_reminders")
      .select("*")
      .eq("hackathon_id", hackathonId)
      .eq("status", "pending");

    let updatedReminders = 0;

    if (isTerminated) {
      // Cancel all pending reminders
      const { count } = await supabase
        .from("scheduled_reminders")
        .update({ status: "cancelled" })
        .eq("hackathon_id", hackathonId)
        .eq("status", "pending");
      updatedReminders = count || 0;
    } else {
      // Reschedule reminders for the new deadline
      for (const r of reminders || []) {
        const hoursOffset = r.reminder_type === "48h_before_deadline" ? 48 : 24;
        const newScheduled = new Date(newDeadline.getTime() - hoursOffset * 60 * 60 * 1000);
        
        if (newScheduled.getTime() > now.getTime()) {
          await supabase
            .from("scheduled_reminders")
            .update({
              target_deadline: newDeadline.toISOString(),
              scheduled_for: newScheduled.toISOString(),
              status: "pending",
            })
            .eq("id", r.id);
          updatedReminders++;
        } else {
          // If the new scheduled time is already passed, cancel this specific reminder
          await supabase
            .from("scheduled_reminders")
            .update({ status: "stale" })
            .eq("id", r.id);
        }
      }
    }

    // 2. Notify users who saved this event about status or deadline change
    const { data: savedEntries } = await supabase
      .from("saved_events")
      .select("user_id")
      .eq("hackathon_id", hackathonId);

    const { data: hackathon } = await supabase
      .from("hackathons")
      .select("title, district_name, official_website_url, registration_url, slug")
      .eq("id", hackathonId)
      .single();

    let notifiedUsers = 0;

    if (savedEntries && savedEntries.length > 0 && hackathon) {
      for (const entry of savedEntries) {
        // Fetch user preferences
        const { data: pref } = await supabase
          .from("user_preferences")
          .select("email, notify_email, notify_status_changes")
          .eq("user_id", entry.user_id)
          .single();

        if (!pref || !pref.email || !pref.notify_email || !pref.notify_status_changes) {
          continue;
        }

        const dedupKey = `status_change:${entry.user_id}:${hackathonId}:${newStatus}:${newDeadlineIso}`;
        
        // Check if already sent
        const { data: existingLog } = await supabase
          .from("notification_delivery_logs")
          .select("id")
          .eq("dedup_key", dedupKey)
          .maybeSingle();

        if (existingLog) continue;

        const dateStr = newDeadline.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          timeZone: "Asia/Kolkata",
        });

        const subject = `Update: ${hackathon.title} status is now ${newStatus.replace("_", " ").toUpperCase()}`;
        const html = NotificationProvider.generateEmailTemplate({
          title: subject,
          preheader: `Important update regarding ${hackathon.title} in ${hackathon.district_name}`,
          heading: "Saved Hackathon Status Update",
          contentHtml: `
            <p>You are receiving this update because you saved <strong>${hackathon.title}</strong> on your HackMitra radar.</p>
            <p><strong>Current Status:</strong> ${newStatus.replace("_", " ").toUpperCase()}</p>
            <p><strong>Registration Deadline:</strong> ${dateStr} (IST)</p>
            ${reason ? `<p><strong>Update Note:</strong> ${reason}</p>` : ""}
          `,
          ctaText: "View Event Details",
          ctaUrl: `http://localhost:3000/hackathons/${hackathon.slug}`,
          eventDetails: {
            eventName: hackathon.title,
            organizer: hackathon.district_name,
            district: hackathon.district_name,
            deadline: dateStr,
          },
        });

        const delivery = await NotificationProvider.sendEmail({
          to: pref.email,
          subject,
          html,
          text: `Important update regarding ${hackathon.title}: Status is now ${newStatus}. Deadline: ${dateStr}. Reason: ${reason || "N/A"}.`,
          dedupKey,
        });

        await supabase.from("notification_delivery_logs").insert({
          user_id: entry.user_id,
          recipient_email: pref.email,
          notification_type: "status_or_deadline_change",
          hackathon_id: hackathonId,
          dedup_key: dedupKey,
          subject,
          body_preview: `Status changed to ${newStatus}. Deadline: ${dateStr}`,
          provider: delivery.provider,
          status: delivery.success ? "delivered" : "failed",
          error_message: delivery.error || null,
          metadata: {
            newDeadline: newDeadlineIso,
            newStatus,
            reason: reason || null,
          },
        });

        if (delivery.success) notifiedUsers++;
      }
    }

    return { updatedReminders, notifiedUsers };
  }

  /**
   * Broadcasts notifications to all matching users when a new hackathon is discovered
   * Respects district preferences, theme preferences, and master opt-outs
   */
  public static async notifyUsersOfNewEvent(hackathonId: string): Promise<NotificationResult> {
    assertServerOnly();
    const supabase = createAdminSupabaseClient();
    const result: NotificationResult = { sentCount: 0, skippedCount: 0, failedCount: 0, logs: [] };
    if (!supabase) return result;

    // 1. Fetch event
    const { data: hackathon } = await supabase
      .from("hackathons")
      .select("*")
      .eq("id", hackathonId)
      .single();

    if (!hackathon) return result;

    const deadlineStr = new Date(hackathon.registration_deadline).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });

    // 2. Fetch all users who have preferences set
    const { data: users } = await supabase
      .from("user_preferences")
      .select("*");

    for (const user of users || []) {
      if (!user.email) continue;

      // Check master opt-out
      if (!user.notify_email || !user.notify_new_in_district) {
        result.skippedCount++;
        result.logs.push({
          recipient: user.email,
          type: "new_matching_event",
          status: "skipped_opt_out",
          reason: "User opted out of new event notifications",
        });
        continue;
      }

      // Check District Preference Match:
      // If user specified preferred districts, event district must be in list or match home district
      const hasDistrictMatch =
        (user.preferred_districts && user.preferred_districts.length > 0 && user.preferred_districts.includes(hackathon.district_id)) ||
        (user.home_district_id && user.home_district_id === hackathon.district_id) ||
        (!user.preferred_districts || user.preferred_districts.length === 0); // If no filter, match all

      if (!hasDistrictMatch) {
        result.skippedCount++;
        continue;
      }

      // Check Technology Theme Match:
      if (user.preferred_themes && user.preferred_themes.length > 0) {
        const eventThemes = [...(hackathon.technology_domains || []), ...(hackathon.theme_tags || [])].map((t) => t.toLowerCase());
        const hasThemeMatch = user.preferred_themes.some((theme) =>
          eventThemes.some((et) => et.includes(theme.toLowerCase()))
        );

        if (!hasThemeMatch) {
          result.skippedCount++;
          continue;
        }
      }

      // Check Deduplication Key (Requirement 2: Prevent duplicate notifications)
      const dedupKey = `new_event:${user.user_id}:${hackathon.id}`;
      const { data: existingLog } = await supabase
        .from("notification_delivery_logs")
        .select("id")
        .eq("dedup_key", dedupKey)
        .maybeSingle();

      if (existingLog) {
        result.skippedCount++;
        continue;
      }

      // Format Email
      const subject = `New Hackathon in ${hackathon.district_name}: ${hackathon.title}`;
      const html = NotificationProvider.generateEmailTemplate({
        title: subject,
        preheader: `Newly announced student hackathon in ${hackathon.city}, ${hackathon.district_name}`,
        heading: "New Verified Karnataka Hackathon Announced!",
        contentHtml: `
          <p>A new hackathon matching your district and technology interests has just been verified on HackMitra.</p>
          <p>${hackathon.description.substring(0, 200)}...</p>
        `,
        ctaText: "View Event & Register",
        ctaUrl: `http://localhost:3000/hackathons/${hackathon.slug}`,
        eventDetails: {
          eventName: hackathon.title,
          organizer: hackathon.organizer,
          district: hackathon.district_name,
          deadline: deadlineStr,
          prizePool: hackathon.prize_pool_text,
          format: hackathon.format,
        },
      });

      const delivery = await NotificationProvider.sendEmail({
        to: user.email,
        subject,
        html,
        text: `New Hackathon in ${hackathon.district_name}: ${hackathon.title}. Organizer: ${hackathon.organizer}. Deadline: ${deadlineStr}. Visit: http://localhost:3000/hackathons/${hackathon.slug}`,
        dedupKey,
      });

      // Log Delivery (Requirement 5: Maintain delivery logs)
      await supabase.from("notification_delivery_logs").insert({
        user_id: user.user_id,
        recipient_email: user.email,
        notification_type: "new_matching_event",
        hackathon_id: hackathon.id,
        dedup_key: dedupKey,
        subject,
        body_preview: `New hackathon in ${hackathon.district_name}: ${hackathon.title}`,
        provider: delivery.provider,
        status: delivery.success ? "delivered" : "failed",
        error_message: delivery.error || null,
        metadata: {
          district_id: hackathon.district_id,
          format: hackathon.format,
        },
      });

      if (delivery.success) {
        result.sentCount++;
        result.logs.push({ recipient: user.email, type: "new_matching_event", status: "delivered" });
      } else {
        result.failedCount++;
        result.logs.push({ recipient: user.email, type: "new_matching_event", status: "failed", reason: delivery.error });
      }
    }

    return result;
  }

  /**
   * Processes all pending reminders that have reached their scheduled trigger time
   * Requirement 4: "Receive reminders before verified registration deadlines."
   */
  public static async processPendingReminders(): Promise<NotificationResult> {
    assertServerOnly();
    const supabase = createAdminSupabaseClient();
    const result: NotificationResult = { sentCount: 0, skippedCount: 0, failedCount: 0, logs: [] };
    if (!supabase) return result;

    const nowIso = new Date().toISOString();

    // Select pending reminders where scheduled_for <= now
    const { data: reminders, error } = await supabase
      .from("scheduled_reminders")
      .select("*, hackathons(*)")
      .eq("status", "pending")
      .lte("scheduled_for", nowIso)
      .limit(50);

    if (error || !reminders) return result;

    for (const rem of reminders) {
      const hackathon = rem.hackathons as any;
      if (!hackathon) {
        await supabase.from("scheduled_reminders").update({ status: "stale" }).eq("id", rem.id);
        continue;
      }

      // Check if event is still open
      if (hackathon.current_status === "closed" || hackathon.current_status === "cancelled") {
        await supabase.from("scheduled_reminders").update({ status: "cancelled" }).eq("id", rem.id);
        continue;
      }

      // Fetch user preferences
      const { data: pref } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", rem.user_id)
        .single();

      if (!pref || !pref.email) {
        await supabase.from("scheduled_reminders").update({ status: "stale" }).eq("id", rem.id);
        continue;
      }

      // Check Opt-Outs
      if (!pref.notify_email || !pref.notify_deadline_reminders) {
        await supabase.from("scheduled_reminders").update({ status: "cancelled" }).eq("id", rem.id);
        result.skippedCount++;
        result.logs.push({
          recipient: pref.email,
          type: "deadline_reminder",
          status: "skipped_opt_out",
          reason: "User opted out of deadline reminders",
        });
        continue;
      }

      const hoursLabel = rem.reminder_type === "48h_before_deadline" ? "48 Hours" : "24 Hours";
      const dedupKey = `reminder:${rem.user_id}:${rem.hackathon_id}:${rem.reminder_type}:${rem.target_deadline}`;

      // Check deduplication
      const { data: existingLog } = await supabase
        .from("notification_delivery_logs")
        .select("id")
        .eq("dedup_key", dedupKey)
        .maybeSingle();

      if (existingLog) {
        await supabase.from("scheduled_reminders").update({ status: "sent", last_processed_at: nowIso }).eq("id", rem.id);
        result.skippedCount++;
        continue;
      }

      const deadlineFormatted = new Date(hackathon.registration_deadline).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      });

      const subject = `Urgent: ${hoursLabel} Left to Register for ${hackathon.title}!`;
      const html = NotificationProvider.generateEmailTemplate({
        title: subject,
        preheader: `Only ${hoursLabel} remaining before registration closes for ${hackathon.title}`,
        heading: `Registration Deadline Closing in ${hoursLabel}!`,
        contentHtml: `
          <p>This is a priority deadline reminder for <strong>${hackathon.title}</strong> in ${hackathon.district_name}.</p>
          <p>Registration officially closes at <strong>${deadlineFormatted} (IST)</strong>. Make sure your team completes submission before the portal closes.</p>
        `,
        ctaText: "Complete Registration Now",
        ctaUrl: hackathon.registration_url || `http://localhost:3000/hackathons/${hackathon.slug}`,
        eventDetails: {
          eventName: hackathon.title,
          organizer: hackathon.organizer,
          district: hackathon.district_name,
          deadline: deadlineFormatted,
          prizePool: hackathon.prize_pool_text,
          format: hackathon.format,
        },
      });

      const delivery = await NotificationProvider.sendEmail({
        to: pref.email,
        subject,
        html,
        text: `Reminder: ${hoursLabel} left to register for ${hackathon.title}. Closes at ${deadlineFormatted}. Register here: ${hackathon.registration_url}`,
        dedupKey,
      });

      // Insert delivery log
      await supabase.from("notification_delivery_logs").insert({
        user_id: rem.user_id,
        recipient_email: pref.email,
        notification_type: "deadline_reminder",
        hackathon_id: hackathon.id,
        dedup_key: dedupKey,
        subject,
        body_preview: `${hoursLabel} remaining for ${hackathon.title}`,
        provider: delivery.provider,
        status: delivery.success ? "delivered" : "failed",
        error_message: delivery.error || null,
        metadata: {
          reminder_type: rem.reminder_type,
          deadline: rem.target_deadline,
        },
      });

      // Update reminder record status
      await supabase
        .from("scheduled_reminders")
        .update({
          status: delivery.success ? "sent" : "pending",
          last_processed_at: nowIso,
        })
        .eq("id", rem.id);

      if (delivery.success) {
        result.sentCount++;
        result.logs.push({ recipient: pref.email, type: "deadline_reminder", status: "delivered" });
      } else {
        result.failedCount++;
        result.logs.push({ recipient: pref.email, type: "deadline_reminder", status: "failed", reason: delivery.error });
      }
    }

    return result;
  }

  /**
   * Dispatches a test notification to verify end-to-end delivery
   */
  public static async sendTestNotification(
    userId: string,
    email: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    assertServerOnly();
    const supabase = createAdminSupabaseClient();
    if (!supabase) return { success: false, error: "Database unavailable" };

    const dedupKey = `test_notice:${userId}:${Date.now()}`;
    const subject = "HackMitra Notification Delivery Test - Karnataka Network";
    const html = NotificationProvider.generateEmailTemplate({
      title: subject,
      preheader: "Testing your HackMitra notification delivery channel",
      heading: "Notification Channel Verified!",
      contentHtml: `
        <p>This test confirms that your HackMitra notification pipeline is fully operational.</p>
        <p>You will receive timely alerts for:</p>
        <ul>
          <li>Newly verified hackathons in your preferred Karnataka districts</li>
          <li>Approaching deadlines (48h and 24h reminders)</li>
          <li>Verified schedule extensions or status updates</li>
        </ul>
      `,
      ctaText: "Explore Karnataka Hackathons",
      ctaUrl: "http://localhost:3000/hackathons",
    });

    const delivery = await NotificationProvider.sendEmail({
      to: email,
      subject,
      html,
      text: "HackMitra Notification Delivery Test: Your alert pipeline is active and verified.",
      dedupKey,
    });

    await supabase.from("notification_delivery_logs").insert({
      user_id: userId,
      recipient_email: email,
      notification_type: "test_notification",
      dedup_key: dedupKey,
      subject,
      body_preview: "Notification channel verified",
      provider: delivery.provider,
      status: delivery.success ? "delivered" : "failed",
      error_message: delivery.error || null,
      metadata: { test_run: true },
    });

    return {
      success: delivery.success,
      messageId: delivery.messageId,
      error: delivery.error,
    };
  }
}
