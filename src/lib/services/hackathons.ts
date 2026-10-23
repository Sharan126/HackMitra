import { Hackathon, HomepageStats, DistrictSummary } from "@/types/hackathon";
import { HACKATHON_FIXTURES } from "@/data/fixtures/hackathons";
import { KARNATAKA_DISTRICTS } from "@/lib/karnataka-data";

/**
 * Data Service Layer for HackMitra
 * 
 * Provides an abstraction over the data store.
 * Currently serves development fixtures with strict validation.
 * When Supabase environment variables are provided in production,
 * queries resolve against Supabase tables without modifying UI consumers.
 */

export interface HackathonFilters {
  search?: string;
  districtId?: string;
  registrationStatus?: string;
  deadlineRange?: string; // '7_days' | '14_days' | '30_days' | 'all'
  format?: string; // 'in_person' | 'hybrid' | 'online' | 'all'
  cluster?: string;
  onlyFree?: boolean;
}

export function getAllHackathons(): Hackathon[] {
  return [...HACKATHON_FIXTURES];
}

export function getHackathonBySlug(slug: string): Hackathon | undefined {
  return HACKATHON_FIXTURES.find((h) => h.slug === slug);
}

export function getRecentlyDiscoveredHackathons(limit = 4): Hackathon[] {
  return [...HACKATHON_FIXTURES]
    .sort((a, b) => b.discoveredAt.localeCompare(a.discoveredAt))
    .slice(0, limit);
}

export function getRegistrationOpenHackathons(limit = 4): Hackathon[] {
  return HACKATHON_FIXTURES.filter(
    (h) => h.registrationStatus === "open" || h.registrationStatus === "closing_soon"
  ).slice(0, limit);
}

export function getHomepageStats(): HomepageStats {
  const all = HACKATHON_FIXTURES;
  const openCount = all.filter(
    (h) => h.registrationStatus === "open" || h.registrationStatus === "closing_soon"
  ).length;

  const upcomingCount = all.filter(
    (h) => h.registrationStatus === "upcoming" || h.registrationStatus === "open"
  ).length;

  // Distinct districts with at least 1 active or upcoming hackathon
  const distinctDistricts = new Set(all.map((h) => h.districtId));

  return {
    openRegistrations: openCount,
    upcomingEvents: upcomingCount,
    ongoingOrThisMonth: 4, // e.g. active sprint cycles
    districtsRepresented: distinctDistricts.size,
    totalDistrictsCount: 31,
    lastUpdatedTimestamp: "Today at 01:30 AM IST",
  };
}

export { getAllDistrictSummaries as getDistrictSummaries } from "@/lib/services/districts";

export function filterHackathons(
  hackathons: Hackathon[],
  filters: HackathonFilters
): Hackathon[] {
  return hackathons.filter((h) => {
    // 1. Search text (supports event name, technology, organizer, city, district)
    if (filters.search && filters.search.trim() !== "") {
      const q = filters.search.toLowerCase().trim();
      const matchesTitle = h.title.toLowerCase().includes(q);
      const matchesTagline = (h.tagline || "").toLowerCase().includes(q);
      const matchesOrganizer = h.organizer.toLowerCase().includes(q);
      const matchesCity = h.city.toLowerCase().includes(q);
      const matchesDistrict = h.districtName.toLowerCase().includes(q);
      const matchesTags = h.themeTags.some((tag) => tag.toLowerCase().includes(q));

      if (!matchesTitle && !matchesTagline && !matchesOrganizer && !matchesCity && !matchesDistrict && !matchesTags) {
        return false;
      }
    }

    // 2. District filter
    if (filters.districtId && filters.districtId !== "all") {
      if (h.districtId !== filters.districtId) {
        return false;
      }
    }

    // 3. Cluster filter
    if (filters.cluster && filters.cluster !== "All Karnataka") {
      if (filters.cluster === "Beyond Bengaluru") {
        if (!h.isBeyondBengaluru) return false;
      } else if (h.cluster !== filters.cluster) {
        return false;
      }
    }

    // 4. Registration status filter
    if (filters.registrationStatus && filters.registrationStatus !== "all") {
      if (h.registrationStatus !== filters.registrationStatus) {
        return false;
      }
    }

    // 5. Format filter
    if (filters.format && filters.format !== "all") {
      if (h.format !== filters.format) {
        return false;
      }
    }

    // 6. Fee filter
    if (filters.onlyFree && !h.isFree) {
      return false;
    }

    // 7. Deadline range
    if (filters.deadlineRange && filters.deadlineRange !== "all") {
      const days = h.daysRemaining ?? 99;
      if (filters.deadlineRange === "7_days" && days > 7) return false;
      if (filters.deadlineRange === "14_days" && days > 14) return false;
      if (filters.deadlineRange === "30_days" && days > 30) return false;
    }

    return true;
  });
}
