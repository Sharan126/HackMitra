import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { SourceAdapter } from "./adapters/base";
import { DevfolioAdapter } from "./adapters/devfolio";
import { UnstopAdapter } from "./adapters/unstop";
import { processAndIngestEvent } from "./deduplicator";
import { KNOWN_SOURCES, SourceConfig } from "./registry";

export interface PipelineExecutionReport {
  runId: string;
  sourceId: string;
  status: "completed" | "failed" | "partial" | "skipped_locked" | "skipped_backoff";
  totalRawRecords: number;
  karnatakaCandidatesMatched: number;
  eventsCreated: number;
  eventsLinked: number;
  invalidSkipped: number;
  errors: string[];
  durationMs: number;
  consecutiveFailures?: number;
  nextRetryAt?: string | null;
  skipReason?: string;
}

export class DiscoveryEngine {
  private adapters: Map<string, SourceAdapter> = new Map();

  constructor() {
    // Register available source adapters
    const devfolio = new DevfolioAdapter();
    const unstop = new UnstopAdapter();
    this.adapters.set(devfolio.sourceId, devfolio);
    this.adapters.set(unstop.sourceId, unstop);
  }

  getRegisteredAdapters(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Checks whether an active discovery job is already running for the source within TTL.
   * Prevents overlapping background jobs from executing concurrently.
   */
  async checkJobLock(
    sourceId: string,
    ttlMs: number = 5 * 60 * 1000 // default 5 minutes lock TTL
  ): Promise<{ isLocked: boolean; activeRunId?: string }> {
    const adminClient = createAdminSupabaseClient();
    if (!adminClient) return { isLocked: false };

    try {
      const lockThreshold = new Date(Date.now() - ttlMs).toISOString();

      const { data: runningRuns } = await adminClient
        .from("discovery_runs")
        .select("id, started_at")
        .eq("source_id", sourceId)
        .eq("status", "running")
        .gte("started_at", lockThreshold)
        .order("started_at", { ascending: false })
        .limit(1);

      if (runningRuns && runningRuns.length > 0) {
        return { isLocked: true, activeRunId: runningRuns[0].id };
      }

      return { isLocked: false };
    } catch {
      return { isLocked: false };
    }
  }

  /**
   * Evaluates exponential backoff for transient source failures.
   * Backoff formula: min(1min * 2^(failures - 1), 60min)
   */
  async checkBackoffStatus(
    sourceId: string
  ): Promise<{ inBackoff: boolean; nextRetryAt?: Date; failureCount: number; lastError?: string }> {
    const adminClient = createAdminSupabaseClient();
    if (!adminClient) return { inBackoff: false, failureCount: 0 };

    try {
      // Fetch latest 5 runs for this source to inspect failure history
      const { data: recentRuns } = await adminClient
        .from("discovery_runs")
        .select("id, status, started_at, completed_at, error_message, metadata")
        .eq("source_id", sourceId)
        .order("started_at", { ascending: false })
        .limit(5);

      if (!recentRuns || recentRuns.length === 0) {
        return { inBackoff: false, failureCount: 0 };
      }

      // Count consecutive failures starting from the most recent run
      let failureCount = 0;
      let lastError: string | undefined;

      for (const run of recentRuns) {
        if (run.status === "failed") {
          failureCount++;
          if (!lastError && run.error_message) {
            lastError = run.error_message;
          }
        } else if (run.status === "completed") {
          break; // Stop counting consecutive failures once a success is encountered
        }
      }

      if (failureCount === 0) {
        return { inBackoff: false, failureCount: 0 };
      }

      // Calculate backoff in milliseconds: 1m, 2m, 4m, 8m, up to 60m
      const backoffMinutes = Math.min(Math.pow(2, failureCount - 1), 60);
      const lastRunTime = new Date(recentRuns[0].completed_at || recentRuns[0].started_at).getTime();
      const nextRetryAt = new Date(lastRunTime + backoffMinutes * 60 * 1000);

      const inBackoff = Date.now() < nextRetryAt.getTime();

      return { inBackoff, nextRetryAt, failureCount, lastError };
    } catch {
      return { inBackoff: false, failureCount: 0 };
    }
  }

  /**
   * Runs the discovery pipeline for a specific source with mutual exclusion and backoff.
   */
  async runSourceDiscovery(
    sourceId: string,
    options?: {
      maxPages?: number;
      force?: boolean;
      simulateFailure?: boolean;
      lockTtlMs?: number;
    }
  ): Promise<PipelineExecutionReport> {
    const startTime = Date.now();
    const adminClient = createAdminSupabaseClient();

    const adapter = this.adapters.get(sourceId);
    if (!adapter) {
      throw new Error(`No adapter registered for source ID '${sourceId}'`);
    }

    // 1. MUTUAL EXCLUSION LOCK CHECK
    // Invariant: "Prevent overlapping jobs from creating duplicate records."
    if (!options?.force) {
      const lockCheck = await this.checkJobLock(sourceId, options?.lockTtlMs);
      if (lockCheck.isLocked) {
        return {
          runId: `locked_${Date.now()}`,
          sourceId,
          status: "skipped_locked",
          totalRawRecords: 0,
          karnatakaCandidatesMatched: 0,
          eventsCreated: 0,
          eventsLinked: 0,
          invalidSkipped: 0,
          errors: [`Concurrent job lock held by active run '${lockCheck.activeRunId}'`],
          durationMs: Date.now() - startTime,
          skipReason: "Overlapping job prevented: an active discovery run is currently in progress",
        };
      }
    }

    // 2. RETRY BACKOFF CHECK
    // Invariant: "Retry transient failures with backoff."
    if (!options?.force) {
      const backoff = await this.checkBackoffStatus(sourceId);
      if (backoff.inBackoff && backoff.nextRetryAt) {
        const remainingSec = Math.round((backoff.nextRetryAt.getTime() - Date.now()) / 1000);
        return {
          runId: `backoff_${Date.now()}`,
          sourceId,
          status: "skipped_backoff",
          totalRawRecords: 0,
          karnatakaCandidatesMatched: 0,
          eventsCreated: 0,
          eventsLinked: 0,
          invalidSkipped: 0,
          errors: [`Source in transient backoff cooldown (${remainingSec}s remaining)`],
          durationMs: Date.now() - startTime,
          consecutiveFailures: backoff.failureCount,
          nextRetryAt: backoff.nextRetryAt.toISOString(),
          skipReason: `Exponential backoff active (${backoff.failureCount} prior failures). Next retry at ${backoff.nextRetryAt.toLocaleTimeString()}`,
        };
      }
    }

    // 3. Initialize Discovery Run in database (Acquiring Lock)
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
          metadata: {
            max_pages: options?.maxPages || 1,
            trigger: options?.force ? "manual_forced" : "automated_pipeline",
            adapter: adapter.sourceName,
          },
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
      // Simulate failure if explicitly requested for failure/backoff testing
      if (options?.simulateFailure) {
        throw new Error(`Simulated transient network timeout for adapter '${sourceId}'`);
      }

      // 4. Fetch Raw Records from Adapter
      const rawRecords = await adapter.fetchRawRecords({ maxPages: options?.maxPages || 1 });
      report.totalRawRecords = rawRecords.length;

      // 5. Deduplicate and ingest each candidate
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

      // 6. Record successful execution
      if (adminClient) {
        await adminClient
          .from("event_sources")
          .update({
            last_scraped_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", sourceId);

        // Complete discovery run record (Releasing Lock)
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
              consecutive_failures: 0,
            },
          } as any)
          .eq("id", runId);
      }
    } catch (err: any) {
      report.status = "failed";
      report.errors.push(err.message || "Unknown error during discovery pipeline execution");

      // Calculate new failure count and backoff for logging
      const backoffCheck = await this.checkBackoffStatus(sourceId);
      const newFailureCount = backoffCheck.failureCount + 1;
      const backoffMin = Math.min(Math.pow(2, newFailureCount - 1), 60);
      const retryAt = new Date(Date.now() + backoffMin * 60 * 1000);

      report.consecutiveFailures = newFailureCount;
      report.nextRetryAt = retryAt.toISOString();

      if (adminClient) {
        await adminClient
          .from("discovery_runs")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            error_message: err.message,
            metadata: {
              consecutive_failures: newFailureCount,
              next_retry_at: retryAt.toISOString(),
              backoff_minutes: backoffMin,
            },
          } as any)
          .eq("id", runId);
      }
    } finally {
      report.durationMs = Date.now() - startTime;
    }

    return report;
  }

  /**
   * Runs discovery across all configured and integrated sources
   */
  async runAllConfiguredSources(options?: {
    maxPages?: number;
    force?: boolean;
  }): Promise<PipelineExecutionReport[]> {
    const reports: PipelineExecutionReport[] = [];
    const sourceIds = this.getRegisteredAdapters();

    for (const sourceId of sourceIds) {
      const rep = await this.runSourceDiscovery(sourceId, options);
      reports.push(rep);
    }

    return reports;
  }

  /**
   * Retrieves comprehensive health status across all configured sources
   */
  async getSourceHealthSummary(): Promise<
    Record<
      string,
      {
        config: SourceConfig;
        isIntegrated: boolean;
        lastAttemptedAt: string | null;
        lastSuccessfulAt: string | null;
        consecutiveFailures: number;
        lastError: string | null;
        status: "healthy" | "degraded" | "failing" | "inaccessible" | "not_integrated";
        totalRuns: number;
        discoveredCount: number;
      }
    >
  > {
    const adminClient = createAdminSupabaseClient();
    const result: Record<string, any> = {};

    for (const [key, config] of Object.entries(KNOWN_SOURCES)) {
      const isIntegrated = this.adapters.has(key);

      if (!isIntegrated) {
        result[key] = {
          config,
          isIntegrated: false,
          lastAttemptedAt: null,
          lastSuccessfulAt: null,
          consecutiveFailures: 0,
          lastError: null,
          status: config.integrationStatus === "manual_only" ? "not_integrated" : "inaccessible",
          totalRuns: 0,
          discoveredCount: 0,
        };
        continue;
      }

      if (!adminClient) {
        result[key] = {
          config,
          isIntegrated: true,
          lastAttemptedAt: null,
          lastSuccessfulAt: null,
          consecutiveFailures: 0,
          lastError: null,
          status: "healthy",
          totalRuns: 0,
          discoveredCount: 0,
        };
        continue;
      }

      // Query database for recent runs
      const { data: runs } = await adminClient
        .from("discovery_runs")
        .select("id, status, started_at, completed_at, events_discovered, error_message")
        .eq("source_id", key)
        .order("started_at", { ascending: false })
        .limit(10);

      const latestRun = runs && runs.length > 0 ? runs[0] : null;
      const successfulRuns = runs?.filter((r) => r.status === "completed") || [];
      const latestSuccess = successfulRuns.length > 0 ? successfulRuns[0] : null;

      let consecutiveFailures = 0;
      let lastError: string | null = null;

      if (runs) {
        for (const r of runs) {
          if (r.status === "failed") {
            consecutiveFailures++;
            if (!lastError && r.error_message) lastError = r.error_message;
          } else if (r.status === "completed") {
            break;
          }
        }
      }

      let healthStatus: "healthy" | "degraded" | "failing" = "healthy";
      if (consecutiveFailures >= 3) {
        healthStatus = "failing";
      } else if (consecutiveFailures > 0) {
        healthStatus = "degraded";
      }

      const totalDiscovered =
        runs?.reduce((sum, r) => sum + (r.events_discovered || 0), 0) || 0;

      result[key] = {
        config,
        isIntegrated: true,
        lastAttemptedAt: latestRun?.started_at || null,
        lastSuccessfulAt: latestSuccess?.completed_at || null,
        consecutiveFailures,
        lastError,
        status: healthStatus,
        totalRuns: runs?.length || 0,
        discoveredCount: totalDiscovered,
      };
    }

    return result;
  }
}

// Global discovery engine singleton instance
export const discoveryEngine = new DiscoveryEngine();
