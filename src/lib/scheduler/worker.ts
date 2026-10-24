/**
 * HackMitra Automated Discovery & Verification Scheduler
 * 
 * Provides background job orchestration, concurrency control,
 * exponential retry backoff, stale data handling, and statewide coverage audits.
 */

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { discoveryEngine, PipelineExecutionReport } from "@/lib/discovery/engine";
import {
  runPriorityDeadlineRechecks,
  markStaleEventsForReverification,
} from "@/lib/verification/engine";
import { KNOWN_SOURCES } from "@/lib/discovery/registry";
import { KARNATAKA_DISTRICTS } from "@/lib/karnataka-data";
import { NotificationEngine } from "@/lib/notifications/notification-engine";

export interface OrchestrationCycleReport {
  cycleId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  discovery: {
    sourcesChecked: number;
    totalRawRecords: number;
    eventsCreated: number;
    eventsLinked: number;
    failures: number;
    skippedLocked: number;
    skippedBackoff: number;
    reports: PipelineExecutionReport[];
  };
  verification: {
    priorityEventsChecked: number;
    statusChangedCount: number;
    staleEventsMarked: number;
  };
  notifications: {
    remindersProcessed: number;
    sentCount: number;
    skippedCount: number;
    failedCount: number;
  };
  coverage: {
    totalDistricts: number;
    activeDistricts: number;
    zeroDistricts: number;
    seekingLeadsDistricts: number;
  };
  overallStatus: "success" | "partial_failure" | "failed";
}

export interface SourceCoverageStat {
  id: string;
  name: string;
  type: string;
  integrationStatus: "integrated" | "not_integrated" | "manual_only";
  healthStatus: "healthy" | "degraded" | "failing" | "inaccessible" | "not_integrated";
  lastAttemptedAt: string | null;
  lastSuccessfulAt: string | null;
  consecutiveFailures: number;
  lastError: string | null;
  reliabilityScore: number;
  coverageScope: string;
}

export interface SystemHealthReport {
  lastSuccessfulDiscoveryAt: string | null;
  lastSuccessfulVerificationAt: string | null;
  totalConfiguredSources: number;
  integratedSourcesCount: number;
  unintegratedSourcesCount: number;
  healthySourcesCount: number;
  failingSourcesCount: number;
  sources: SourceCoverageStat[];
  districtCoverage: {
    total: number;
    verifiedActive: number;
    verifiedZero: number;
    seekingLeads: number;
    coveragePercentage: number;
  };
  recentDiscoveryRuns: any[];
  recentVerificationLogs: any[];
}

export class AutomationScheduler {
  private isRunning: boolean = false;
  private intervalTimer: NodeJS.Timeout | null = null;

  /**
   * Runs the complete discovery and verification cycle
   */
  async runFullCycle(options?: {
    force?: boolean;
    maxPages?: number;
    priorityLimit?: number;
  }): Promise<OrchestrationCycleReport> {
    const cycleId = `cycle_${Date.now()}`;
    const startTime = Date.now();
    const startedAt = new Date().toISOString();

    // 1. Run Discovery Pipeline across all configured sources
    const discoveryReports = await discoveryEngine.runAllConfiguredSources({
      maxPages: options?.maxPages || 1,
      force: options?.force || false,
    });

    let totalRaw = 0;
    let created = 0;
    let linked = 0;
    let failures = 0;
    let skippedLocked = 0;
    let skippedBackoff = 0;

    for (const r of discoveryReports) {
      totalRaw += r.totalRawRecords;
      created += r.eventsCreated;
      linked += r.eventsLinked;
      if (r.status === "failed") failures++;
      else if (r.status === "skipped_locked") skippedLocked++;
      else if (r.status === "skipped_backoff") skippedBackoff++;
    }

    // 2. Mark Stale Events for Reverification (>48h threshold)
    const staleMarked = await markStaleEventsForReverification({ staleThresholdHours: 48 });

    // 3. Re-verify events with Approaching Deadlines
    const priorityChecks = await runPriorityDeadlineRechecks({
      limit: options?.priorityLimit || 25,
      skipNetwork: false,
    });

    const statusChangedCount = priorityChecks.filter((p) => p.statusChanged).length;

    // 4. Process Pending Deadline Reminders (48h and 24h triggers)
    const notifResult = await NotificationEngine.processPendingReminders();

    // 5. Update District and Statewide Coverage
    const coverageStats = await this.auditAndSyncDistrictCoverage();

    const durationMs = Date.now() - startTime;
    const completedAt = new Date().toISOString();

    let overallStatus: "success" | "partial_failure" | "failed" = "success";
    if (failures > 0 && (created > 0 || linked > 0 || priorityChecks.length > 0)) {
      overallStatus = "partial_failure";
    } else if (failures > 0 && discoveryReports.length === failures) {
      overallStatus = "failed";
    }

    return {
      cycleId,
      startedAt,
      completedAt,
      durationMs,
      discovery: {
        sourcesChecked: discoveryReports.length,
        totalRawRecords: totalRaw,
        eventsCreated: created,
        eventsLinked: linked,
        failures,
        skippedLocked,
        skippedBackoff,
        reports: discoveryReports,
      },
      verification: {
        priorityEventsChecked: priorityChecks.length,
        statusChangedCount,
        staleEventsMarked: staleMarked.length,
      },
      notifications: {
        remindersProcessed: notifResult.sentCount + notifResult.skippedCount + notifResult.failedCount,
        sentCount: notifResult.sentCount,
        skippedCount: notifResult.skippedCount,
        failedCount: notifResult.failedCount,
      },
      coverage: coverageStats,
      overallStatus,
    };
  }

