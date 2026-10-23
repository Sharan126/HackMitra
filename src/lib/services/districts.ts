import { KARNATAKA_DISTRICTS, District, AdministrativeDivision, KDEMCluster, CoverageStatus } from "@/lib/karnataka-data";
import { getAllHackathons } from "@/lib/services/hackathons";
import { Hackathon, DistrictSummary } from "@/types/hackathon";

/**
 * Statewide District Discovery Service
 * 
 * Provides unified queries for all 31 districts of Karnataka.
 * Calculates event counts, coverage statuses, freshness audits,
 * and maintains source transparency across all 4 administrative divisions.
 */

// In-memory cache for dynamic administrative updates during runtime
const dynamicDistrictOverrides: Map<string, Partial<District>> = new Map();

export interface DistrictWithEvents {
  district: District;
  discoveredEvents: Hackathon[];
  openRegistrations: Hackathon[];
  upcomingEvents: Hackathon[];
  closedEvents: Hackathon[];
  stats: {
    totalDiscovered: number;
    openRegistrationsCount: number;
    upcomingEventsCount: number;
    monitoredCollegesCount: number;
    nainCentersCount: number;
  };
}

export interface StatewideDistrictStats {
  totalDistricts: number;
  districtsWithActiveEvents: number;
  totalMonitoredColleges: number;
  totalNainCenters: number;
  lastAuditedTimestamp: string;
  divisionBreakdown: Record<
    AdministrativeDivision,
    {
      districtCount: number;
      eventCount: number;
      collegesCount: number;
      nainCount: number;
    }
  >;
  coverageBreakdown: {
    verifiedActive: number;
    verifiedZero: number;
    seekingLeads: number;
  };
}

/**
 * Returns merged district data accounting for any runtime administrative updates
 */
function getResolvedDistricts(): District[] {
  return KARNATAKA_DISTRICTS.map((d) => {
    const override = dynamicDistrictOverrides.get(d.slug);
    if (!override) return d;
    return { ...d, ...override };
  });
}

/**
 * Fetches all 31 districts enriched with dynamic hackathon counts and coverage
 */
export function getAllDistrictSummaries(): DistrictSummary[] {
  const districts = getResolvedDistricts();
  const hackathons = getAllHackathons();

  return districts.map((district) => {
    const districtHackathons = hackathons.filter(
      (h) => h.districtId === district.id || h.districtId === district.slug
    );

    const openCount = districtHackathons.filter(
      (h) => h.registrationStatus === "open" || h.registrationStatus === "closing_soon"
    ).length;

    const upcomingCount = districtHackathons.filter(
      (h) => h.registrationStatus === "upcoming"
    ).length;

    // Determine resolved coverage status
    let coverageStatus: CoverageStatus = district.coverageStatus;
    if (districtHackathons.length > 0) {
      coverageStatus = "verified_active";
    } else if (district.coverageStatus === "verified_active") {
      coverageStatus = "verified_zero";
    }

    return {
      id: district.id,
      slug: district.slug,
      name: district.name,
      kannadaName: district.kannadaName,
      headquarters: district.headquarters,
      division: district.division,
      cluster: district.cluster,
      hackathonCount: districtHackathons.length,
      openCount,
      upcomingCount,
      monitoredCollegesCount: district.monitoredCollegesCount,
      nainCentersCount: district.nainCentersCount,
      coverageStatus,
      lastAudited: district.lastAudited,
      auditFrequencyHours: district.auditFrequencyHours,
      keyColleges: district.keyInstitutions,
    };
  });
}

/**
 * Fetches a single district by slug, with separated discovered, open, and upcoming events
 */
