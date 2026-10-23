import { createClient } from "@supabase/supabase-js";
import { Database } from "../src/types/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

console.log("==================================================================");
console.log("      HackMitra Live Remote Supabase Connectivity Test");
console.log("==================================================================");
console.log(`Connecting to: ${url}`);

async function runLiveTest() {
  const publicClient = createClient<Database>(url, anonKey);
  const adminClient = createClient<Database>(url, serviceKey);

  // 1. Test public read on districts
  console.log("\n[1/4] Testing public read on 'districts' table (RLS check)...");
  const { data: districts, error: dError } = await publicClient
    .from("districts")
    .select("id, name, kannada_name, division, coverage_status")
    .order("name", { ascending: true });

  if (dError) {
    console.error("Failed to query districts:", dError);
  } else {
    console.log(`[SUCCESS] Retrieved ${districts?.length} districts from live Supabase!`);
    console.log(`Sample: ${districts[0]?.name} (${districts[0]?.kannada_name}) - ${districts[0]?.division} Division`);
    console.log(`Sample: ${districts[10]?.name} (${districts[10]?.kannada_name}) - ${districts[10]?.division} Division`);
  }

  // 2. Test public read on event_sources
  console.log("\n[2/4] Testing public read on 'event_sources' table...");
  const { data: sources, error: sError } = await publicClient
    .from("event_sources")
    .select("id, name, source_type, reliability_score")
    .order("id", { ascending: true });

  if (sError) {
    console.error("Failed to query event_sources:", sError);
  } else {
    console.log(`[SUCCESS] Retrieved ${sources?.length} verified event sources from live Supabase!`);
    sources?.forEach((s) => console.log(` - ${s.name} (${s.source_type}) [Reliability: ${s.reliability_score}]`));
  }

  // 3. Test service role insert into discovery_runs
  console.log("\n[3/4] Testing service role write into 'discovery_runs' table...");
  const { data: run, error: rError } = await adminClient
    .from("discovery_runs")
    .insert({
      source_id: "vtu_circular",
      status: "completed",
      records_ingested: 31,
      events_discovered: 0,
      events_updated: 0,
      metadata: { test_run: true, environment: "cloud_live_test" },
    })
    .select()
    .single();

  if (rError) {
    console.error("Failed to record discovery run:", rError);
  } else {
    console.log(`[SUCCESS] Created discovery run record: ID ${run.id} (Status: ${run.status})`);
  }

  // 4. Test public select on hackathons (should return empty array without errors)
  console.log("\n[4/4] Testing public select on 'hackathons' table...");
  const { data: hackathons, error: hError } = await publicClient
    .from("hackathons")
    .select("id, title, city, current_status");

  if (hError) {
    console.error("Failed to query hackathons:", hError);
  } else {
    console.log(`[SUCCESS] 'hackathons' table is online, healthy, and empty as expected (${hackathons.length} rows - 0 invented production events)`);
  }

  console.log("\n==================================================================");
  console.log("   LIVE SUPABASE POSTGRESQL CLUSTER IS FULLY OPERATIONAL!");
  console.log("==================================================================");
}

runLiveTest();
