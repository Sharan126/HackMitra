import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { SourceAdapter } from "./adapters/base";
import { DevfolioAdapter } from "./adapters/devfolio";
import { processAndIngestEvent } from "./deduplicator";
import { KNOWN_SOURCES } from "./registry";

export interface PipelineExecutionReport {
  runId: string;
  sourceId: string;
  status: "completed" | "failed" | "partial";
  totalRawRecords: number;
  karnatakaCandidatesMatched: number;
  eventsCreated: number;
  eventsLinked: number;
  invalidSkipped: number;
  errors: string[];
  durationMs: number;
}

export class DiscoveryEngine {
  private adapters: Map<string, SourceAdapter> = new Map();

  constructor() {
    // Register available source adapters
    const devfolio = new DevfolioAdapter();
    this.adapters.set(devfolio.sourceId, devfolio);
  }

  getRegisteredAdapters(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Runs the discovery pipeline for a specific source
   */
  async runSourceDiscovery(
    sourceId: string,
    options?: { maxPages?: number }
  ): Promise<PipelineExecutionReport> {
    const startTime = Date.now();
    const adminClient = createAdminSupabaseClient();

    const adapter = this.adapters.get(sourceId);
    if (!adapter) {
      throw new Error(`No adapter registered for source ID '${sourceId}'`);
    }

    // 1. Initialize Discovery Run in database
    let runId = `run_${Date.now()}`;
    if (adminClient) {
      const { data: dbRun } = await adminClient
        .from("discovery_runs")
        .insert({
          source_id: sourceId,
          status: "running",
          records_ingested: 0,
          events_discovered: 0,
          events_updated: 0,
          metadata: { max_pages: options?.maxPages || 1, trigger: "automated_pipeline" },
        } as any)
        .select("id")
        .single();

      if (dbRun) {
        runId = dbRun.id;
      }
    }

    const report: PipelineExecutionReport = {
      runId,
      sourceId,
      status: "completed",
      totalRawRecords: 0,
      karnatakaCandidatesMatched: 0,
      eventsCreated: 0,
      eventsLinked: 0,
      invalidSkipped: 0,
      errors: [],
      durationMs: 0,
    };

    try {
      // 2. Fetch Raw Records
      const rawRecords = await adapter.fetchRawRecords({ maxPages: options?.maxPages || 1 });
      report.totalRawRecords = rawRecords.length;

      // 3. Process each record
      for (const raw of rawRecords) {
        const candidate = adapter.normalizeRecord(raw);
        if (!candidate) {
          // Not a Karnataka event or missing critical fields
          continue;
        }

        report.karnatakaCandidatesMatched++;

        if (adminClient) {
          const result = await processAndIngestEvent(candidate, runId);
          if (result.status === "created") {
            report.eventsCreated++;
          } else if (result.status === "linked") {
            report.eventsLinked++;
          } else if (result.status === "invalid") {
            report.invalidSkipped++;
            if (result.errors) report.errors.push(...result.errors);
          } else {
            if (result.errors) report.errors.push(...result.errors);
          }
        }
      }

      // 4. Update source health and last successful scrape timestamp
      if (adminClient) {
        await adminClient
          .from("event_sources")
          .update({
            last_scraped_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", sourceId);

        // Complete discovery run record
        await adminClient
          .from("discovery_runs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            records_ingested: report.totalRawRecords,
            events_discovered: report.eventsCreated,
            events_updated: report.eventsLinked,
            metadata: {
              karnataka_matches: report.karnatakaCandidatesMatched,
              invalid_skipped: report.invalidSkipped,
            },
          } as any)
          .eq("id", runId);
      }
    } catch (err: any) {
      report.status = "failed";
      report.errors.push(err.message || "Unknown error during discovery pipeline execution");

      if (adminClient) {
        await adminClient
          .from("discovery_runs")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            error_message: err.message,
          } as any)
          .eq("id", runId);
      }
    } finally {
      report.durationMs = Date.now() - startTime;
    }

    return report;
  }
}

// Global discovery engine singleton instance
export const discoveryEngine = new DiscoveryEngine();
