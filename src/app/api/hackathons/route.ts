import { NextRequest, NextResponse } from "next/server";
import { queryHackathons } from "@/lib/services/search-query";
import { SearchAndFilterParams, SortOption, RegistrationStatus, ParticipationFormat } from "@/types/hackathon";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const params: SearchAndFilterParams = {
    search: searchParams.get("search") || undefined,
    districtId: searchParams.get("district") || undefined,
    city: searchParams.get("city") || undefined,
    registrationStatus: (searchParams.get("status") as RegistrationStatus) || undefined,
    deadlineRange: (searchParams.get("deadline") as any) || undefined,
    deadlineBefore: searchParams.get("deadlineBefore") || undefined,
    deadlineAfter: searchParams.get("deadlineAfter") || undefined,
    eventDateRange: (searchParams.get("eventDate") as any) || undefined,
    startDateAfter: searchParams.get("startDateAfter") || undefined,
    endDateBefore: searchParams.get("endDateBefore") || undefined,
    format: (searchParams.get("mode") as ParticipationFormat) || undefined,
    feeType: (searchParams.get("fee") as any) || undefined,
    eligibility: (searchParams.get("eligibility") as any) || undefined,
    participationType: (searchParams.get("participation") as any) || undefined,
    teamSize: searchParams.get("teamSize") ? parseInt(searchParams.get("teamSize")!, 10) : undefined,
    technologyDomain: searchParams.get("tech") || undefined,
    organizerType: (searchParams.get("organizer") as any) || undefined,
    prizePoolVerified: searchParams.get("verifiedPrize") === "true",
    minPrizeInr: searchParams.get("minPrize") ? parseInt(searchParams.get("minPrize")!, 10) : undefined,
    cluster: searchParams.get("cluster") || undefined,
    sortBy: (searchParams.get("sort") as SortOption) || "relevance",
    page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
    pageSize: searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!, 10) : 12,
  };

  try {
    const result = await queryHackathons(params);
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("API /api/hackathons error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to search hackathons" },
      { status: 500 }
    );
  }
}
