import { NextRequest, NextResponse } from "next/server";
import { automationScheduler } from "@/lib/scheduler/worker";
import { discoveryEngine } from "@/lib/discovery/engine";
import {
  runPriorityDeadlineRechecks,
  markStaleEventsForReverification,
} from "@/lib/verification/engine";

export const dynamic = "force-dynamic";

/**
 * Handles scheduled cron jobs and on-demand orchestration triggers
 * 
 * Supports:
 *   GET /api/cron/worker?action=health
 *   POST /api/cron/worker?action=all&force=true
 *   POST /api/cron/worker?action=discovery
 *   POST /api/cron/worker?action=verify
 *   POST /api/cron/worker?action=stale
 */
export async function GET(request: NextRequest) {
  return handleWorkerRequest(request);
}

export async function POST(request: NextRequest) {
  return handleWorkerRequest(request);
}

async function handleWorkerRequest(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "health";
  const force = searchParams.get("force") === "true";

  // Optional bearer secret validation if configured in production
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const providedSecret = searchParams.get("secret") || (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);

  if (cronSecret && providedSecret !== cronSecret) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Invalid CRON_SECRET" },
      { status: 401 }
    );
  }

  try {
    switch (action) {
      case "health": {
        const health = await automationScheduler.getSystemHealth();
        return NextResponse.json({ success: true, action: "health", data: health });
      }

      case "discovery": {
        const reports = await discoveryEngine.runAllConfiguredSources({ force });
        return NextResponse.json({
          success: true,
          action: "discovery",
          reports,
          timestamp: new Date().toISOString(),
        });
      }

      case "verify": {
        const priorityResults = await runPriorityDeadlineRechecks({ limit: 30, skipNetwork: false });
        return NextResponse.json({
          success: true,
          action: "verify",
          checkedCount: priorityResults.length,
          statusChangedCount: priorityResults.filter((p) => p.statusChanged).length,
          results: priorityResults,
          timestamp: new Date().toISOString(),
        });
      }

      case "stale": {
        const markedStale = await markStaleEventsForReverification({ staleThresholdHours: 48 });
        return NextResponse.json({
          success: true,
          action: "stale",
          markedStaleCount: markedStale.length,
          markedStale,
          timestamp: new Date().toISOString(),
        });
      }

      case "coverage": {
        const coverage = await automationScheduler.auditAndSyncDistrictCoverage();
        return NextResponse.json({
          success: true,
          action: "coverage",
          coverage,
          timestamp: new Date().toISOString(),
        });
      }

      case "all":
      default: {
        const fullReport = await automationScheduler.runFullCycle({ force });
        return NextResponse.json({
          success: fullReport.overallStatus !== "failed",
          action: "all",
          report: fullReport,
        });
      }
    }
  } catch (err: any) {
    console.error("[Worker API Error]:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to execute worker orchestration action",
      },
      { status: 500 }
    );
  }
}
