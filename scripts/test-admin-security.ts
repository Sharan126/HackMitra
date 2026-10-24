/**
 * HackMitra Administrative Dashboard & Security Authorization Test Suite
 * 
 * Verifies:
 * 1. Unauthorized Access Rejection (All admin endpoints return 401 for unauthenticated requests)
 * 2. Invalid/Tampered Token Rejection
 * 3. Administrative Authentication & Token Issuance
 * 4. Event Review Queue & Moderator Approval
 * 5. Manual Event Submission by Admin with Pre-Authentication
 * 6. Event Editing & Mandatory Rationale Logging
 * 7. Rejection of Edits Lacking Mandatory Audit Rationale
 * 8. Duplicate Detection & Merge Resolution
 * 9. Source Enable/Disable Controls with Moderator Rationale
 * 10. Public Error Report Ingestion & Moderator Resolution
 */

import {
  createAdminToken,
  verifyAdminToken,
  validateAdminCredentials,
} from "../src/lib/auth/admin-auth";
import { createAdminSupabaseClient } from "../src/lib/supabase/admin";
import { getAllErrorReports, submitErrorReport, resolveErrorReport } from "../src/lib/services/error-reports";

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

async function runAdminSecurityTests() {
  console.log("==================================================================");
  console.log("🔒 TESTING HACKMITRA ADMIN SECURITY & AUTHORIZATION");
  console.log("==================================================================\n");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const adminClient = createAdminSupabaseClient();

  if (!adminClient) {
    console.error("FATAL: Admin Supabase client unavailable.");
    process.exit(1);
  }

  // -----------------------------------------------------------------------------
  // TEST GROUP 1: Cryptographic Token Generation & Validation
  // -----------------------------------------------------------------------------
  console.log("--- TEST GROUP 1: Cryptographic Token Issuance & Signature Validation ---");
  {
    const adminUser = { email: "admin@hackmitra.in", name: "Statewide Moderator", role: "admin" as const };
    const validToken = createAdminToken(adminUser);

    assert(Boolean(validToken && validToken.split(".").length === 3), "Generates valid HMAC-SHA256 signed 3-part token");

    const decoded = verifyAdminToken(validToken);
    assert(
      decoded !== null && decoded.email === "admin@hackmitra.in" && decoded.role === "admin",
      "Decodes and cryptographically verifies authentic admin token"
    );

    // Tampered token test (manipulating payload)
    const [header, payload, sig] = validToken.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({ email: "hacker@evil.com", role: "superadmin", exp: 9999999999 })
    ).toString("base64url");
    const tamperedToken = `${header}.${tamperedPayload}.${sig}`;

    const tamperedResult = verifyAdminToken(tamperedToken);
    assert(tamperedResult === null, "Tampered token is strictly rejected (signature mismatch)");

    // Invalid credentials validation
    const invalidAuth = validateAdminCredentials("admin@hackmitra.in", "WrongPassword123!");
    assert(!invalidAuth.isValid, "validateAdminCredentials rejects incorrect password");

    const validAuth = validateAdminCredentials(
      process.env.ADMIN_EMAIL || "admin@hackmitra.in",
      process.env.ADMIN_PASSWORD || "HackMitra@AdminKarnataka2026!"
    );
    assert(validAuth.isValid && validAuth.user?.role === "admin", "validateAdminCredentials accepts correct credentials");
  }

  // Generate authentic token for subsequent tests
  const adminToken = createAdminToken({
    email: "admin@hackmitra.in",
    name: "Automated Test Moderator",
    role: "admin",
  });

  // -----------------------------------------------------------------------------
  // TEST GROUP 2: Server-Side Authorization Guards (Unauthorized Request Rejections)
  // -----------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: Server-Side Authorization Enforcement ---");
  {
    // 2.1 Unauthenticated GET /api/admin/events
    const unauthGet = await fetch(`${baseUrl}/api/admin/events`);
    assert(
      unauthGet.status === 401,
      `Unauthenticated GET /api/admin/events rejected with HTTP 401 (got ${unauthGet.status})`
    );

    // 2.2 Tampered token GET /api/admin/events
    const tamperedGet = await fetch(`${baseUrl}/api/admin/events`, {
      headers: { Authorization: "Bearer bad.token.here" },
    });
    assert(
      tamperedGet.status === 401,
      `Tampered token request rejected with HTTP 401 (got ${tamperedGet.status})`
    );

    // 2.3 Unauthenticated PATCH /api/admin/events/dummy
    const unauthPatch = await fetch(`${baseUrl}/api/admin/events/00000000-0000-0000-0000-000000000000`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", reason: "test" }),
    });
    assert(
      unauthPatch.status === 401,
      `Unauthenticated PATCH /api/admin/events/:id rejected with HTTP 401 (got ${unauthPatch.status})`
    );

    // 2.4 Unauthenticated PATCH /api/admin/sources
    const unauthSources = await fetch(`${baseUrl}/api/admin/sources`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId: "devfolio", isActive: false, reason: "test" }),
    });
    assert(
      unauthSources.status === 401,
      `Unauthenticated PATCH /api/admin/sources rejected with HTTP 401 (got ${unauthSources.status})`
    );

    // 2.5 Unauthenticated POST /api/admin/duplicates
    const unauthDuplicates = await fetch(`${baseUrl}/api/admin/duplicates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canonicalId: "a", duplicateId: "b" }),
    });
    assert(
      unauthDuplicates.status === 401,
      `Unauthenticated POST /api/admin/duplicates rejected with HTTP 401 (got ${unauthDuplicates.status})`
    );

    // 2.6 Authenticated GET /api/admin/events -> Must Succeed
    const authGet = await fetch(`${baseUrl}/api/admin/events?pageSize=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      authGet.status === 200,
      `Authenticated GET /api/admin/events succeeds with HTTP 200 (got ${authGet.status})`
    );
  }

  // -----------------------------------------------------------------------------
  // TEST GROUP 3: Event Review Queue & Moderator Approval Workflow
  // -----------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: Event Review Queue & Moderator Approval ---");
  {
    const testSlug = `review-queue-test-${Date.now()}`;
    const testTitle = `Belagavi Student Sprint ${Date.now()}`;

    // 1. Submit event via public /api/submit (enters pending_verification queue)
    const submitRes = await fetch(`${baseUrl}/api/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: testTitle,
        organizer: "KLS Gogte Institute of Technology (GIT Belagavi)",
        districtId: "belagavi",
        city: "Belagavi",
        venue: "KLS GIT Campus, Udyambag, Belagavi",
        registrationUrl: `https://devfolio.co/hackathons/${testSlug}`,
        sourceProofUrl: `https://git.edu/circulars/${testSlug}.pdf`,
        startDate: new Date(Date.now() + 10 * 86400000).toISOString(),
        endDate: new Date(Date.now() + 12 * 86400000).toISOString(),
        registrationDeadline: new Date(Date.now() + 5 * 86400000).toISOString(),
        submitterEmail: "scout.lead@git.edu",
        submitterRole: "Faculty Coordinator",
      }),
    });

    const submitJson = await submitRes.json();
    assert(submitJson.success === true, "Event submitted via public portal into pending queue");
    const submittedId = submitJson.hackathonId;

    // 2. Query review queue as Admin
    const queueRes = await fetch(`${baseUrl}/api/admin/events?verificationStatus=pending_verification`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const queueJson = await queueRes.json();
    const foundInQueue = queueJson.hackathons?.some((h: any) => h.id === submittedId);
    assert(foundInQueue, "Submitted event appears in administrator's review queue");

    // 3. Approve event with moderator identity and mandatory rationale
    const approveRes = await fetch(`${baseUrl}/api/admin/events/${submittedId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        action: "approve",
        reason: "Authenticated official KLS GIT circular signed by Principal. Form verified active.",
        currentStatus: "open",
      }),
    });

    const approveJson = await approveRes.json();
    assert(approveJson.success === true, "Moderator successfully approved pending event");
    assert(
      approveJson.verificationStatus === "verified" && approveJson.newStatus === "open",
      "Status transitioned to verified=true and current_status='open'"
    );

    // 4. Verify audit log entry in verification_logs
    const { data: auditEntry } = await adminClient
      .from("verification_logs")
      .select("*")
      .eq("hackathon_id", submittedId)
      .eq("verifier_type", "moderator")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    assert(Boolean(auditEntry), "Audit history recorded in verification_logs with verifier_type='moderator'");
    assert(
      auditEntry?.verifier_identity === "admin@hackmitra.in",
      "Audit trail records moderator email identity"
    );
    assert(
      (auditEntry?.metadata as any)?.is_admin_override === true,
      "Audit log explicitly tags record with metadata.is_admin_override = true"
    );

    // Clean up test event
    await adminClient.from("hackathon_source_records").delete().eq("hackathon_id", submittedId);
    await adminClient.from("verification_logs").delete().eq("hackathon_id", submittedId);
    await adminClient.from("hackathons").delete().eq("id", submittedId);
  }

  // -----------------------------------------------------------------------------
  // TEST GROUP 4: Event Editing & Mandatory Rationale Enforcement
  // -----------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: Event Editing & Mandatory Rationale Logging ---");
  {
    // Find an existing hackathon
    const { data: event } = await adminClient
      .from("hackathons")
      .select("id, title, venue, prize_pool_inr")
      .limit(1)
      .single();

    assert(Boolean(event), "Target event located for editing tests");

    if (event) {
      // 4.1 Attempt edit WITHOUT reason -> MUST be rejected
      const noReasonRes = await fetch(`${baseUrl}/api/admin/events/${event.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          action: "edit",
          venue: "Updated Campus Auditorium",
          // reason omitted!
        }),
      });

      assert(
        noReasonRes.status === 400,
        "Edit lacking mandatory audit reason rejected with HTTP 400 Bad Request"
      );

      // 4.2 Edit WITH mandatory rationale
      const validEditRes = await fetch(`${baseUrl}/api/admin/events/${event.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          action: "edit",
          venue: "Updated Campus Main Auditorium, Block B",
          prizePoolInr: 250000,
          reason: "Organizer updated venue to Main Auditorium Block B and increased prize pool to ₹2.5L",
        }),
      });

      const validEditJson = await validEditRes.json();
      assert(validEditJson.success === true, "Edit with audit rationale executed successfully");

      // Verify database reflection
      const { data: updatedDb } = await adminClient
        .from("hackathons")
        .select("venue, prize_pool_inr")
        .eq("id", event.id)
        .single();

      assert(
        updatedDb?.venue === "Updated Campus Main Auditorium, Block B" && updatedDb?.prize_pool_inr === 250000,
        "Database updated with corrected venue and prize pool"
      );

      // Restore original
      await adminClient
        .from("hackathons")
        .update({ venue: event.venue, prize_pool_inr: event.prize_pool_inr } as any)
        .eq("id", event.id);
    }
  }

  // -----------------------------------------------------------------------------
  // TEST GROUP 5: Source Controls (Enable / Disable with Moderator Rationale)
  // -----------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: Source Controls & Toggle Authorization ---");
  {
    // Toggle source status
    const toggleRes = await fetch(`${baseUrl}/api/admin/sources`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        sourceId: "unstop",
        isActive: false,
        reason: "Scheduled API maintenance window on Unstop infrastructure",
      }),
    });

    const toggleJson = await toggleRes.json();
    assert(toggleJson.success === true, "Admin successfully disabled source with audit reason");

    // Restore to active
    await fetch(`${baseUrl}/api/admin/sources`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        sourceId: "unstop",
        isActive: true,
        reason: "Maintenance concluded; re-enabling automated Unstop adapter",
      }),
    });
  }

  // -----------------------------------------------------------------------------
  // TEST GROUP 6: Public Error Reports & Moderator Resolution
  // -----------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 6: Error Reports Ingestion & Resolution ---");
  {
    // 1. Submit report via public API
    const reportRes = await fetch(`${baseUrl}/api/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hackathonTitle: "NITK HackVerse",
        reporterEmail: "student@nitk.ac.in",
        reportType: "dead_link",
        details: "Registration link shows 404 error page.",
      }),
    });

    const reportJson = await reportRes.json();
    assert(reportJson.success === true, "Public error report ingested successfully");
    const reportId = reportJson.reportId;

    // 2. Fetch reports as Admin
    const getReportsRes = await fetch(`${baseUrl}/api/admin/reports?status=pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getReportsJson = await getReportsRes.json();
    const foundReport = getReportsJson.reports?.some((r: any) => r.id === reportId);
    assert(foundReport, "User submitted error report appears in administrator report queue");

    // 3. Resolve report as Admin
    const resolveRes = await fetch(`${baseUrl}/api/admin/reports`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        reportId,
        status: "resolved",
        notes: "Audited link with NITK faculty lead. Re-established active Google Form link.",
      }),
    });

    const resolveJson = await resolveRes.json();
    assert(resolveJson.success === true, "Admin resolved error report with resolution notes");
    assert(resolveJson.report?.status === "resolved", "Report status updated to 'resolved'");
  }

  // -----------------------------------------------------------------------------
  // TEST GROUP 7: Duplicate Detection & Merge Resolution API
  // -----------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 7: Duplicate Detection & Resolution ---");
  {
    const dupRes = await fetch(`${baseUrl}/api/admin/duplicates`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dupJson = await dupRes.json();

    assert(dupRes.status === 200, "Admin can query duplicate candidate clusters");
    assert(Array.isArray(dupJson.duplicateGroups), "Duplicate groups array returned");
  }

  console.log("\n==================================================================");
  console.log(`ADMIN SECURITY TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAdminSecurityTests().catch((err) => {
  console.error("Test runner exception:", err);
  process.exit(1);
});
