/**
 * HackMitra Automated Discovery & Verification Engine Test Suite
 * 
 * Verifies:
 * 1. Scheduled Execution & Concurrency Mutual Exclusion (Job Locking)
 * 2. Discovery of Newly Announced Hackathons
 * 3. Deduplication (Multi-source linking without duplicate rows)
 * 4. Updating Event Dates & Status on Extended Deadlines / Evidence Changes
 * 5. Approaching Deadline Rechecks & Source Accessibility Guard
 * 6. Stale Data Handling (>48h Overdue Reverification)
 * 7. Recording Failed Checks & Exponential Backoff Retries
 * 8. Distinguishing Integrated vs Inaccessible vs Not Integrated Sources
 * 9. Tracking Last Successful Discovery Timestamp
 * 10. Statewide District Coverage Synchronization (All 31 Districts)
 */

import { createAdminSupabaseClient } from "../src/lib/supabase/admin";
import { discoveryEngine } from "../src/lib/discovery/engine";
import {
  runPriorityDeadlineRechecks,
  markStaleEventsForReverification,
  detectAndApplyDeadlineExtension,
} from "../src/lib/verification/engine";
import { automationScheduler } from "../src/lib/scheduler/worker";
import { processAndIngestEvent } from "../src/lib/discovery/deduplicator";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (detail) console.error(`     Detail: ${detail}`);
    failedCount++;
  }
}