  /**
   * Audits district hackathon counts and syncs coverage_status across all 31 districts
   */
  async auditAndSyncDistrictCoverage(): Promise<{
    totalDistricts: number;
    activeDistricts: number;
    zeroDistricts: number;
    seekingLeadsDistricts: number;
  }> {
    const adminClient = createAdminSupabaseClient();
    if (!adminClient) {
      return { totalDistricts: 31, activeDistricts: 0, zeroDistricts: 0, seekingLeadsDistricts: 31 };
    }

    try {
      // Query verified hackathons grouped by district_id
      const { data: hackathons } = await adminClient
        .from("hackathons")
        .select("district_id, current_status")
        .in("current_status", ["open", "closing_soon", "deadline_today", "upcoming"]);

      const activeDistrictCounts = new Map<string, number>();
      if (hackathons) {
        for (const h of hackathons) {
          activeDistrictCounts.set(h.district_id, (activeDistrictCounts.get(h.district_id) || 0) + 1);
        }
      }

      let activeDistricts = 0;
      let zeroDistricts = 0;
      let seekingLeadsDistricts = 0;

      const nowIso = new Date().toISOString();

      for (const dist of KARNATAKA_DISTRICTS) {
        const count = activeDistrictCounts.get(dist.slug) || activeDistrictCounts.get(dist.id) || 0;
        let newStatus: "verified_active" | "verified_zero" | "seeking_leads" = "seeking_leads";

        if (count > 0) {
          newStatus = "verified_active";
          activeDistricts++;
        } else if (dist.monitoredCollegesCount > 0) {
          newStatus = "verified_zero";
          zeroDistricts++;
        } else {
          newStatus = "seeking_leads";
          seekingLeadsDistricts++;
        }

        // Update district record in database
        await adminClient
          .from("districts")
          .update({
            coverage_status: newStatus,
            last_audited_at: nowIso,
            updated_at: nowIso,
          } as any)
          .eq("id", dist.slug);
      }

      return {
        totalDistricts: KARNATAKA_DISTRICTS.length,
        activeDistricts,
        zeroDistricts,
        seekingLeadsDistricts,
      };
    } catch (err) {
      console.warn("District coverage audit warning:", err);
      return { totalDistricts: 31, activeDistricts: 0, zeroDistricts: 0, seekingLeadsDistricts: 31 };
    }
  }

