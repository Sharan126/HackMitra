import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { validateExtractedDraft } from "@/lib/discovery/validator";
import { normalizeCanonicalUrl } from "@/lib/discovery/normalizer";
import { KARNATAKA_DISTRICTS } from "@/lib/karnataka-data";
import { mapRowToHackathon } from "@/lib/services/supabase-db";

export const dynamic = "force-dynamic";

/**
 * Administrative Events Query & Manual Creation API
 * Strictly enforces server-side authorization
 */
export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const verificationStatus = searchParams.get("verificationStatus");
  const currentStatus = searchParams.get("currentStatus");
  const search = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

  const adminClient = createAdminSupabaseClient();
  if (!adminClient) {
    return NextResponse.json(
      { success: false, error: "Database client unavailable" },
      { status: 500 }
    );
  }

  try {
    let query = adminClient
      .from("hackathons")
      .select("*", { count: "exact" });

    // 1. Filter by Verification Status (e.g. pending_verification for review queue)
    if (verificationStatus && verificationStatus !== "all") {
      query = query.eq("verification_status", verificationStatus as any);
    }

    // 2. Filter by Current Status (e.g. stale for stale-event review)
    if (currentStatus && currentStatus !== "all") {
      query = query.eq("current_status", currentStatus as any);
    }

    // 3. Search query
    if (search && search.trim() !== "") {
      const q = search.trim();
      query = query.or(
        `title.ilike.%${q}%,slug.ilike.%${q}%,organizer.ilike.%${q}%,city.ilike.%${q}%,district_name.ilike.%${q}%`
      );
    }

    // Sort by created_at descending (newest submissions first)
    query = query.order("created_at", { ascending: false });

    // Range pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const hackathons = (data || []).map(mapRowToHackathon);
    const totalCount = count !== null ? count : hackathons.length;

    return NextResponse.json({
      success: true,
      hackathons,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch administrative events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  const adminClient = createAdminSupabaseClient();
  if (!adminClient) {
    return NextResponse.json(
      { success: false, error: "Database client unavailable" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const reason = (body.reason || "Manual event addition by administrator").trim();

    if (!reason) {
      return NextResponse.json(
        { success: false, error: "Reason for manual submission is mandatory for audit trail" },
        { status: 400 }
      );
    }

    const district = KARNATAKA_DISTRICTS.find(
      (d) => d.id === body.districtId || d.slug === body.districtId
    );

    if (!district) {
      return NextResponse.json(
        { success: false, error: "Invalid Karnataka district specified" },
        { status: 400 }
      );
    }

    const title = (body.title || "").trim();
    const organizer = (body.organizer || "").trim();
    const venue = (body.venue || `${district.name}, Karnataka`).trim();
    const registrationUrl = normalizeCanonicalUrl(body.registrationUrl || "");
    const officialWebsiteUrl = body.officialWebsiteUrl
      ? normalizeCanonicalUrl(body.officialWebsiteUrl)
      : registrationUrl;

    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const slug = `${baseSlug}-${district.id}`;

    const prizeInr = parseInt(String(body.prizePoolInr || 0), 10) || 0;
    const isFree = body.isFree !== false;

    const draft = {
      slug,
      title,
      tagline: body.tagline || `Hackathon hosted in ${district.name}`,
      description: body.description || `${title} organized by ${organizer} in ${district.name}, Karnataka.`,
      organizer,
      organizer_type: body.organizerType || "College",
      city: body.city || district.headquarters,
      district_id: district.id,
      district_name: district.name,
      venue,
      format: body.format || "in_person",
      is_beyond_bengaluru: district.id !== "bengaluru-urban",
      cluster: district.cluster,
      official_website_url: officialWebsiteUrl,
      registration_url: registrationUrl,
      registration_deadline: body.registrationDeadline
        ? new Date(body.registrationDeadline).toISOString()
        : new Date().toISOString(),
      start_date: body.startDate
        ? new Date(body.startDate).toISOString()
        : new Date().toISOString(),
      end_date: body.endDate
        ? new Date(body.endDate).toISOString()
        : new Date().toISOString(),
      eligibility: body.eligibility || "Open to all engineering students across Karnataka",
      team_size_min: parseInt(String(body.teamSizeMin || 1), 10) || 1,
      team_size_max: parseInt(String(body.teamSizeMax || 4), 10) || 4,
      prize_pool_text: prizeInr > 0 ? `₹${prizeInr.toLocaleString("en-IN")}` : "Certificates & Incubation",
      prize_pool_inr: prizeInr,
      is_free: isFree,
      registration_fee_inr: isFree ? 0 : parseInt(String(body.registrationFeeInr || 0), 10) || 0,
      technology_domains: Array.isArray(body.technologyDomains)
        ? body.technologyDomains
        : ["Software", "Student Hackathon"],
      theme_tags: Array.isArray(body.themeTags) ? body.themeTags : [district.name, "Moderator Submission"],
      current_status: (body.currentStatus || "open") as any,
      verification_status: "verified" as any, // Moderator submissions are pre-authenticated
      last_verified_at: new Date().toISOString(),
      source_proof_url: officialWebsiteUrl,
      verification_notes: `Manually added by moderator ${auth.user.email}. Reason: ${reason}`,
      is_date_only_deadline: Boolean(body.isDateOnlyDeadline),
      rounds: body.rounds || [],
    };

    // Validate draft
    const validation = validateExtractedDraft(draft);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(", ") },
        { status: 400 }
      );
    }

    // Insert into hackathons table
    const { data: newHackathon, error: insertError } = await adminClient
      .from("hackathons")
      .insert(draft as any)
      .select("id")
      .single();

    if (insertError || !newHackathon) {
      return NextResponse.json(
        { success: false, error: insertError?.message || "Failed to create hackathon record" },
        { status: 500 }
      );
    }

    // Insert moderator audit log
    await adminClient.from("verification_logs").insert({
      hackathon_id: newHackathon.id,
      verifier_type: "moderator",
      verifier_identity: auth.user.email,
      new_status: draft.current_status,
      verification_check_type: "manual_audit",
      is_verified: true,
      notes: `Manual event creation by ${auth.user.email}. Reason: ${reason}`,
      metadata: {
        is_admin_override: true,
        creator_email: auth.user.email,
        reason,
        creation_timestamp: new Date().toISOString(),
      },
    } as any);

    return NextResponse.json({
      success: true,
      message: "Hackathon manually created and verified",
      hackathonId: newHackathon.id,
      slug: draft.slug,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create event" },
      { status: 500 }
    );
  }
}