async function runAutomationTests() {
  console.log("==================================================================");
  console.log("🤖 TESTING HACKMITRA AUTOMATION, RETRIES, LOCKING & VERIFICATION");
  console.log("==================================================================\n");

  const adminClient = createAdminSupabaseClient();
  if (!adminClient) {
    console.error("FATAL: Admin Supabase client could not be initialized. Check .env.local");
    process.exit(1);
  }

  // -----------------------------------------------------------------------------
  // TEST GROUP 1: Scheduled Execution & Job Locking (Mutual Exclusion)
  // -----------------------------------------------------------------------------
  console.log("--- TEST GROUP 1: Job Locking & Concurrency Guard ---");
  {
    const lockTestRunId = `lock_test_${Date.now()}`;
    const testSourceId = "devfolio";

    // Simulate an active running job in discovery_runs
    const { data: activeJob } = await adminClient
      .from("discovery_runs")
      .insert({
        source_id: testSourceId,
        status: "running",
        started_at: new Date().toISOString(),
        metadata: { lock_test: true, run_id: lockTestRunId },
      } as any)
      .select("id")
      .single();

    assert(Boolean(activeJob?.id), "Active job lock record created in discovery_runs");

    // Attempt to run discovery without force=true while lock is active
    const report = await discoveryEngine.runSourceDiscovery(testSourceId, { force: false });

    assert(
      report.status === "skipped_locked",
      "Overlapping discovery job was blocked by active lock (status='skipped_locked')"
    );
    assert(
      report.errors.length > 0 && report.errors[0].includes("Concurrent job lock"),
      "Error notes active lock prevented concurrent execution"
    );

    // Clean up test lock
    if (activeJob?.id) {
      await adminClient
        .from("discovery_runs")
        .update({ status: "completed", completed_at: new Date().toISOString() } as any)
        .eq("id", activeJob.id);
    }
  }

  // -----------------------------------------------------------------------------
  // TEST GROUP 2: Discovery of Newly Announced Hackathons
  // -----------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: Discovery Ingestion & Extraction ---");
  {
    const report = await discoveryEngine.runSourceDiscovery("devfolio", {
      maxPages: 1,
      force: true, // bypass backoff for test execution
    });

    assert(
      report.status === "completed",
      "Discovery pipeline executed successfully for Devfolio adapter"
    );
    assert(
      report.totalRawRecords > 0,
      `Raw records extracted from source feed (${report.totalRawRecords} raw records)`
    );
    assert(
      report.eventsCreated >= 0 && report.eventsLinked >= 0,
      `Events processed into database (${report.eventsCreated} created, ${report.eventsLinked} linked)`
    );
  }

  // -----------------------------------------------------------------------------
  // TEST GROUP 3: Deduplication Engine (Multi-Source Linking Without Duplicate Rows)
  // -----------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: Deduplication & Canonical Event Ingestion ---");
  {
    const testSlug = `dedup-test-hackathon-${Date.now()}`;
    const dummyCandidate = {
      rawRecord: {
        externalId: "dedup-ext-101",
        externalUrl: `https://devfolio.co/hackathons/${testSlug}`,
        sourceId: "devfolio",
        rawPayload: { name: "Karnataka AgriTech Sprint" },
        extractedTitle: "Karnataka AgriTech Sprint",
      },
      confidenceScore: 0.95,
      draft: {
        slug: testSlug,
        title: "Karnataka AgriTech Sprint 2026",
        tagline: "Deduplication Verification Event",
        description: "Automated test event for checking duplicate prevention",
        organizer: "Dharwad University of Agricultural Sciences",
        organizer_type: "University" as any,
        city: "Dharwad",
        district_id: "dharwad",
        district_name: "Dharwad (Hubballi-Dharwad)",
        venue: "UAS Dharwad Campus",
        format: "in_person" as any,
        is_beyond_bengaluru: true,
        cluster: "Hubballi-Dharwad-Belagavi",
        official_website_url: `https://devfolio.co/hackathons/${testSlug}`,
        registration_url: `https://devfolio.co/hackathons/${testSlug}`,
        registration_deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
        start_date: new Date(Date.now() + 20 * 86400000).toISOString(),
        end_date: new Date(Date.now() + 22 * 86400000).toISOString(),
        current_status: "open" as any,
        verification_status: "verified" as any,
        last_verified_at: new Date().toISOString(),
        team_size_min: 2,
        team_size_max: 4,
        prize_pool_inr: 150000,
        prize_pool_text: "₹1,50,000",
        is_free: true,
        registration_fee_inr: 0,
        eligibility: "Open to all students",
        technology_domains: ["Agritech", "AI"],
        theme_tags: ["Agriculture", "IoT"],
        is_date_only_deadline: true,
      },
    };

    // First Ingestion -> Should create canonical event
    const firstResult = await processAndIngestEvent(dummyCandidate);
    assert(firstResult.status === "created", "First ingestion creates canonical event row");
    assert(Boolean(firstResult.hackathonId), "Canonical hackathon ID generated");

    // Second Ingestion of same event -> Should LINK, NOT duplicate
    const secondResult = await processAndIngestEvent(dummyCandidate);
    assert(
      secondResult.status === "linked",
      "Second ingestion with identical URL/slug LINKS to existing canonical event"
    );
    assert(
      secondResult.hackathonId === firstResult.hackathonId,
      "Duplicate ingestion resolves to identical canonical hackathon ID"
    );

    // Verify row count in database for this slug is exactly 1
    const { data: rows } = await adminClient
      .from("hackathons")
      .select("id")
      .eq("slug", testSlug);

    assert(rows?.length === 1, "Database contains exactly 1 row (zero duplicate records generated)");

    // Clean up test hackathon
    if (firstResult.hackathonId) {
      await adminClient.from("hackathon_source_records").delete().eq("hackathon_id", firstResult.hackathonId);
      await adminClient.from("verification_logs").delete().eq("hackathon_id", firstResult.hackathonId);
      await adminClient.from("hackathons").delete().eq("id", firstResult.hackathonId);
    }
  }

  // -----------------------------------------------------------------------------
  // TEST GROUP 4: Date & Status Updates on New Evidence (Deadline Extension)
  // -----------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: Evidence-Based Date & Status Updates ---");
  {
    // Find an active or future-dated hackathon in database
    let targetEvent = (await adminClient
      .from("hackathons")
      .select("id, title, registration_deadline, current_status, start_date, end_date")
      .gt("end_date", new Date().toISOString())
      .limit(1)
      .maybeSingle()).data;

    if (!targetEvent) {
      targetEvent = (await adminClient
        .from("hackathons")
        .select("id, title, registration_deadline, current_status, start_date, end_date")
        .limit(1)
        .single()).data;
      if (targetEvent) {
        await adminClient.from("hackathons").update({
          start_date: new Date(Date.now() + 20 * 86400000).toISOString(),
          end_date: new Date(Date.now() + 22 * 86400000).toISOString(),
        } as any).eq("id", targetEvent.id);
      }
    }

    assert(Boolean(targetEvent), "Target event located for deadline extension test");

    if (targetEvent) {
      const originalDeadline = targetEvent.registration_deadline;
      const extendedDeadline = new Date(Date.now() + 15 * 86400000).toISOString();

      const extResult = await detectAndApplyDeadlineExtension(
        targetEvent.id,
        extendedDeadline,
        { evidenceUrl: "https://devfolio.co/announcements/extension", notes: "Organizer extended deadline by 2 weeks" }
      );

      assert(Boolean(extResult), "Deadline extension handler executed successfully");
      assert(
        extResult?.newDeadline === extendedDeadline,
        "Registration deadline timestamp updated to new extended date"
      );
      assert(
        extResult?.newStatus === "open",
        "Current status updated to 'open' based on extended deadline"
      );

      // Verify audit log exists
      const { data: logEntry } = await adminClient
        .from("verification_logs")
        .select("verification_check_type, notes, is_verified")
        .eq("hackathon_id", targetEvent.id)
        .eq("verification_check_type", "extension_detected")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      assert(
        Boolean(logEntry && logEntry.is_verified),
        "Audit history preserved with check type 'extension_detected' in verification_logs"
      );

      // Restore original deadline
      await detectAndApplyDeadlineExtension(targetEvent.id, originalDeadline, { notes: "Restoring original deadline" });
    }
  }

  // -----------------------------------------------------------------------------
  // TEST GROUP 5: Re-verifying Events with Approaching Deadlines
  // -----------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: Approaching Deadline Priority Rechecks ---");
  {
    const priorityChecks = await runPriorityDeadlineRechecks({ limit: 4, skipNetwork: true });

    assert(priorityChecks.length > 0, "Priority deadline recheck worker processed event queue");
    assert(
      priorityChecks.every((p) => Boolean(p.newStatus)),
      "All checked events have strictly evaluated registration statuses"
    );
  }

  // -----------------------------------------------------------------------------
  // TEST GROUP 6: Stale-Data Handling (>48h Overdue Verification)
  // -----------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 6: Stale Event Detection & Reverification ---");
  {
    // Find an event to temporarily mark old
    const { data: eventToStale } = await adminClient
      .from("hackathons")
      .select("id, title, last_verified_at, current_status")
      .in("current_status", ["open", "closing_soon", "upcoming"])
      .limit(1)
      .single();

    assert(Boolean(eventToStale), "Event located for stale-threshold testing");

    if (eventToStale) {
      const originalVerifiedAt = eventToStale.last_verified_at;
      const originalStatus = eventToStale.current_status;

      // Set last_verified_at to 72 hours ago (>48h threshold)
      const pastVerifiedAt = new Date(Date.now() - 72 * 3600 * 1000).toISOString();
      await adminClient
        .from("hackathons")
        .update({ last_verified_at: pastVerifiedAt } as any)
        .eq("id", eventToStale.id);

      // Run stale marker
      const staleResults = await markStaleEventsForReverification({ staleThresholdHours: 48 });

      const foundStale = staleResults.find((s) => s.hackathonId === eventToStale.id);
      assert(Boolean(foundStale), "Event older than 48h was detected and marked stale");

      // Verify status in database
      const { data: updated } = await adminClient
        .from("hackathons")
        .select("current_status")
        .eq("id", eventToStale.id)
        .single();

      assert(updated?.current_status === "stale", "Database status transitioned to 'stale'");

      // Restore original state
      await adminClient
        .from("hackathons")
        .update({
          current_status: originalStatus,
          last_verified_at: originalVerifiedAt,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", eventToStale.id);
    }
  }

  // -----------------------------------------------------------------------------
  // TEST GROUP 7: Recording Failed Checks & Exponential Backoff Retries
  // -----------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 7: Failure Recording & Exponential Backoff ---");
  {
    const failingSourceId = "unstop";

    // Run discovery with simulated failure
    const failReport = await discoveryEngine.runSourceDiscovery(failingSourceId, {
      simulateFailure: true,
      force: true,
    });

    assert(failReport.status === "failed", "Transient failure detected and status='failed'");
    assert(
      (failReport.consecutiveFailures || 0) >= 1,
      `Consecutive failures incremented (count=${failReport.consecutiveFailures})`
    );
    assert(Boolean(failReport.nextRetryAt), "Next retry timestamp calculated with exponential backoff");

    // Check backoff status
    const backoffStatus = await discoveryEngine.checkBackoffStatus(failingSourceId);
    assert(backoffStatus.inBackoff === true, "checkBackoffStatus() indicates source is in backoff cooldown");
    assert(backoffStatus.failureCount >= 1, "Failure count accurately retrieved from historical runs");

    // Attempt discovery without force -> should be skipped due to backoff
    const skippedReport = await discoveryEngine.runSourceDiscovery(failingSourceId, { force: false });
    assert(
      skippedReport.status === "skipped_backoff",
      "Subsequent execution skipped during backoff window (status='skipped_backoff')"
    );

    // Clean up failure run record
    await adminClient
      .from("discovery_runs")
      .update({ status: "completed", error_message: null } as any)
      .eq("id", failReport.runId);
  }

  // -----------------------------------------------------------------------------
  // TEST GROUP 8: Distinguishing Checked vs Inaccessible vs Not Integrated Sources
  // -----------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 8: Distinguishing Integrated vs Unintegrated Sources ---");
  {
    const health = await automationScheduler.getSystemHealth();

    assert(health.integratedSourcesCount >= 2, "Automated sources (Devfolio, Unstop) registered");
    assert(
      health.unintegratedSourcesCount >= 3,
      "Manual/unintegrated sources (VTU Circulars, K-Tech NAIN, HackerEarth) classified"
    );

    const vtuSource = health.sources.find((s) => s.id === "vtu_circular");
    assert(
      vtuSource?.integrationStatus === "manual_only",
      "VTU circular is classified as 'manual_only'"
    );

    const heSource = health.sources.find((s) => s.id === "hackerearth");
    assert(
      heSource?.healthStatus === "inaccessible",
      "HackerEarth is classified as 'inaccessible'"
    );
  }

  // -----------------------------------------------------------------------------
  // TEST GROUP 9: Tracking Last Successful Discovery Timestamp
  // -----------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 9: Last Successful Discovery Timestamp ---");
  {
    const health = await automationScheduler.getSystemHealth();
    assert(
      Boolean(health.lastSuccessfulDiscoveryAt),
      `Last successful discovery timestamp displayed: ${health.lastSuccessfulDiscoveryAt}`
    );
  }

  // -----------------------------------------------------------------------------
  // TEST GROUP 10: Statewide District Coverage Synchronization
  // -----------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 10: Statewide District Coverage Synchronization ---");
  {
    const coverage = await automationScheduler.auditAndSyncDistrictCoverage();

    assert(coverage.totalDistricts === 31, "All 31 Karnataka districts evaluated in audit");
    assert(coverage.activeDistricts > 0, `Active districts with open hackathons: ${coverage.activeDistricts}`);
    assert(
      coverage.zeroDistricts + coverage.activeDistricts + coverage.seekingLeadsDistricts === 31,
      "Sum of active, zero, and seeking leads districts equals 31"
    );
  }

  console.log("\n==================================================================");
  console.log(`AUTOMATION TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAutomationTests().catch((err) => {
  console.error("Test runner exception:", err);
  process.exit(1);
});
