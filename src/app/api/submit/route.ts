import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { normalizeKarnatakaLocation, normalizeCanonicalUrl } from "@/lib/discovery/normalizer";
import { validateExtractedDraft } from "@/lib/discovery/validator";
import { KARNATAKA_DISTRICTS } from "@/lib/karnataka-data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const adminClient = createAdminSupabaseClient();

    // 1. Geographic normalization
    const district = KARNATAKA_DISTRICTS.find(
      (d) => d.id === body.districtId || d.slug === body.districtId
    );

    if (!district) {
      return NextResponse.json(
        { success: false, error: "Invalid district selection" },
        { status: 400 }
      );
    }

    const title = (body.title || "").trim();
    const organizer = (body.organizer || "").trim();
    const venue = (body.venue || `${district.name}, Karnataka`).trim();
    const registrationUrl = normalizeCanonicalUrl(body.registrationUrl || "");
    const sourceProofUrl = body.sourceProofUrl ? normalizeCanonicalUrl(body.sourceProofUrl) : registrationUrl;

    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const slug = `${baseSlug}-${district.id}`;

    const draft = {
      slug,
      title,
      tagline: body.tagline || `Hackathon hosted in ${district.name}`,
      description: body.description || `${title} organized by ${organizer} in ${district.name}, Karnataka.`,
      organizer,
      organizer_type: (body.organizerType === "university" ? "University" : "College") as any,
      city: body.city || district.headquarters,
      district_id: district.id,
      district_name: district.name,
      venue,
      format: (body.mode || "in_person") as any,
      is_beyond_bengaluru: district.id !== "bengaluru-urban",
      cluster: district.cluster,
      official_website_url: sourceProofUrl,
      registration_url: registrationUrl,
      registration_deadline: body.registrationDeadline ? new Date(body.registrationDeadline).toISOString() : new Date().toISOString(),
      start_date: body.startDate ? new Date(body.startDate).toISOString() : new Date().toISOString(),
      end_date: body.endDate ? new Date(body.endDate).toISOString() : new Date().toISOString(),
      eligibility: "Open to engineering, polytechnic, and university students across Karnataka",
      team_size_min: 1,
      team_size_max: 4,
      prize_pool_text: body.prizePool || "₹0",
      prize_pool_inr: 0,
      is_free: body.isFree !== false,
      registration_fee_inr: 0,
      technology_domains: ["Student Hackathon", "Innovation"],
      theme_tags: ["Campus Submission", district.name],
      current_status: "open" as any,
      verification_status: "pending_verification" as any, // Requires moderator review before public listing
      last_verified_at: new Date().toISOString(),
      source_proof_url: sourceProofUrl,
      rounds: [],
    };

    // 2. Validate draft
    const validation = validateExtractedDraft(draft);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(", ") },
        { status: 400 }
      );
    }

    // 3. Insert into Supabase if configured
    if (adminClient) {
      // Check for duplicate URL
      const { data: existing } = await adminClient
        .from("hackathons")
        .select("id")
        .or(`registration_url.eq.${registrationUrl},official_website_url.eq.${sourceProofUrl}`)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({
          success: true,
          message: "Event with this registration link is already tracked on HackMitra",
          hackathonId: existing.id,
          isDuplicate: true,
        });
      }

      const { data: newHackathon, error: insertError } = await adminClient
        .from("hackathons")
        .insert(draft as any)
        .select("id")
        .single();

      if (insertError) {
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 500 }
        );
      }

      // Record in hackathon_source_records
      await adminClient.from("hackathon_source_records").insert({
        hackathon_id: newHackathon.id,
        source_id: "campus_scout_submission",
        external_url: sourceProofUrl,
        raw_payload: {
          submitter_email: body.submitterEmail,
          submitter_role: body.submitterRole,
          raw_submission: body,
        },
        extracted_title: title,
        ingestion_status: "mapped",
        confidence_score: 0.90,
      } as any);

      // Record initial verification log
      await adminClient.from("verification_logs").insert({
        hackathon_id: newHackathon.id,
        verifier_type: "campus_scout",
        verifier_identity: body.submitterEmail || "anonymous_student_lead",
        new_status: "pending_verification",
        verification_check_type: "circular_proof_check",
        is_verified: false,
        notes: `Submitted by ${body.submitterRole || "student lead"} with proof URL ${sourceProofUrl}`,
      } as any);

      return NextResponse.json({
        success: true,
        message: "Hackathon submitted successfully and queued for verification",
        hackathonId: newHackathon.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Hackathon queued for institutional verification",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process submission" },
      { status: 500 }
    );
  }
}
