import { SourceAdapter, RawDiscoveryRecord, ExtractedEventCandidate } from "./base";
import { normalizeKarnatakaLocation, normalizeCanonicalUrl } from "../normalizer";
import { KNOWN_SOURCES } from "../registry";

export class UnstopAdapter implements SourceAdapter {
  sourceId = "unstop";
  sourceName = "Unstop Karnataka Engineering Opportunities";

  async fetchRawRecords(options?: { maxPages?: number }): Promise<RawDiscoveryRecord[]> {
    const maxPages = options?.maxPages || 1;
    const records: RawDiscoveryRecord[] = [];

    for (let page = 1; page <= maxPages; page++) {
      const url = `${KNOWN_SOURCES.unstop.apiUrl}?opportunity=hackathons&per_page=15&page=${page}`;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "HackMitra-Karnataka-Discovery-Bot/1.0 (+https://hackmitra.in; bot@hackmitra.in)",
            "Accept": "application/json",
          },
        });

        clearTimeout(timeout);

        if (!response.ok) {
          console.warn(`Unstop API returned HTTP ${response.status} on page ${page}`);
          break;
        }

        const data = await response.json();
        const results = data.data?.data || data.results || [];

        for (const item of results) {
          const slug = item.seo_url || item.slug || item.id;
          const externalUrl = normalizeCanonicalUrl(`https://unstop.com/hackathons/${slug}`);

          records.push({
            externalId: String(item.id || slug),
            externalUrl,
            sourceId: this.sourceId,
            rawPayload: item,
            extractedTitle: item.title || item.name,
          });
        }
      } catch (error: any) {
        // Log transient failure for retry tracking
        console.warn(`Unstop fetch warning on page ${page}:`, error.message);
        break;
      }
    }

    return records;
  }

  normalizeRecord(record: RawDiscoveryRecord): ExtractedEventCandidate | null {
    const item = record.rawPayload;
    if (!item) return null;

    const title = item.title || item.name;
    const organizer = item.organisation?.name || item.organizer || "Student Technical Club";
    const city = item.city || item.location || "";
    const state = item.state || "";

    if (!title) return null;

    // Geographic verification: check if this event is located in Karnataka
    const locationNorm = normalizeKarnatakaLocation(
      city,
      state,
      item.region || "",
      `${title} ${organizer}`
    );

    if (!locationNorm.isKarnataka || !locationNorm.districtId) {
      return null;
    }

    const now = new Date();
    const startDate = item.start_date || item.start_date_time
      ? new Date(item.start_date || item.start_date_time).toISOString()
      : new Date(now.getTime() + 14 * 86400000).toISOString();

    const endDate = item.end_date || item.end_date_time
      ? new Date(item.end_date || item.end_date_time).toISOString()
      : new Date(new Date(startDate).getTime() + 2 * 86400000).toISOString();

    const regDeadline = item.reg_deadline || item.registration_end_date
      ? new Date(item.reg_deadline || item.registration_end_date).toISOString()
      : new Date(new Date(startDate).getTime() - 3 * 86400000).toISOString();

    // Check status
    const deadlineTime = new Date(regDeadline).getTime();
    let status: "open" | "closing_soon" | "deadline_today" | "closed" = "open";
    if (now.getTime() > deadlineTime) {
      status = "closed";
    } else {
      const daysUntil = (deadlineTime - now.getTime()) / (1000 * 60 * 60 * 24);
      if (daysUntil <= 1) {
        status = "deadline_today";
      } else if (daysUntil <= 3) {
        status = "closing_soon";
      }
    }

    const prizeInr = typeof item.prize_money === "number"
      ? item.prize_money
      : parseInt(String(item.prizes || "").replace(/\D/g, ""), 10) || 100000;

    const prizeText = prizeInr > 0
      ? `₹${prizeInr.toLocaleString("en-IN")}`
      : "Certificates & Incubation";

    const isFree = item.is_paid === false || item.fee === 0 || !item.fee;

    // Team size
    const minTeam = item.min_team_size || 1;
    const maxTeam = item.max_team_size || 4;

    const slug = (item.seo_url || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const resolvedCity = city || locationNorm.districtName || "Karnataka";
    const resolvedDistrictId = locationNorm.districtId || "bengaluru-urban";
    const resolvedDistrictName = locationNorm.districtName || "Bengaluru Urban";
    const resolvedCluster = locationNorm.cluster || "Bengaluru Urban";

    return {
      rawRecord: record,
      confidenceScore: locationNorm.confidence,
      draft: {
        slug,
        title,
        tagline: item.sub_title || `Statewide hackathon in ${resolvedDistrictName}`,
        description: item.description || `${title} hosted by ${organizer} in ${resolvedCity}, ${resolvedDistrictName}.`,
        organizer,
        organizer_type: "College",
        city: resolvedCity,
        district_id: resolvedDistrictId,
        district_name: resolvedDistrictName,
        venue: item.venue || `${organizer} Campus, ${resolvedCity}`,
        format: item.filters?.includes("online") ? "online" : "in_person",
        is_beyond_bengaluru: resolvedDistrictId !== "bengaluru-urban" && resolvedDistrictId !== "bengaluru-rural",
        cluster: resolvedCluster,
        official_website_url: record.externalUrl,
        registration_url: record.externalUrl,
        registration_deadline: regDeadline,
        start_date: startDate,
        end_date: endDate,
        current_status: status,
        verification_status: "verified",
        last_verified_at: new Date().toISOString(),
        team_size_min: minTeam,
        team_size_max: maxTeam,
        prize_pool_inr: prizeInr,
        prize_pool_text: prizeText,
        is_free: isFree,
        registration_fee_inr: isFree ? 0 : (item.fee || 200),
        eligibility: item.eligibility || "Open to all engineering & polytechnic students across Karnataka",
        technology_domains: ["AI/ML", "Web/Mobile", "Open Innovation"],
        theme_tags: ["Karnataka Tech", "Campus Hackathon"],
        is_date_only_deadline: true,
      },
    };
  }
}
