import { Database } from "@/types/database.types";
import { HackathonDraft } from "../validator";

export interface RawDiscoveryRecord {
  externalId: string | null;
  externalUrl: string;
  sourceId: string;
  rawPayload: Record<string, any>;
  extractedTitle?: string;
}

export interface ExtractedEventCandidate {
  rawRecord: RawDiscoveryRecord;
  draft: HackathonDraft;
  confidenceScore: number;
}

export interface SourceAdapter {
  sourceId: string;
  sourceName: string;
  fetchRawRecords(options?: { maxPages?: number }): Promise<RawDiscoveryRecord[]>;
  normalizeRecord(record: RawDiscoveryRecord): ExtractedEventCandidate | null;
}
