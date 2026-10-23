import { SourceType } from "@/types/database.types";

export interface SourceConfig {
  id: string;
  name: string;
  sourceType: SourceType;
  baseUrl: string | null;
  apiUrl?: string;
  isActive: boolean;
  reliabilityScore: number;
  rateLimitPerMinute: number;
  notes: string;
}

export const KNOWN_SOURCES: Record<string, SourceConfig> = {
  devfolio: {
    id: "devfolio",
    name: "Devfolio Official Student Developer Portal",
    sourceType: "aggregator",
    baseUrl: "https://devfolio.co",
    apiUrl: "https://api.devfolio.co/api/hackathons",
    isActive: true,
    reliabilityScore: 0.95,
    rateLimitPerMinute: 30,
    notes: "Verified open public API with page parameter. High fidelity date and location fields.",
  },
  unstop: {
    id: "unstop",
    name: "Unstop National Hackathons & Challenges",
    sourceType: "aggregator",
    baseUrl: "https://unstop.com",
    apiUrl: "https://unstop.com/api/public/opportunity/search-result",
    isActive: true,
    reliabilityScore: 0.90,
    rateLimitPerMinute: 20,
    notes: "Public opportunity search API. Requires strict local Karnataka geographic normalization.",
  },
  hackerearth: {
    id: "hackerearth",
    name: "HackerEarth Challenges",
    sourceType: "aggregator",
    baseUrl: "https://www.hackerearth.com",
    apiUrl: "https://www.hackerearth.com/api/events/upcoming/?format=json",
    isActive: false,
    reliabilityScore: 0.80,
    rateLimitPerMinute: 10,
    notes: "Corporate and global challenge focus. Non-standard single-quoted JSON string payload.",
  },
  vtu_circular: {
    id: "vtu_circular",
    name: "VTU Registrar & Academic Event Notifications",
    sourceType: "university_portal",
    baseUrl: "https://vtu.ac.in",
    isActive: false,
    reliabilityScore: 0.99,
    rateLimitPerMinute: 5,
    notes: "No open REST API. Requires manual campus scout circular ingestion or PDF parsing.",
  },
  ktech_nain: {
    id: "ktech_nain",
    name: "Karnataka Innovation & Technology Society (K-Tech NAIN)",
    sourceType: "university_portal",
    baseUrl: "https://ktech.karnataka.gov.in",
    isActive: false,
    reliabilityScore: 0.98,
    rateLimitPerMinute: 5,
    notes: "Official incubation network. Events posted through institutional college notices.",
  },
  campus_scout_submission: {
    id: "campus_scout_submission",
    name: "Verified Campus Ambassador & Student Submissions",
    sourceType: "manual_submission",
    baseUrl: null,
    isActive: true,
    reliabilityScore: 0.92,
    rateLimitPerMinute: 60,
    notes: "Direct student, faculty, and scout submissions validated through moderation queue.",
  },
};
