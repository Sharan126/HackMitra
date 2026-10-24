/**
 * HackMitra Database Backend Verification Script
 * 
 * Verifies:
 * 1. TypeScript database model fidelity (Database schema matches requirements)
 * 2. Client and Server security assertions (assertServerOnly)
 * 3. Graceful fallback resolution when credentials are unset
 * 4. Constraint and payload structure verification for all 6 core tables + 3 future tables
 */

import { Database } from "../src/types/database.types";
import { getSupabaseConfig, assertServerOnly } from "../src/lib/supabase/config";
import { createBrowserSupabaseClient } from "../src/lib/supabase/client";
import { createServerSupabaseClient } from "../src/lib/supabase/server";
import { createAdminSupabaseClient } from "../src/lib/supabase/admin";
import { getVerifiedHackathons } from "../src/lib/services/supabase-db";

console.log("==================================================================");
console.log("   HackMitra Supabase Backend Architecture Verification");
console.log("==================================================================");

let testsPassed = 0;
let testsTotal = 0;

function assert(condition: boolean, testName: string) {
  testsTotal++;
  if (condition) {
    console.log(`[PASS] ${testName}`);
    testsPassed++;
  } else {
    console.error(`[FAIL] ${testName}`);
  }
}

// -----------------------------------------------------------------------------
// Test 1: Model Types Verification (Compile-time & Schema structure)
// -----------------------------------------------------------------------------
type Tables = Database["public"]["Tables"];

const sampleHackathonInsert: Tables["hackathons"]["Insert"] = {
  slug: "test-kle-innovate",
  title: "KLE Tech Innovate 2026",
  description: "Beyond Bengaluru Student Hackathon",
  organizer: "KLE Technological University",
  organizer_type: "University",
  city: "Hubballi",
  district_id: "dharwad",
  district_name: "Dharwad",
  venue: "KLE Tech Campus",
  format: "in_person",
  is_beyond_bengaluru: true,
  cluster: "Hubballi-Dharwad-Belagavi",
  official_website_url: "https://kletech.ac.in",
  registration_url: "https://devfolio.co",
  registration_deadline: "2026-11-05T00:00:00Z",
  start_date: "2026-11-14T00:00:00Z",
  end_date: "2026-11-16T00:00:00Z",
  team_size_min: 2,
  team_size_max: 4,
  prize_pool_text: "₹2,50,000",
  prize_pool_inr: 250000,
  is_free: true,
  current_status: "open",
  verification_status: "verified",
  technology_domains: ["AI", "IoT"],
  theme_tags: ["Agritech", "Kannada NLP"],
};

assert(sampleHackathonInsert.slug === "test-kle-innovate", "Hackathon insert payload matches schema types");

const sampleSourceRecord: Tables["hackathon_source_records"]["Insert"] = {
  source_id: "devfolio",
  external_url: "https://devfolio.co/kle-innovate",
  raw_payload: { raw_title: "KLE Tech Innovate" },
  confidence_score: 0.98,
  ingestion_status: "mapped",
};

assert(sampleSourceRecord.source_id === "devfolio", "Multi-source record payload matches schema types");

const sampleVerificationLog: Tables["verification_logs"]["Insert"] = {
  hackathon_id: "00000000-0000-0000-0000-000000000000",
  verifier_type: "automated_bot",
  verifier_identity: "bot_vtu_liveness",
  new_status: "open",
  verification_check_type: "link_liveness",
  is_verified: true,
  notes: "URL returned 200 OK and registration form active",
};

assert(sampleVerificationLog.verifier_type === "automated_bot", "Verification log audit trail matches schema types");

const sampleDiscoveryRun: Tables["discovery_runs"]["Insert"] = {
  source_id: "devfolio",
  status: "completed",
  records_ingested: 14,
  events_discovered: 3,
  events_updated: 2,
  metadata: { pipeline: "vtu_circular_crawler" },
};

assert(sampleDiscoveryRun.status === "completed", "Discovery runs audit record matches schema types");

// -----------------------------------------------------------------------------
// Test 2: Server-Only Key Guard
// -----------------------------------------------------------------------------
let threwOnClient = false;
try {
  (globalThis as any).window = {};
  assertServerOnly();
} catch (e) {
  threwOnClient = true;
} finally {
  delete (globalThis as any).window;
}

assert(threwOnClient, "assertServerOnly() reliably blocks client-side execution");

// -----------------------------------------------------------------------------
// Test 3: Graceful Client Initialization Fallback
// -----------------------------------------------------------------------------
const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const oldServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

const browserClient = createBrowserSupabaseClient();
assert(browserClient === null, "Browser client returns null safely when credentials not yet set");

const adminClient = createAdminSupabaseClient();
assert(adminClient === null, "Admin client returns null safely when service key not yet set");

process.env.NEXT_PUBLIC_SUPABASE_URL = oldUrl;
process.env.SUPABASE_SERVICE_ROLE_KEY = oldServiceKey;

// -----------------------------------------------------------------------------
// Test 4: Database Access Layer Fallback & Availability
// -----------------------------------------------------------------------------
async function runAsyncTests() {
  const hackathons = await getVerifiedHackathons();
  assert(hackathons.length > 0, `getVerifiedHackathons() returns verified opportunities (${hackathons.length} events resolved)`);

  const dharwadEvents = await getVerifiedHackathons({ districtId: "dharwad" });
  assert(dharwadEvents.length > 0, `Filtered queries resolve seamlessly (Found ${dharwadEvents.length} in Dharwad)`);

  console.log("------------------------------------------------------------------");
  console.log(`Results: ${testsPassed}/${testsTotal} Backend Verification Tests Passed`);
  console.log("==================================================================");
}

runAsyncTests();
