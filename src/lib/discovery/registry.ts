import { SourceType } from "@/types/database.types";

export type IntegrationStatus = "integrated" | "not_integrated" | "manual_only";
export type SourceHealthStatus = "healthy" | "degraded" | "failing" | "inaccessible" | "not_integrated";

export interface SourceConfig {
  id: string;
  name: string;
  sourceType: SourceType;
  integrationStatus: IntegrationStatus;
  healthStatus: SourceHealthStatus;
  baseUrl: string | null;
  apiUrl?: string;
  isActive: boolean;
  reliabilityScore: number;
  rateLimitPerMinute: number;
  coverageScope: string;
  estimatedCollegesCovered: number;
  notes: string;
  lastAttemptedAt?: string | null;
  lastSuccessfulAt?: string | null;
  consecutiveFailures?: number;
  lastError?: string | null;
  retryAfter?: string | null;
}

export const KNOWN_SOURCES: Record<string, SourceConfig> = {
  devfolio: {
    id: "devfolio",
    name: "Devfolio Official Student Developer Portal",
    sourceType: "aggregator",
    integrationStatus: "integrated",
    healthStatus: "healthy",
    baseUrl: "https://devfolio.co",
    apiUrl: "https://api.devfolio.co/api/hackathons",
    isActive: true,
    reliabilityScore: 0.95,
    rateLimitPerMinute: 30,
    coverageScope: "Bengaluru, Hubballi-Dharwad, Mangaluru, Belagavi Tier-1 & Tier-2 university hackathons",
    estimatedCollegesCovered: 45,
    notes: "Verified open public API with page parameter. High fidelity date and location fields.",
  },
  unstop: {
    id: "unstop",
    name: "Unstop Karnataka Engineering Opportunities",
    sourceType: "aggregator",
    integrationStatus: "integrated",
    healthStatus: "healthy",
    baseUrl: "https://unstop.com",
    apiUrl: "https://unstop.com/api/public/opportunity/search-result",
    isActive: true,
    reliabilityScore: 0.90,
    rateLimitPerMinute: 20,
    coverageScope: "Statewide Karnataka college technical fests, IEEE & student body competitions",
    estimatedCollegesCovered: 80,
    notes: "Public opportunity search API with automated Karnataka district and college entity extraction.",
  },
  campus_scout_submission: {
    id: "campus_scout_submission",
    name: "Verified Campus Ambassador & Student Submissions",
    sourceType: "manual_submission",
    integrationStatus: "integrated",
    healthStatus: "healthy",
    baseUrl: null,
    isActive: true,
    reliabilityScore: 0.92,
    rateLimitPerMinute: 60,
    coverageScope: "Grassroots coverage in 31 districts, student clubs, ACM & IEEE branches",
    estimatedCollegesCovered: 120,
    notes: "Direct student, faculty, and scout submissions validated through moderator audit queue.",
  },
  hack2skill: {
    id: "hack2skill",
    name: "Hack2skill Karnataka Regional Sprints",
    sourceType: "aggregator",
    integrationStatus: "integrated",
    healthStatus: "healthy",
    baseUrl: "https://hack2skill.com",
    apiUrl: "https://api.hack2skill.com/api/v1/challenges",
    isActive: true,
    reliabilityScore: 0.90,
    rateLimitPerMinute: 15,
    coverageScope: "Corporate & institutional innovation sprints across Karnataka hubs",
    estimatedCollegesCovered: 35,
    notes: "Public challenge portal with regional filtration for Karnataka innovation centers.",
  },
  vtu_circular: {
    id: "vtu_circular",
    name: "VTU Registrar & Academic Event Circulars",
    sourceType: "university_portal",
    integrationStatus: "manual_only",
    healthStatus: "not_integrated",
    baseUrl: "https://vtu.ac.in",
    isActive: false,
    reliabilityScore: 0.99,
    rateLimitPerMinute: 5,
    coverageScope: "200+ VTU affiliated & autonomous engineering colleges across all 31 districts",
    estimatedCollegesCovered: 215,
    notes: "No open REST API. Requires manual campus scout circular ingestion or PDF parsing from Belagavi headquarters.",
  },
  ktech_nain: {
    id: "ktech_nain",
    name: "Karnataka Innovation & Technology Society (K-Tech NAIN)",
    sourceType: "university_portal",
    integrationStatus: "manual_only",
    healthStatus: "not_integrated",
    baseUrl: "https://ktech.karnataka.gov.in",
    isActive: false,
    reliabilityScore: 0.98,
    rateLimitPerMinute: 5,
    coverageScope: "Incubation centers located in 40+ Tier 2 & Tier 3 engineering colleges",
    estimatedCollegesCovered: 42,
    notes: "Official government incubation network. Events posted through institutional college notices and state bulletins.",
  },
  hackerearth: {
    id: "hackerearth",
    name: "HackerEarth Corporate & University Challenges",
    sourceType: "aggregator",
    integrationStatus: "not_integrated",
    healthStatus: "inaccessible",
    baseUrl: "https://www.hackerearth.com",
    apiUrl: "https://www.hackerearth.com/api/events/upcoming/?format=json",
    isActive: false,
    reliabilityScore: 0.80,
    rateLimitPerMinute: 10,
    coverageScope: "Corporate hackathons and hiring challenges with Bengaluru headquarters presence",
    estimatedCollegesCovered: 25,
    notes: "Aggregator API restricted; automated scraping blocked by Cloudflare anti-bot policy. Requires manual verification.",
  },
  sih_karnataka: {
    id: "sih_karnataka",
    name: "Smart India Hackathon (SIH) Karnataka Nodal Centers",
    sourceType: "university_portal",
    integrationStatus: "manual_only",
    healthStatus: "not_integrated",
    baseUrl: "https://www.sih.gov.in",
    isActive: false,
    reliabilityScore: 0.99,
    rateLimitPerMinute: 5,
    coverageScope: "Ministry of Education national hackathon nodal host institutions in Karnataka",
    estimatedCollegesCovered: 30,
    notes: "Annual national challenge with multiple Karnataka nodal college centers (NITK, Manipal, RVCE, NIE).",
  },
};
