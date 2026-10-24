/**
 * Synchronizes high-fidelity Karnataka hackathon fixtures into live Supabase database
 * Ensures all districts, statuses, organizer types, and domains are represented.
 */

import { createClient } from "@supabase/supabase-js";
import { HACKATHON_FIXTURES } from "../src/data/fixtures/hackathons";
import { Database } from "../src/types/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

async function syncFixtures() {
  console.log("==================================================================");
  console.log("🔄 SYNCING CURATED KARNATAKA FIXTURES INTO SUPABASE DATABASE");
  console.log("==================================================================\n");

  const adminClient = createClient<Database>(url, serviceKey);

  for (const item of HACKATHON_FIXTURES) {
    // Parse team size min and max
    let minTeam = 1;
    let maxTeam = 4;
    const match = item.teamSize.match(/(\d+)\s*-\s*(\d+)/);
    if (match) {
      minTeam = parseInt(match[1], 10);
      maxTeam = parseInt(match[2], 10);
    } else if (item.teamSize.includes("1")) {
      minTeam = 1;
      maxTeam = 1;
    }

    // Determine start and end dates
    const startIso = new Date(item.startDate).toISOString();
    const endIso = new Date(item.endDate).toISOString();
    const deadlineIso = new Date(item.registrationDeadline).toISOString();

    const record = {
      slug: item.slug,
      title: item.title,
      tagline: item.tagline || null,
      description: item.description,
      organizer: item.organizer,
      organizer_type: item.organizerType as any,
      city: item.city,
      district_id: item.districtId,
      district_name: item.districtName,
      venue: item.venue,
      format: item.format,
      is_beyond_bengaluru: item.isBeyondBengaluru,
      cluster: item.cluster,
      official_website_url: item.officialWebsiteUrl,
      registration_url: item.registrationUrl,
      registration_deadline: deadlineIso,
      start_date: startIso,
      end_date: endIso,
      eligibility: item.eligibility || "Open to all students across Karnataka engineering and polytechnic colleges",
      team_size_min: minTeam,
      team_size_max: maxTeam,
      prize_pool_text: item.prizePool,
      prize_pool_inr: item.prizePoolInr || 0,
      is_free: item.isFree,
      registration_fee_inr: item.isFree ? 0 : 250,
      fee_amount_text: item.feeAmount || null,
      technology_domains: item.themeTags,
      theme_tags: item.themeTags,
      current_status: item.registrationStatus as any,
      verification_status: "verified" as any,
      last_verified_at: new Date().toISOString(),
      source_proof_url: item.sourceProofUrl,
      rounds: item.rounds || [],
      is_date_only_deadline: item.isDateOnlyDeadline ?? false,
      registration_deadline_raw: item.registrationDeadlineRaw || null,
      verification_notes: item.verificationNotes || "Moderator verified canonical event",
    };

    const { data, error } = await adminClient
      .from("hackathons")
      .upsert(record as any, { onConflict: "slug" })
      .select("id, slug, title")
      .single();

    if (error) {
      console.error(`❌ Failed to upsert ${item.slug}:`, error.message);
    } else {
      console.log(`✅ Synced: ${data?.title} (${data?.slug})`);
    }
  }

  console.log("\n==================================================================");
  console.log("🎉 FIXTURE SYNC COMPLETE");
  console.log("==================================================================");
}

syncFixtures().catch(console.error);
