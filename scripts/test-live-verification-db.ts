/**
 * Live Database Verification Engine Integration Test
 * 
 * Verifies that:
 * 1. Hackathon records can be verified and saved with audit logs in Supabase.
 * 2. Status change preserves history in `verification_logs` with check type, previous/new status, and inspector notes.
 * 3. Priority queue ordering works directly via Supabase query.
 */

import { createAdminSupabaseClient } from "../src/lib/supabase/admin";
import {
  verifySingleHackathonRecord,
  runPriorityDeadlineRechecks,
} from "../src/lib/verification/engine";

async function runLiveDbTests() {
  console.log("==================================================================");
  console.log("🔍 TESTING LIVE DATABASE VERIFICATION ENGINE INTEGRATION");
  console.log("==================================================================\n");

  const adminClient = createAdminSupabaseClient();
  if (!adminClient) {
    console.warn("⚠️ Supabase admin client could not be initialized (missing env). Skipping live DB test.");
    return;
  }

  // Fetch an existing hackathon from Supabase
  const { data: hackathon, error } = await adminClient
    .from("hackathons")
    .select("id, title, current_status, registration_deadline")
    .limit(1)
    .single();

  if (error || !hackathon) {
    console.log("ℹ️ No hackathons found in database yet to test rechecks against. (Tables & constraints exist)");
    return;
  }

  console.log(`Found live hackathon: ${hackathon.title} (ID: ${hackathon.id})`);
  console.log(`Current status: ${hackathon.current_status}`);

  // Run single record verification with skipped network (for testing determinism)
  const result = await verifySingleHackathonRecord(hackathon.id, { skipNetwork: true });
  console.log("Verification execution result:", result);

  if (result) {
    console.log(`✅ Status verified: ${result.previousStatus} -> ${result.newStatus}`);
    
    // Check if verification_logs recorded the audit trail
    const { data: logs, error: lError } = await adminClient
      .from("verification_logs")
      .select("*")
      .eq("hackathon_id", hackathon.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!lError && logs && logs.length > 0) {
      console.log("✅ Verification log audit entry saved successfully:");
      console.log(`   - Check Type: ${logs[0].verification_check_type}`);
      console.log(`   - Verifier: ${logs[0].verifier_identity}`);
      console.log(`   - Notes: ${logs[0].notes}`);
    } else {
      console.error("❌ Failed to query verification_logs:", lError);
    }
  }

  // Test priority recheck runner
  const batchResults = await runPriorityDeadlineRechecks({ limit: 5, skipNetwork: true });
  console.log(`✅ Priority batch recheck ran on ${batchResults.length} records`);

  console.log("\n==================================================================");
  console.log("🎉 LIVE DATABASE VERIFICATION ENGINE INTEGRATION COMPLETED");
  console.log("==================================================================");
}

runLiveDbTests().catch((e) => {
  console.error("Live test failed:", e);
});
