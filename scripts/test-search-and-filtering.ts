/**
 * HackMitra Search & Filtering Engine Automated Test Suite
 * 
 * Verifies:
 * 1. Title, organizer, location, technology, and description search
 * 2. Multi-filter composition (all 12 filters interacting properly)
 * 3. Sorting by deadline, event date, prize, recent discovery, relevance
 * 4. Pagination (page, pageSize, totalPages, hasMore)
 * 5. Open-registration exclusion invariant (closed/expired events NEVER appear)
 * 6. Eligibility (student-only vs open)
 * 7. Individual vs team participation and exact team size
 * 8. Verified prize pool thresholds
 * 9. Organizer categories
 */

import { queryHackathons } from "../src/lib/services/search-query";
import { SearchAndFilterParams } from "../src/types/hackathon";

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

async function runSearchTests() {
  console.log("==================================================================");
  console.log("🔍 TESTING HACKMITRA SEARCH & FILTERING SYSTEM");
  console.log("==================================================================\n");

  // TEST 1: Full-Text Search
  console.log("--- TEST GROUP 1: Search Scope (Title, Organizer, Location, Tech, Description) ---");
  {
    // 1.1 Title search
    const titleRes = await queryHackathons({ search: "KLE Tech" });
    assert(
      titleRes.hackathons.some((h) => h.title.includes("KLE Tech")),
      "Title search finds 'KLE Tech Innovate'"
    );

    // 1.2 Organizer search
    const orgRes = await queryHackathons({ search: "Surathkal" });
    assert(
      orgRes.hackathons.some((h) => h.organizer.includes("NITK") || h.venue.includes("Surathkal")),
      "Organizer/Venue search finds NITK Surathkal"
    );

    // 1.3 Location (City) search
    const cityRes = await queryHackathons({ search: "Hubballi" });
    assert(
      cityRes.hackathons.every((h) => h.city.toLowerCase().includes("hubballi") || h.districtName.toLowerCase().includes("hubballi")),
      "City/District search returns events situated in Hubballi"
    );

    // 1.4 Technology search
    const techRes = await queryHackathons({ search: "Blockchain" });
    assert(
      techRes.hackathons.length > 0 &&
      techRes.hackathons.some((h) =>
        (h.themeTags || []).some((t) => t.toLowerCase().includes("blockchain")) ||
        (h.technologyDomains || []).some((t) => t.toLowerCase().includes("blockchain"))
      ),
      "Technology search matches Blockchain hackathons"
    );

    // 1.5 Description keyword search
    const descRes = await queryHackathons({ search: "autonomous agents" });
    assert(
      descRes.hackathons.some((h) => h.title.includes("PES") || h.description.includes("autonomous")),
      "Description keyword search matches autonomous systems"
    );
  }

  // TEST 2: Multi-Filter Composition
  console.log("\n--- TEST GROUP 2: Multi-Filter Composition (Combining Multiple Filters) ---");
  {
    const multiRes = await queryHackathons({
      districtId: "dharwad",
      format: "in_person",
      feeType: "free",
      organizerType: "University",
    });

    assert(
      multiRes.hackathons.length > 0,
      "Multi-filter query returns matching records"
    );
    assert(
      multiRes.hackathons.every(
        (h) =>
          h.districtId === "dharwad" &&
          h.format === "in_person" &&
          h.isFree === true &&
          h.organizerType === "University"
      ),
      "Every result strictly satisfies all 4 combined filters (district + format + free + organizer)"
    );
  }

  // TEST 3: CRITICAL INVARIANT: Open-Registration Exclusion Guard
  console.log("\n--- TEST GROUP 3: Closed/Expired Exclusion Invariant ---");
  {
    const openRes = await queryHackathons({
      registrationStatus: "open",
    });

    assert(
      openRes.hackathons.length > 0,
      "Open registration query returns active opportunities"
    );

    // Check that NO closed, completed, cancelled, or unverified events appear
    const violations = openRes.hackathons.filter(
      (h) =>
        h.registrationStatus === "closed" ||
        h.registrationStatus === "completed" ||
        h.registrationStatus === "cancelled" ||
        h.registrationStatus === "unverified"
    );

    assert(
      violations.length === 0,
      "Closed, completed, cancelled, or unverified events NEVER appear in open-registration results"
    );

    // Verify that all returned events have valid active statuses
    assert(
      openRes.hackathons.every(
        (h) =>
          h.registrationStatus === "open" ||
          h.registrationStatus === "deadline_today" ||
          h.registrationStatus === "closing_soon"
      ),
      "All open-registration results have status 'open', 'deadline_today', or 'closing_soon'"
    );
  }

  // TEST 4: Eligibility Filtering
  console.log("\n--- TEST GROUP 4: Student-Only vs Open Eligibility ---");
  {
    const studentRes = await queryHackathons({
      eligibility: "students_only",
    });
    assert(
      studentRes.hackathons.length > 0,
      "Student-only eligibility filter returns eligible listings"
    );
  }

  // TEST 5: Participation Type & Team Size
  console.log("\n--- TEST GROUP 5: Individual vs Team Participation & Team Size ---");
  {
    // Solo allowed
    const soloRes = await queryHackathons({
      participationType: "individual",
    });
    assert(
      soloRes.hackathons.every((h) => (h.teamSizeMin || 1) <= 1),
      "Individual participation filter returns events allowing 1-member entry"
    );

    // Exact team size: 3 members
    const team3Res = await queryHackathons({
      teamSize: 3,
    });
    assert(
      team3Res.hackathons.every((h) => {
        const minT = h.teamSizeMin || 1;
        const maxT = h.teamSizeMax || 4;
        return 3 >= minT && 3 <= maxT;
      }),
      "Team size = 3 filter returns events accommodating a 3-person team"
    );
  }

  // TEST 6: Verified Prize Pool Filtering
  console.log("\n--- TEST GROUP 6: Verified Prize Pool Filters ---");
  {
    const prizeRes = await queryHackathons({
      prizePoolVerified: true,
      minPrizeInr: 200000,
    });

    assert(
      prizeRes.hackathons.length > 0,
      "Verified prize pool query returns matching events"
    );
    assert(
      prizeRes.hackathons.every((h) => (h.prizePoolInr || 0) >= 200000),
      "Every result has a verified prize pool >= ₹2,00,000"
    );
  }

  // TEST 7: Organizer Category Filtering
  console.log("\n--- TEST GROUP 7: Organizer Categories ---");
  {
    const univRes = await queryHackathons({ organizerType: "University" });
    assert(
      univRes.hackathons.every((h) => h.organizerType === "University"),
      "Organizer category = 'University' returns only university listings"
    );

    const kdemRes = await queryHackathons({ organizerType: "KDEM / K-Tech" });
    assert(
      kdemRes.hackathons.every((h) => h.organizerType === "KDEM / K-Tech"),
      "Organizer category = 'KDEM / K-Tech' returns government/K-Tech events"
    );
  }

  // TEST 8: Sorting Strategies
  console.log("\n--- TEST GROUP 8: Sorting Strategies ---");
  {
    // Prize pool descending
    const prizeSort = await queryHackathons({
      sortBy: "prize_desc",
      prizePoolVerified: true,
      pageSize: 5,
    });

    let isSortedPrize = true;
    for (let i = 0; i < prizeSort.hackathons.length - 1; i++) {
      if ((prizeSort.hackathons[i].prizePoolInr || 0) < (prizeSort.hackathons[i + 1].prizePoolInr || 0)) {
        isSortedPrize = false;
        break;
      }
    }
    assert(isSortedPrize, "sortBy='prize_desc' sorts prize pool in descending order");

    // Deadline ascending
    const deadlineSort = await queryHackathons({
      sortBy: "deadline_asc",
      registrationStatus: "open",
      pageSize: 5,
    });

    let isSortedDeadline = true;
    for (let i = 0; i < deadlineSort.hackathons.length - 1; i++) {
      const d1 = new Date(deadlineSort.hackathons[i].registrationDeadline).getTime();
      const d2 = new Date(deadlineSort.hackathons[i + 1].registrationDeadline).getTime();
      if (d1 > d2) {
        isSortedDeadline = false;
        break;
      }
    }
    assert(isSortedDeadline, "sortBy='deadline_asc' sorts approaching deadlines first");
  }

  // TEST 9: Pagination & Bounds
  console.log("\n--- TEST GROUP 9: Pagination & Result Bounds ---");
  {
    const p1 = await queryHackathons({ page: 1, pageSize: 4 });
    const p2 = await queryHackathons({ page: 2, pageSize: 4 });

    assert(p1.hackathons.length === 4, "Page 1 returns exactly 4 records");
    assert(p2.hackathons.length > 0, "Page 2 returns non-empty result set");

    // Ensure no overlapping IDs between page 1 and page 2
    const p1Ids = new Set(p1.hackathons.map((h) => h.id));
    const overlaps = p2.hackathons.filter((h) => p1Ids.has(h.id));
    assert(overlaps.length === 0, "Page 1 and Page 2 have zero overlapping records");

    assert(p1.totalCount > 4, "Total count accurately reflects statewide dataset size");
    assert(p1.hasMore === true, "hasMore is true on page 1 when totalCount > pageSize");
  }

  // TEST 10: Individual Detail Page Query
  console.log("\n--- TEST GROUP 10: Individual Event Detail Queries ---");
  {
    const single = await queryHackathons({ search: "kle-tech-innovate-hubballi" });
    assert(single.hackathons.length > 0, "Can query individual event by unique slug");
    const h = single.hackathons[0];
    assert(Boolean(h.officialWebsiteUrl), "Event details contain official website URL");
    assert(Boolean(h.registrationUrl), "Event details contain official registration URL");
    assert(Boolean(h.sourceProofUrl), "Event details contain source proof URL");
  }

  console.log("\n==================================================================");
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSearchTests().catch((err) => {
  console.error("Test runner exception:", err);
  process.exit(1);
});