  /**
   * Compiles live system health, source status, and coverage metrics
   */
  async getSystemHealth(): Promise<SystemHealthReport> {
    const adminClient = createAdminSupabaseClient();
    const sourceSummary = await discoveryEngine.getSourceHealthSummary();

    let lastSuccessfulDiscoveryAt: string | null = null;
    let lastSuccessfulVerificationAt: string | null = null;

    let healthyCount = 0;
    let failingCount = 0;
    let integratedCount = 0;
    let unintegratedCount = 0;

    const sourcesList: SourceCoverageStat[] = [];

    for (const [id, data] of Object.entries(sourceSummary)) {
      if (data.isIntegrated) integratedCount++;
      else unintegratedCount++;

      if (data.status === "healthy") healthyCount++;
      else if (data.status === "failing" || data.status === "inaccessible") failingCount++;

      if (data.lastSuccessfulAt) {
        if (!lastSuccessfulDiscoveryAt || new Date(data.lastSuccessfulAt) > new Date(lastSuccessfulDiscoveryAt)) {
          lastSuccessfulDiscoveryAt = data.lastSuccessfulAt;
        }
      }

      sourcesList.push({
        id,
        name: data.config.name,
        type: data.config.sourceType,
        integrationStatus: data.config.integrationStatus,
        healthStatus: data.status,
        lastAttemptedAt: data.lastAttemptedAt,
        lastSuccessfulAt: data.lastSuccessfulAt,
        consecutiveFailures: data.consecutiveFailures,
        lastError: data.lastError,
        reliabilityScore: data.config.reliabilityScore,
        coverageScope: data.config.coverageScope,
      });
    }

    // Query recent discovery runs and verification logs
    let recentRuns: any[] = [];
    let recentLogs: any[] = [];
    let activeDistricts = 0;
    let zeroDistricts = 0;
    let seekingLeadsDistricts = 0;

    if (adminClient) {
      // Recent Discovery Runs
      const { data: runs } = await adminClient
        .from("discovery_runs")
        .select("id, source_id, status, started_at, completed_at, records_ingested, events_discovered, error_message")
        .order("started_at", { ascending: false })
        .limit(8);
      recentRuns = runs || [];

      // Recent Verification Logs
      const { data: logs } = await adminClient
        .from("verification_logs")
        .select("id, hackathon_id, previous_status, new_status, verification_check_type, is_verified, notes, created_at")
        .order("created_at", { ascending: false })
        .limit(8);
      recentLogs = logs || [];

      if (recentLogs.length > 0) {
        lastSuccessfulVerificationAt = recentLogs[0].created_at;
      }

      // Districts
      const { data: districts } = await adminClient
        .from("districts")
        .select("coverage_status");

      if (districts) {
        for (const d of districts) {
          if (d.coverage_status === "verified_active") activeDistricts++;
          else if (d.coverage_status === "verified_zero") zeroDistricts++;
          else seekingLeadsDistricts++;
        }
      }
    }

    const totalDistricts = 31;
    const coveragePercentage = Math.round(((activeDistricts + zeroDistricts) / totalDistricts) * 100);

    return {
      lastSuccessfulDiscoveryAt,
      lastSuccessfulVerificationAt,
      totalConfiguredSources: Object.keys(KNOWN_SOURCES).length,
      integratedSourcesCount: integratedCount,
      unintegratedSourcesCount: unintegratedCount,
      healthySourcesCount: healthyCount,
      failingSourcesCount: failingCount,
      sources: sourcesList,
      districtCoverage: {
        total: totalDistricts,
        verifiedActive: activeDistricts,
        verifiedZero: zeroDistricts,
        seekingLeads: seekingLeadsDistricts,
        coveragePercentage,
      },
      recentDiscoveryRuns: recentRuns,
      recentVerificationLogs: recentLogs,
    };
  }

  /**
   * Starts a background daemon timer running recurring cycles
   */
  startDaemon(intervalMs: number = 10 * 60 * 1000) {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log(`[AutomationScheduler] Starting background worker daemon (interval: ${intervalMs / 1000}s)`);

    // Run first cycle immediately
    this.runFullCycle().catch((err) => console.error("[AutomationScheduler] Cycle error:", err));

    this.intervalTimer = setInterval(() => {
      this.runFullCycle().catch((err) => console.error("[AutomationScheduler] Cycle error:", err));
    }, intervalMs);
  }

  /**
   * Stops the recurring background daemon timer
   */
  stopDaemon() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.isRunning = false;
    console.log("[AutomationScheduler] Stopped background worker daemon");
  }
}

// Global scheduler singleton instance
export const automationScheduler = new AutomationScheduler();
