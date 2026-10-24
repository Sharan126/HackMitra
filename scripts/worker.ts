/**
 * HackMitra Standalone Background Worker & Scheduler Daemon
 * 
 * Usage:
 *   npx tsx --env-file=.env.local scripts/worker.ts --once       (Single complete orchestration run)
 *   npx tsx --env-file=.env.local scripts/worker.ts             (Continuous daemon with 5m default interval)
 *   npx tsx --env-file=.env.local scripts/worker.ts --interval=60 (Daemon with 60s interval)
 */

import { automationScheduler } from "../src/lib/scheduler/worker";

async function main() {
  const args = process.argv.slice(2);
  const isOnce = args.includes("--once");
  const intervalArg = args.find((a) => a.startsWith("--interval="));
  const intervalSeconds = intervalArg ? parseInt(intervalArg.split("=")[1], 10) : 300;

  console.log("==================================================================");
  console.log("🤖 HACKMITRA AUTOMATED DISCOVERY & VERIFICATION WORKER");
  console.log("==================================================================");
  console.log(`Mode: ${isOnce ? "Single One-Off Execution (--once)" : `Continuous Daemon (${intervalSeconds}s interval)`}`);
  console.log(`Time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST\n`);

  if (isOnce) {
    console.log("▶ Starting single orchestration cycle...");
    try {
      const report = await automationScheduler.runFullCycle({ force: false });
      console.log("\n==================================================================");
      console.log(`ORCHESTRATION CYCLE FINISHED: ${report.overallStatus.toUpperCase()}`);
      console.log("==================================================================");
      console.log(`Cycle ID:        ${report.cycleId}`);
      console.log(`Duration:        ${report.durationMs}ms`);
      console.log(`Sources Checked: ${report.discovery.sourcesChecked} sources`);
      console.log(`Raw Records:     ${report.discovery.totalRawRecords}`);
      console.log(`Events Created:  ${report.discovery.eventsCreated}`);
      console.log(`Events Linked:   ${report.discovery.eventsLinked}`);
      console.log(`Priority Checked:${report.verification.priorityEventsChecked}`);
      console.log(`Status Changed:  ${report.verification.statusChangedCount}`);
      console.log(`Stale Marked:    ${report.verification.staleEventsMarked}`);
      console.log(`Reminders:       ${report.notifications.remindersProcessed} processed (${report.notifications.sentCount} sent, ${report.notifications.skippedCount} skipped, ${report.notifications.failedCount} failed)`);
      console.log(`Districts:       ${report.coverage.activeDistricts} active, ${report.coverage.zeroDistricts} zero, ${report.coverage.seekingLeadsDistricts} seeking leads`);
      console.log("==================================================================\n");

      process.exit(report.overallStatus === "failed" ? 1 : 0);
    } catch (err: any) {
      console.error("❌ Orchestration worker fatal exception:", err);
      process.exit(1);
    }
  } else {
    // Daemon mode
    console.log(`[Worker] Starting continuous background scheduler. Press Ctrl+C to terminate.`);
    automationScheduler.startDaemon(intervalSeconds * 1000);

    const handleShutdown = () => {
      console.log("\n[Worker] Received termination signal. Shutting down gracefully...");
      automationScheduler.stopDaemon();
      process.exit(0);
    };

    process.on("SIGINT", handleShutdown);
    process.on("SIGTERM", handleShutdown);
  }
}

main().catch((err) => {
  console.error("Fatal worker startup exception:", err);
  process.exit(1);
});
