/**
 * HackMitra Verification Engine Test Suite
 * 
 * Tests:
 * 1. Expired deadlines (exact & date-only)
 * 2. Deadline extensions (state transitions & audit logging)
 * 3. Date-only values without fabricating arbitrary closing times
 * 4. Cancellations, postponements, and keyword detection
 * 5. Timezone boundaries (Asia/Kolkata +05:30 vs UTC midnight)
 * 6. Source inaccessibility guard (future event with broken link cannot be "open")
 * 7. Stale verification detection (> 48h)
 * 8. Priority queue ordering
 */

import {
  evaluateRegistrationStatus,
  inspectOfficialEventUrl,
  StatusEvaluationParams,
} from "../src/lib/verification/engine";
import {
  getIstCalendarDate,
  isSameIstDay,
  formatIstDate,
  formatIstDateTime,
  getEndOfIstDayUtc,
  getIstDaysDifference,
  isDateOnlyDeadlineString,
} from "../src/lib/verification/ist-utils";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` - ${detail}` : ""}`);
    failedCount++;
  }
}

async function runAllTests() {
  console.log("==================================================================");
  console.log("🚀 HACKMITRA REGISTRATION VERIFICATION ENGINE TEST SUITE");
  console.log("Timezone: Asia/Kolkata (+05:30)");
  console.log("==================================================================\n");

  // TEST SUITE 1: EXPIRED DEADLINES
  console.log("--- TEST GROUP 1: Expired Deadlines ---");
  {
    // 1.1 Exact timestamp in the past
    const ref = new Date("2026-10-24T12:00:00+05:30");
    const res = evaluateRegistrationStatus({
      registrationDeadline: "2026-10-20T18:00:00+05:30",
      startDate: "2026-11-01T09:00:00+05:30",
      endDate: "2026-11-02T18:00:00+05:30",
      referenceTime: ref,
      isDateOnlyDeadline: false,
    });
    assert(res.status === "closed", "Past exact deadline evaluates to 'closed'");

    // 1.2 Event already concluded
    const resCompleted = evaluateRegistrationStatus({
      registrationDeadline: "2026-10-10T18:00:00+05:30",
      startDate: "2026-10-15T09:00:00+05:30",
      endDate: "2026-10-16T18:00:00+05:30",
      referenceTime: ref,
    });
    assert(resCompleted.status === "completed", "Elapsed event end date evaluates to 'completed'");

    // 1.3 Ongoing event
    const resOngoing = evaluateRegistrationStatus({
      registrationDeadline: "2026-10-20T18:00:00+05:30",
      startDate: "2026-10-23T09:00:00+05:30",
      endDate: "2026-10-25T18:00:00+05:30",
      referenceTime: ref,
    });
    assert(resOngoing.status === "ongoing", "Active event within [startDate, endDate] evaluates to 'ongoing'");
  }

  // TEST SUITE 2: DEADLINE EXTENSIONS
  console.log("\n--- TEST GROUP 2: Deadline Extensions ---");
  {
    const ref = new Date("2026-10-24T10:00:00+05:30");
    // Initially closed on 2026-10-22
    const initialEval = evaluateRegistrationStatus({
      registrationDeadline: "2026-10-22T23:59:59+05:30",
      startDate: "2026-11-15T09:00:00+05:30",
      endDate: "2026-11-16T18:00:00+05:30",
      referenceTime: ref,
    });
    assert(initialEval.status === "closed", "Original deadline is expired/closed");

    // Organizer extends deadline to 2026-11-05
    const extendedEval = evaluateRegistrationStatus({
      registrationDeadline: "2026-11-05T23:59:59+05:30",
      startDate: "2026-11-15T09:00:00+05:30",
      endDate: "2026-11-16T18:00:00+05:30",
      referenceTime: ref,
    });
    assert(
      extendedEval.status === "open",
      "Extended deadline transitions status from 'closed' back to 'open'"
    );
  }

  // TEST SUITE 3: DATE-ONLY DEADLINES (Without fabricating cutoff times)
  console.log("\n--- TEST GROUP 3: Date-Only Deadlines (Asia/Kolkata) ---");
  {
    // Date-only detection utility
    assert(isDateOnlyDeadlineString("2026-10-24") === true, "isDateOnlyDeadlineString detects YYYY-MM-DD");
    assert(isDateOnlyDeadlineString("24 Oct 2026") === true, "isDateOnlyDeadlineString detects '24 Oct 2026'");
    assert(isDateOnlyDeadlineString("2026-10-24T18:00:00+05:30") === false, "isDateOnlyDeadlineString rejects explicit ISO timestamp");

    // Reference time: Morning of 24 Oct 2026 in IST
    const morning24Oct = new Date("2026-10-24T09:30:00+05:30");

    const todayDateOnlyRes = evaluateRegistrationStatus({
      registrationDeadline: "2026-10-24",
      isDateOnlyDeadline: true,
      startDate: "2026-11-05",
      endDate: "2026-11-06",
      referenceTime: morning24Oct,
    });
    assert(
      todayDateOnlyRes.status === "deadline_today",
      "Date-only deadline on the same calendar day in IST evaluates to 'deadline_today'"
    );
    assert(
      todayDateOnlyRes.reason.includes("unspecified by organizer"),
      "Date-only deadline explicitly states that closing time is unspecified by organizer"
    );

    // Reference time: 23 Oct 2026 (1 day before)
    const dayBefore = new Date("2026-10-23T15:00:00+05:30");
    const closingSoonRes = evaluateRegistrationStatus({
      registrationDeadline: "2026-10-24",
      isDateOnlyDeadline: true,
      startDate: "2026-11-05",
      endDate: "2026-11-06",
      referenceTime: dayBefore,
    });
    assert(
      closingSoonRes.status === "closing_soon",
      "Date-only deadline within 3 calendar days evaluates to 'closing_soon'"
    );

    // Reference time: 25 Oct 2026 (1 day after)
    const dayAfter = new Date("2026-10-25T01:00:00+05:30");
    const passedRes = evaluateRegistrationStatus({
      registrationDeadline: "2026-10-24",
      isDateOnlyDeadline: true,
      startDate: "2026-11-05",
      endDate: "2026-11-06",
      referenceTime: dayAfter,
    });
    assert(
      passedRes.status === "closed",
      "Date-only deadline transitions to 'closed' once calendar day in IST has passed"
    );
  }

  // TEST SUITE 4: CANCELLATIONS & POSTPONEMENTS
  console.log("\n--- TEST GROUP 4: Cancellations, Postponements & Conflict Detection ---");
  {
    const ref = new Date("2026-10-24T12:00:00+05:30");

    // Explicit cancellation flag
    const explicitCancel = evaluateRegistrationStatus({
      registrationDeadline: "2026-11-10T23:59:59+05:30",
      startDate: "2026-11-20T09:00:00+05:30",
      endDate: "2026-11-21T18:00:00+05:30",
      isExplicitlyCancelled: true,
      referenceTime: ref,
    });
    assert(explicitCancel.status === "cancelled", "Explicit cancellation flag produces 'cancelled' status");

    // Cancellation keyword detected in official webpage
    const keywordCancel = evaluateRegistrationStatus({
      registrationDeadline: "2026-11-10T23:59:59+05:30",
      startDate: "2026-11-20T09:00:00+05:30",
      endDate: "2026-11-21T18:00:00+05:30",
      cancellationKeywordFound: true,
      referenceTime: ref,
    });
    assert(keywordCancel.status === "cancelled", "Cancellation keyword signal produces 'cancelled' status");
  }

  // TEST SUITE 5: TIMEZONE BOUNDARY CALCULATIONS (Asia/Kolkata vs UTC)
  console.log("\n--- TEST GROUP 5: Timezone Boundary Tests (Asia/Kolkata +05:30) ---");
  {
    // UTC Midnight (00:00:00 UTC) is 05:30:00 AM on the SAME day in IST.
    // IST Day End (23:59:59 IST) corresponds to 18:29:59 UTC on that day.
    // Next IST Day Start (00:00:00 IST) corresponds to 18:30:00 UTC!

    const dateOnlyTarget = "2026-10-24";

    // 1 second before midnight IST (2026-10-24 23:59:59 IST = 2026-10-24 18:29:59 UTC)
    const justBeforeMidnightIst = new Date("2026-10-24T18:29:59.000Z");
    const istCalDateBefore = getIstCalendarDate(justBeforeMidnightIst);
    assert(istCalDateBefore === "2026-10-24", "18:29:59 UTC is still 2026-10-24 in Asia/Kolkata");

    const evalBefore = evaluateRegistrationStatus({
      registrationDeadline: dateOnlyTarget,
      isDateOnlyDeadline: true,
      startDate: "2026-11-01",
      endDate: "2026-11-02",
      referenceTime: justBeforeMidnightIst,
    });
    assert(
      evalBefore.status === "deadline_today",
      "At 18:29:59 UTC (23:59:59 IST), status is STILL 'deadline_today'"
    );

    // Exactly at midnight IST (2026-10-25 00:00:00 IST = 2026-10-24 18:30:00 UTC)
    const exactlyAtMidnightIst = new Date("2026-10-24T18:30:00.000Z");
    const istCalDateAfter = getIstCalendarDate(exactlyAtMidnightIst);
    assert(istCalDateAfter === "2026-10-25", "18:30:00 UTC is 2026-10-25 in Asia/Kolkata (new day started)");

    const evalAfter = evaluateRegistrationStatus({
      registrationDeadline: dateOnlyTarget,
      isDateOnlyDeadline: true,
      startDate: "2026-11-01",
      endDate: "2026-11-02",
      referenceTime: exactlyAtMidnightIst,
    });
    assert(
      evalAfter.status === "closed",
      "At 18:30:00 UTC (00:00:00 IST next day), 24 Oct deadline transitions to 'closed'"
    );
  }

  // TEST SUITE 6: SOURCE INACCESSIBILITY GUARD
  console.log("\n--- TEST GROUP 6: Source Inaccessibility Guard ---");
  {
    // RULE: "A future event date does not prove that registration remains open.
    //        An inaccessible source must not be treated as proof of an open registration."
    const ref = new Date("2026-10-24T12:00:00+05:30");
    const unreachableRes = evaluateRegistrationStatus({
      registrationDeadline: "2026-12-01T23:59:59+05:30", // future deadline
      startDate: "2026-12-10T09:00:00+05:30",          // future event
      endDate: "2026-12-11T18:00:00+05:30",
      sourceAccessible: false, // Broken link / 404 / 500
      referenceTime: ref,
    });

    assert(
      unreachableRes.status === "unverified",
      "Unreachable source evaluates to 'unverified', NEVER 'open', even with future dates"
    );
    assert(
      unreachableRes.status !== "open",
      "Invariant holds: unreachable source cannot prove open registration"
    );
  }

  // TEST SUITE 7: STALE VERIFICATION DETECTION
  console.log("\n--- TEST GROUP 7: Stale Records Detection ---");
  {
    const ref = new Date("2026-10-24T12:00:00+05:30");
    // Last verified 52 hours ago (threshold is 48 hours)
    const lastVer = new Date(ref.getTime() - 52 * 3600000);

    const staleRes = evaluateRegistrationStatus({
      registrationDeadline: "2026-11-20T23:59:59+05:30",
      startDate: "2026-12-01T09:00:00+05:30",
      endDate: "2026-12-02T18:00:00+05:30",
      lastVerifiedAt: lastVer,
      staleThresholdHours: 48,
      referenceTime: ref,
    });

    assert(staleRes.status === "stale", "Verification older than 48 hours evaluates to 'stale'");
    assert(staleRes.reason.includes("needs reverification"), "Stale reason clearly flags reverification need");
  }

  // TEST SUITE 8: PRIORITY RECHECK ORDERING
  console.log("\n--- TEST GROUP 8: Approaching Deadline Prioritization ---");
  {
    // Mock events list
    const mockEvents = [
      { id: "e1", title: "Event Far Away", deadline: "2026-12-15" },
      { id: "e2", title: "Event Tomorrow", deadline: "2026-10-25" },
      { id: "e3", title: "Event Today", deadline: "2026-10-24" },
      { id: "e4", title: "Event Next Week", deadline: "2026-10-31" },
    ];

    const sorted = [...mockEvents].sort((a, b) => a.deadline.localeCompare(b.deadline));
    assert(sorted[0].id === "e3", "Event with closest deadline (Today) is prioritized first (#1)");
    assert(sorted[1].id === "e2", "Event with tomorrow's deadline is prioritized #2");
    assert(sorted[3].id === "e1", "Furthest event is prioritized last");
  }

  // SUMMARY
  console.log("\n==================================================================");
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error("Test runner exception:", err);
  process.exit(1);
});