export function getDistrictBySlug(slug: string): DistrictWithEvents | undefined {
  const districts = getResolvedDistricts();
  const district = districts.find(
    (d) => d.slug.toLowerCase() === slug.toLowerCase() || d.id.toLowerCase() === slug.toLowerCase()
  );

  if (!district) return undefined;

  const allHackathons = getAllHackathons();
  const districtHackathons = allHackathons.filter(
    (h) => h.districtId === district.id || h.districtId === district.slug
  );

  const openRegistrations = districtHackathons.filter(
    (h) => h.registrationStatus === "open" || h.registrationStatus === "closing_soon"
  );

  const upcomingEvents = districtHackathons.filter(
    (h) => h.registrationStatus === "upcoming"
  );

  const closedEvents = districtHackathons.filter(
    (h) => h.registrationStatus === "closed"
  );

  return {
    district,
    discoveredEvents: districtHackathons,
    openRegistrations,
    upcomingEvents,
    closedEvents,
    stats: {
      totalDiscovered: districtHackathons.length,
      openRegistrationsCount: openRegistrations.length,
      upcomingEventsCount: upcomingEvents.length,
      monitoredCollegesCount: district.monitoredCollegesCount,
      nainCentersCount: district.nainCentersCount,
    },
  };
}

/**
 * Computes statewide metrics across all 31 Karnataka districts
 */
export function getStatewideDistrictStats(): StatewideDistrictStats {
  const summaries = getAllDistrictSummaries();

  let totalColleges = 0;
  let totalNain = 0;
  let activeDistricts = 0;
  let verifiedActive = 0;
  let verifiedZero = 0;
  let seekingLeads = 0;

  const divisionBreakdown: Record<
    AdministrativeDivision,
    {
      districtCount: number;
      eventCount: number;
      collegesCount: number;
      nainCount: number;
    }
  > = {
    Belagavi: { districtCount: 0, eventCount: 0, collegesCount: 0, nainCount: 0 },
    Kalaburagi: { districtCount: 0, eventCount: 0, collegesCount: 0, nainCount: 0 },
    Mysuru: { districtCount: 0, eventCount: 0, collegesCount: 0, nainCount: 0 },
    Bengaluru: { districtCount: 0, eventCount: 0, collegesCount: 0, nainCount: 0 },
  };

  for (const d of summaries) {
    totalColleges += d.monitoredCollegesCount;
    totalNain += d.nainCentersCount;

    if (d.hackathonCount > 0) {
      activeDistricts++;
      verifiedActive++;
    } else if (d.coverageStatus === "verified_zero") {
      verifiedZero++;
    } else {
      seekingLeads++;
    }

    if (divisionBreakdown[d.division]) {
      divisionBreakdown[d.division].districtCount++;
      divisionBreakdown[d.division].eventCount += d.hackathonCount;
      divisionBreakdown[d.division].collegesCount += d.monitoredCollegesCount;
      divisionBreakdown[d.division].nainCount += d.nainCentersCount;
    }
  }

  return {
    totalDistricts: summaries.length,
    districtsWithActiveEvents: activeDistricts,
    totalMonitoredColleges: totalColleges,
    totalNainCenters: totalNain,
    lastAuditedTimestamp: "Today at 01:30 AM IST",
    divisionBreakdown,
    coverageBreakdown: {
      verifiedActive,
      verifiedZero,
      seekingLeads,
    },
  };
}

/**
 * Administrative Update Handler
 * Allows future administrative updates to the district directory
 * (e.g., adding monitored colleges, updating coverage status, or audit frequencies).
 */
export async function updateDistrictAdministrativeData(
  slug: string,
  updates: Partial<District>
): Promise<DistrictSummary | null> {
  const current = KARNATAKA_DISTRICTS.find((d) => d.slug === slug || d.id === slug);
  if (!current) return null;

  const existingOverride = dynamicDistrictOverrides.get(current.slug) || {};
  const updatedData: Partial<District> = {
    ...existingOverride,
    ...updates,
    lastAudited: updates.lastAudited || "Updated just now",
  };

  dynamicDistrictOverrides.set(current.slug, updatedData);

  const summaries = getAllDistrictSummaries();
  return summaries.find((d) => d.slug === current.slug) || null;
}
