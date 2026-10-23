import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Database } from "@/types/database.types";
import { Hackathon, HackathonFilters } from "@/types/hackathon";
import { getAllHackathons, getHackathonBySlug as getFixtureBySlug, filterHackathons } from "./hackathons";
import { getAllDistrictSummaries, getDistrictBySlug as getLocalDistrictBySlug } from "./districts";

type HackathonRow = Database["public"]["Tables"]["hackathons"]["Row"];
type SourceRecordInsert = Database["public"]["Tables"]["hackathon_source_records"]["Insert"];
type VerificationLogInsert = Database["public"]["Tables"]["verification_logs"]["Insert"];
type DiscoveryRunInsert = Database["public"]["Tables"]["discovery_runs"]["Insert"];

/**
 * Maps a database row to the frontend Hackathon model
 */
function mapRowToHackathon(row: HackathonRow): Hackathon {
  const now = new Date();
  const deadline = new Date(row.registration_deadline);
  const diffTime = deadline.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline || undefined,
    description: row.description,
    organizer: row.organizer,
    organizerType: row.organizer_type,
    city: row.city,
    districtId: row.district_id,
    districtName: row.district_name,
    kannadaDistrict: undefined,
    cluster: row.cluster,
    isBeyondBengaluru: row.is_beyond_bengaluru,
    venue: row.venue,
    format: row.format,
    startDate: new Date(row.start_date).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    endDate: new Date(row.end_date).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    registrationDeadline: new Date(row.registration_deadline).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    daysRemaining,
    prizePool: row.prize_pool_text,
    prizePoolInr: row.prize_pool_inr,
    isFree: row.is_free,
    feeAmount: row.fee_amount_text || undefined,
    teamSize: `${row.team_size_min} - ${row.team_size_max} Members`,
    themeTags: row.theme_tags,
    officialWebsiteUrl: row.official_website_url,
    registrationUrl: row.registration_url,
    sourcePlatform: "Verified Source",
    sourceProofUrl: row.source_proof_url || row.official_website_url,
    registrationStatus: row.current_status === "archived" ? "closed" : row.current_status,
    verifiedAt: new Date(row.last_verified_at).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    discoveredAt: new Date(row.created_at).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    rounds: Array.isArray(row.rounds)
      ? (row.rounds as { title: string; date: string; description: string }[])
      : undefined,
  };
}

/**
 * Queries verified hackathons from Supabase with dynamic filters,
 * with seamless fallback to verified local fixtures when credentials are unconfigured.
 */
export async function getVerifiedHackathons(filters?: HackathonFilters): Promise<Hackathon[]> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    // Graceful fallback to verified in-memory dataset
    const all = getAllHackathons();
    return filters ? filterHackathons(all, filters) : all;
  }

  try {
    let query = supabase
      .from("hackathons")
      .select("*")
      .eq("verification_status", "verified")
      .order("start_date", { ascending: true });

    if (filters?.districtId && filters.districtId !== "all") {
      query = query.eq("district_id", filters.districtId);
    }

    if (filters?.format && filters.format !== "all") {
      query = query.eq("format", filters.format as any);
    }

    if (filters?.onlyFree) {
      query = query.eq("is_free", true);
    }

    if (filters?.cluster && filters.cluster !== "All Karnataka") {
      if (filters.cluster === "Beyond Bengaluru") {
        query = query.eq("is_beyond_bengaluru", true);
      } else {
        query = query.eq("cluster", filters.cluster);
      }
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      // In case table is newly created and empty, return local data
      const all = getAllHackathons();
      return filters ? filterHackathons(all, filters) : all;
    }

    let results = data.map(mapRowToHackathon);
    if (filters?.search && filters.search.trim() !== "") {
      results = filterHackathons(results, { search: filters.search });
    }

    return results;
  } catch (err) {
    console.warn("Supabase query failed, using verified fallback data:", err);
    const all = getAllHackathons();
    return filters ? filterHackathons(all, filters) : all;
  }
}

/**
 * Queries a single hackathon by slug, including its multi-source audit records
 */
export async function getHackathonBySlugWithSources(slug: string) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    const fixture = getFixtureBySlug(slug);
    return fixture ? { hackathon: fixture, sources: [], verificationLogs: [] } : null;
  }

  try {
    const { data: hackathonRowData, error: hError } = await supabase
      .from("hackathons")
      .select("*")
      .eq("slug", slug)
      .single();

    if (hError || !hackathonRowData) {
      const fixture = getFixtureBySlug(slug);
      return fixture ? { hackathon: fixture, sources: [], verificationLogs: [] } : null;
    }

    const hackathonRow = hackathonRowData as HackathonRow;

    const [sourcesRes, logsRes] = await Promise.all([
      supabase
        .from("hackathon_source_records")
        .select("*, event_sources(name, source_type)")
        .eq("hackathon_id", hackathonRow.id),
      supabase
        .from("verification_logs")
        .select("*")
        .eq("hackathon_id", hackathonRow.id)
        .order("created_at", { ascending: false }),
    ]);

    return {
      hackathon: mapRowToHackathon(hackathonRow),
      sources: sourcesRes.data || [],
      verificationLogs: logsRes.data || [],
    };
  } catch (err) {
    const fixture = getFixtureBySlug(slug);
    return fixture ? { hackathon: fixture, sources: [], verificationLogs: [] } : null;
  }
}

/**
 * Backend Ingestion: Records a new discovery scraper run
 */
export async function recordDiscoveryRun(run: DiscoveryRunInsert) {
  const adminClient = createAdminSupabaseClient();
  if (!adminClient) return null;

  const { data, error } = await adminClient
    .from("discovery_runs")
    .insert(run as any)
    .select()
    .single();

  if (error) {
    console.error("Failed to record discovery run:", error);
    return null;
  }

  return data;
}

/**
 * Backend Ingestion: Ingests an external source record mapping to an event
 */
export async function ingestSourceRecord(record: SourceRecordInsert) {
  const adminClient = createAdminSupabaseClient();
  if (!adminClient) return null;

  const { data, error } = await adminClient
    .from("hackathon_source_records")
    .upsert(record as any, { onConflict: "source_id,external_url" })
    .select()
    .single();

  if (error) {
    console.error("Failed to ingest source record:", error);
    return null;
  }

  return data;
}

/**
 * Backend Audit: Appends a verification audit log
 */
export async function recordVerificationLog(log: VerificationLogInsert) {
  const adminClient = createAdminSupabaseClient();
  if (!adminClient) return null;

  const { data, error } = await adminClient
    .from("verification_logs")
    .insert(log as any)
    .select()
    .single();

  if (error) {
    console.error("Failed to log verification audit:", error);
    return null;
  }

  return data;
}
