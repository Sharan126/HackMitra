import { SourceAdapter, RawDiscoveryRecord, ExtractedEventCandidate } from "./base";
import { normalizeKarnatakaLocation, normalizeCanonicalUrl } from "../normalizer";
import { KNOWN_SOURCES } from "../registry";

export class DevfolioAdapter implements SourceAdapter {
  sourceId = "devfolio";
  sourceName = "Devfolio Official Student Developer Portal";

  async fetchRawRecords(options?: { maxPages?: number }): Promise<RawDiscoveryRecord[]> {
    const maxPages = options?.maxPages || 1;
    const records: RawDiscoveryRecord[] = [];

    for (let page = 1; page <= maxPages; page++) {
      const url = `${KNOWN_SOURCES.devfolio.apiUrl}?filter=all&page=${page}`;

      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "HackMitra-Karnataka-Discovery-Bot/1.0 (+https://hackmitra.in)",
            "Accept": "application/json",
          },
        });

        if (!response.ok) {
          console.warn(`Devfolio API returned HTTP ${response.status} on page ${page}`);
          break;
        }

        const data = await response.json();
        const results = data.result || [];

        for (const item of results) {
          const externalUrl = item.slug
            ? normalizeCanonicalUrl(`https://${item.slug}.devfolio.co`)
            : `https://devfolio.co/hackathons/${item.uuid}`;

          records.push({
            externalId: item.uuid || item.slug,
            externalUrl,
            sourceId: this.sourceId,
            rawPayload: item,
            extractedTitle: item.name,
          });
        }
      } catch (error) {
        console.error(`Devfolio fetch error on page ${page}:`, error);
        break;
      }
    }

    return records;
  }

  normalizeRecord(record: RawDiscoveryRecord): ExtractedEventCandidate | null {
    const item = record.rawPayload;
    if (!item || !item.name || !item.slug) return null;

    // Geographic verification: check if this event is located in Karnataka
    const locationNorm = normalizeKarnatakaLocation(
      item.city,
      item.state,
      item.location,
      item.name
    );

    if (!locationNorm.isKarnataka || !locationNorm.districtId) {
      return null;
    }

    const now = new Date();
    const startsAt = item.starts_at ? new Date(item.starts_at) : now;
    const endsAt = item.ends_at ? new Date(item.ends_at) : new Date(startsAt.getTime() + 2 * 86400000);
    const regEndsAt = item.hackathon_setting?.reg_ends_at
      ? new Date(item.hackathon_setting.reg_ends_at)
      : startsAt;

    // Calculate active registration status
    let status: "open" | "closing_soon" | "closed" | "upcoming" = "open";
    if (now > endsAt || now > regEndsAt) {
      status = "closed";
    } else {
      const daysUntilDeadline = Math.ceil((regEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDeadline <= 5) {
        status = "closing_soon";
      } else if (item.hackathon_setting?.reg_starts_at && now < new Date(item.hackathon_setting.reg_starts_at)) {
        status = "upcoming";
      }
    }

    const officialUrl = item.hackathon_setting?.site
      ? normalizeCanonicalUrl(item.hackathon_setting.site)
      : record.externalUrl;

    const themeList = Array.isArray(item.themes)
      ? item.themes.map((t: any) => t.name || t)
      : ["Student Innovation", "Software"];

    return {
      rawRecord: record,
      confidenceScore: locationNorm.confidence,
      draft: {
        slug: item.slug,
        title: item.name,
        tagline: item.edition_name || `Hackathon hosted in ${item.city || locationNorm.districtName}`,
        description: `Verified Devfolio hackathon hosted in ${item.city || locationNorm.districtName}, Karnataka. Full schedule, rounds, and registration hosted on Devfolio.`,
        organizer: item.hackathon_brand?.name || item.name.split(":")[0] || "University Engineering Team",
        organizer_type: "College",
        city: item.city || locationNorm.districtName || "Karnataka",
        district_id: locationNorm.districtId,
        district_name: locationNorm.districtName || "Karnataka",
        venue: item.location || `${item.city || locationNorm.districtName}, Karnataka`,
        format: item.is_online ? "online" : "in_person",
        is_beyond_bengaluru: locationNorm.isBeyondBengaluru,
        cluster: locationNorm.cluster || "Bengaluru Urban",
        official_website_url: officialUrl,
        registration_url: record.externalUrl,
        registration_deadline: regEndsAt.toISOString(),
        start_date: startsAt.toISOString(),
        end_date: endsAt.toISOString(),
        eligibility: "Open to all engineering, polytechnic, and university students across Karnataka",
        team_size_min: 1,
        team_size_max: 4,
        prize_pool_text: "Recognized on Devfolio",
        prize_pool_inr: 0,
        is_free: true,
        registration_fee_inr: 0,
        technology_domains: themeList,
        theme_tags: themeList,
        current_status: status,
        verification_status: "verified",
        last_verified_at: new Date().toISOString(),
        source_proof_url: record.externalUrl,
        rounds: [
          {
            title: "Devfolio Registration & Team Formation",
            date: regEndsAt.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
            description: "Online registration through official Devfolio portal.",
          },
          {
            title: "Hackathon Sprint & Project Submission",
            date: startsAt.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
            description: "Project build period and jury review.",
          },
        ],
      },
    };
  }
}
