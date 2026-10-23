import { normalizeCanonicalUrl, normalizeKarnatakaLocation } from "../src/lib/discovery/normalizer";
import { validateExtractedDraft } from "../src/lib/discovery/validator";
import { DevfolioAdapter } from "../src/lib/discovery/adapters/devfolio";
import { DiscoveryEngine } from "../src/lib/discovery/engine";
import { createAdminSupabaseClient } from "../src/lib/supabase/admin";

console.log("==================================================================");
console.log("     HackMitra Discovery Engine Verification Test Suite");
console.log("==================================================================");

let passed = 0;
let total = 0;

function assert(cond: boolean, name: string) {
  total++;
  if (cond) {
    console.log(`[PASS] ${name}`);
    passed++;
  } else {
    console.error(`[FAIL] ${name}`);
  }
}

// -----------------------------------------------------------------------------
// 1. URL Normalization Tests
// -----------------------------------------------------------------------------
console.log("\n--- Testing Canonical URL Normalization ---");
const rawUrl1 = "https://Devfolio.co/hackathons/the-big-hack-2/?utm_source=twitter&utm_medium=social&ref=123#schedule";
const cleanUrl1 = normalizeCanonicalUrl(rawUrl1);
assert(cleanUrl1 === "https://devfolio.co/hackathons/the-big-hack-2", `URL tracking params stripped: ${cleanUrl1}`);

// -----------------------------------------------------------------------------
// 2. Geographic Normalization Tests
// -----------------------------------------------------------------------------
console.log("\n--- Testing Karnataka Geographic Normalizer ---");

const dharwadLoc = normalizeKarnatakaLocation("Hubballi", "Karnataka", "KLE Tech Campus, Vidyanagar");
assert(dharwadLoc.isKarnataka && dharwadLoc.districtId === "dharwad", `Hubballi normalized to 'dharwad' (${dharwadLoc.division} Div)`);

const coastalLoc = normalizeKarnatakaLocation("Surathkal", "Karnataka", "NITK Campus, Srinivasnagar, Mangaluru");
assert(coastalLoc.isKarnataka && coastalLoc.districtId === "dakshina-kannada", `Surathkal normalized to 'dakshina-kannada'`);

const manipalLoc = normalizeKarnatakaLocation("Manipal", "Karnataka", "MIT Manipal campus");
assert(manipalLoc.isKarnataka && manipalLoc.districtId === "udupi", `Manipal normalized to 'udupi'`);

const nonKarLoc = normalizeKarnatakaLocation("Vellore", "Tamil Nadu", "VIT University, Vellore");
assert(!nonKarLoc.isKarnataka, `Non-Karnataka location correctly rejected (Vellore, Tamil Nadu)`);

// -----------------------------------------------------------------------------
// 3. Validator Tests
// -----------------------------------------------------------------------------
console.log("\n--- Testing Structured Event Validator ---");
const validDraft = {
  title: "HackVerse 5.0",
  description: "Coastal innovation marathon at NITK Surathkal",
  organizer: "NITK Surathkal",
  district_id: "dakshina-kannada",
  format: "in_person" as const,
  registration_url: "https://devfolio.co/hackverse",
  official_website_url: "https://devfolio.co/hackverse",
  start_date: "2026-11-20T00:00:00Z",
  end_date: "2026-11-22T00:00:00Z",
  registration_deadline: "2026-11-10T00:00:00Z",
};
const valResult = validateExtractedDraft(validDraft);
assert(valResult.isValid, "Valid draft passes validation");

const invalidDraft = {
  title: "X",
  district_id: "non_existent_district",
  start_date: "2026-12-01T00:00:00Z",
  end_date: "2026-11-01T00:00:00Z", // end before start
};
const invalidResult = validateExtractedDraft(invalidDraft);
assert(!invalidResult.isValid && invalidResult.errors.length >= 3, `Invalid draft rejected with ${invalidResult.errors.length} errors`);

// -----------------------------------------------------------------------------
// 4. Live Adapter & Pipeline Execution Test
// -----------------------------------------------------------------------------
console.log("\n--- Testing Live Adapter & Discovery Pipeline ---");

async function runLivePipeline() {
  const engine = new DiscoveryEngine();
  console.log(`Registered Adapters: ${engine.getRegisteredAdapters().join(", ")}`);

  console.log("Executing live Devfolio discovery extraction (Page 1)...");
  const report = await engine.runSourceDiscovery("devfolio", { maxPages: 1 });

  console.log("\nDiscovery Pipeline Execution Summary:");
  console.log(`- Status: ${report.status}`);
  console.log(`- Total Raw Records Inspected: ${report.totalRawRecords}`);
  console.log(`- Karnataka Candidates Matched: ${report.karnatakaCandidatesMatched}`);
  console.log(`- Canonical Events Created in Supabase: ${report.eventsCreated}`);
  console.log(`- Events Linked (Multi-Source / Deduplicated): ${report.eventsLinked}`);
  console.log(`- Duration: ${report.durationMs}ms`);

  assert(report.totalRawRecords > 0, `Devfolio adapter extracted ${report.totalRawRecords} raw records from live public API`);
  assert(report.karnatakaCandidatesMatched > 0, `Normalizer matched ${report.karnatakaCandidatesMatched} authentic Karnataka events`);

  // Verify against Supabase
  const adminClient = createAdminSupabaseClient();
  if (adminClient) {
    const { data: dbHackathons } = await adminClient
      .from("hackathons")
      .select("id, title, city, district_name, source_proof_url");

    console.log(`\nVerified Hackathons in Remote Database: ${dbHackathons?.length || 0}`);
    dbHackathons?.slice(0, 5).forEach((h, i) => {
      console.log(` [${i+1}] ${h.title} | ${h.city} (${h.district_name}) -> Proof: ${h.source_proof_url}`);
    });

    const { data: dbSources } = await adminClient
      .from("hackathon_source_records")
      .select("id, external_url, ingestion_status");

    console.log(`Verified Source Evidence Records in Remote Database: ${dbSources?.length || 0}`);

    assert((dbHackathons?.length || 0) > 0, `Database has ${dbHackathons?.length} authentic hackathons`);
    assert((dbSources?.length || 0) > 0, `Database has ${dbSources?.length} linked source records`);

    // Test Deduplication: Run again and verify eventsLinked increases while eventsCreated is 0
    console.log("\nTesting Deduplication & Multi-Source Re-run...");
    const rerunReport = await engine.runSourceDiscovery("devfolio", { maxPages: 1 });
    console.log(`- Re-run Events Created: ${rerunReport.eventsCreated} (Expected 0)`);
    console.log(`- Re-run Events Linked: ${rerunReport.eventsLinked} (Expected > 0)`);

    assert(rerunReport.eventsCreated === 0, "Deduplicator prevented duplicate hackathons on second run");
    assert(rerunReport.eventsLinked > 0, "Existing events were cleanly linked and updated with fresh timestamps");
  }

  console.log("\n==================================================================");
  console.log(`Results: ${passed}/${total} Discovery Engine Tests Passed!`);
  console.log("==================================================================");
}

runLivePipeline();
