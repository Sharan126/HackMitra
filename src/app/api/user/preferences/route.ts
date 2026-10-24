import { NextRequest, NextResponse } from "next/server";
import { requireUserAuth } from "@/lib/auth/user-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * User Preferences Endpoint
 * 
 * GET: Retrieves user's notification toggles, preferred districts, and themes
 * PUT: Updates preferences with strict schema validation
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

  const { data: preferences, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return default profile if user has not yet customized
  const defaultProfile = {
    user_id: auth.user.id,
    email: auth.user.email,
    home_district_id: null,
    preferred_districts: [],
    preferred_themes: [],
    notify_email: true,
    notify_deadline_reminders: true,
    notify_new_in_district: true,
    notify_status_changes: true,
  };

  return NextResponse.json({
    preferences: preferences || defaultProfile,
  });
}

export async function PUT(request: NextRequest) {
  const auth = await requireUserAuth(request);
  if ("response" in auth) return auth.response;

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }

  try {
    const body = await request.json();

    const email = typeof body.email === "string" && body.email.includes("@") ? body.email.trim() : auth.user.email;
    const homeDistrictId = typeof body.home_district_id === "string" ? body.home_district_id : null;
    const preferredDistricts = Array.isArray(body.preferred_districts) ? body.preferred_districts : [];
    const preferredThemes = Array.isArray(body.preferred_themes) ? body.preferred_themes : [];
    const notifyEmail = typeof body.notify_email === "boolean" ? body.notify_email : true;
    const notifyDeadlineReminders = typeof body.notify_deadline_reminders === "boolean" ? body.notify_deadline_reminders : true;
    const notifyNewInDistrict = typeof body.notify_new_in_district === "boolean" ? body.notify_new_in_district : true;
    const notifyStatusChanges = typeof body.notify_status_changes === "boolean" ? body.notify_status_changes : true;

    const { data: updated, error } = await supabase
      .from("user_preferences")
      .upsert({
        user_id: auth.user.id,
        email,
        home_district_id: homeDistrictId,
        preferred_districts: preferredDistricts,
        preferred_themes: preferredThemes,
        notify_email: notifyEmail,
        notify_deadline_reminders: notifyDeadlineReminders,
        notify_new_in_district: notifyNewInDistrict,
        notify_status_changes: notifyStatusChanges,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Notification preferences and district filters updated successfully.",
      preferences: updated,
    });
  } catch {
    return NextResponse.json(
      { error: "Bad request", message: "Invalid JSON payload" },
      { status: 400 }
    );
  }
}
