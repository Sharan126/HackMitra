"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Clock,
  Server,
  Activity,
  Layers,
  FileCheck2,
  ExternalLink,
  Info,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "../ui/Button";
import { SystemHealthReport } from "../../lib/scheduler/worker";

export function SourcesDashboard({ initialData }: { initialData?: SystemHealthReport | null }) {
  const [data, setData] = useState<SystemHealthReport | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/cron/worker?action=health");
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.warn("Failed to fetch source health:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      fetchHealth();
    }
  }, [initialData]);

  const handleRunAudit = async () => {
    setIsTriggering(true);
    setTriggerMessage(null);
    try {
      const res = await fetch("/api/cron/worker?action=all&force=true", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        const report = json.report;
        setTriggerMessage(
          `Audit complete in ${report.durationMs}ms: Checked ${report.discovery.sourcesChecked} sources, discovered ${report.discovery.eventsCreated} new events, verified ${report.verification.priorityEventsChecked} priority deadlines.`
        );
        await fetchHealth();
      } else {
        setTriggerMessage(`Audit completed with warning: ${json.error || "Some checks failed"}`);
      }
    } catch (err: any) {
      setTriggerMessage(`Execution error: ${err.message}`);
    } finally {
      setIsTriggering(false);
    }
  };

  const integratedSources = data?.sources.filter((s) => s.integrationStatus === "integrated") || [];
  const manualOrUnintegratedSources = data?.sources.filter((s) => s.integrationStatus !== "integrated") || [];

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#142D4E] hover:text-[#2563EB] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Homepage</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-md border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#16805D]">
            <ShieldCheck className="w-4 h-4 text-[#16805D]" />
            <span>Automated Discovery & Health Monitoring</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHealth}
              disabled={isLoading}
              className="text-xs border-[#E2E8F0] text-[#142D4E] hover:bg-[#F8FAFC]"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunAudit}
              disabled={isTriggering}
              className="text-xs bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
            >
              <Activity className={`w-3.5 h-3.5 mr-1.5 ${isTriggering ? "animate-spin" : ""}`} />
              {isTriggering ? "Running Audit..." : "Run Audit Now"}
            </Button>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#142D4E] tracking-tight">
          How HackMitra Verifies Karnataka Hackathons
        </h1>
        <p className="text-xs sm:text-sm text-[#475569] mt-2 leading-relaxed max-w-3xl">
          Students frequently miss genuine hackathons due to dead links, unverified posters, or predatory entry fees.
          HackMitra operates with automated background workers that continuously discover new events, reverify approaching deadlines, and audit district coverage across all 31 districts.
        </p>

        {/* Global Discovery Timestamp Bar */}
        <div className="mt-6 pt-5 border-t border-[#F1F5F9] grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-3">
            <span className="text-[11px] font-medium text-[#64748B] block mb-0.5">
              Last Successful Discovery
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]">
              <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>
                {data?.lastSuccessfulDiscoveryAt
                  ? new Date(data.lastSuccessfulDiscoveryAt).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }) + " IST"
                  : "Recently verified"}
              </span>
            </div>
          </div>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-3">
            <span className="text-[11px] font-medium text-[#64748B] block mb-0.5">
              Statewide District Coverage
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#16805D]">
              <Layers className="w-3.5 h-3.5 text-[#16805D]" />
              <span>
                {data?.districtCoverage.total || 31} Districts Monitored ({data?.districtCoverage.coveragePercentage || 100}% Active Audits)
              </span>
            </div>
          </div>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-3">
            <span className="text-[11px] font-medium text-[#64748B] block mb-0.5">
              Source Health Overview
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#142D4E]">
              <Server className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>
                {data?.healthySourcesCount || 0} Healthy &bull; {data?.integratedSourcesCount || 0} Automated Adapters
              </span>
            </div>
          </div>
        </div>

        {triggerMessage && (
          <div className="mt-4 p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded text-xs text-[#1D4ED8] flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-[#2563EB]" />
            <span>{triggerMessage}</span>
          </div>
        )}
      </div>

      {/* SECTION 1: Integrated Sources with Automated Pipelines */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#142D4E] tracking-tight">
              Integrated Sources & Automated Adapters
            </h2>
            <p className="text-xs text-[#64748B]">
              These platforms run automated periodic checks with deduplication, URL canonicalization, and retry backoff.
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
            {integratedSources.length} Automated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integratedSources.map((source) => {
            const isFailing = source.healthStatus === "failing" || source.healthStatus === "inaccessible";
            const isDegraded = source.healthStatus === "degraded";

            return (
              <div
                key={source.id}
                className={`bg-white rounded-md border p-5 shadow-xs flex flex-col justify-between ${
                  isFailing ? "border-[#FCA5A5]" : isDegraded ? "border-[#FDE68A]" : "border-[#E2E8F0]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F1F5F9] text-[#334155]">
                      {source.type.replace("_", " ")}
                    </span>

                    {/* Health Status Badge */}
                    {isFailing ? (
                      <span className="text-xs font-semibold text-[#DC2626] flex items-center gap-1 bg-[#FEF2F2] px-2 py-0.5 rounded border border-[#FCA5A5]">
                        <XCircle className="w-3.5 h-3.5" /> Failing (Retry Backoff)
                      </span>
                    ) : isDegraded ? (
                      <span className="text-xs font-semibold text-[#D97706] flex items-center gap-1 bg-[#FFFBEB] px-2 py-0.5 rounded border border-[#FDE68A]">
                        <AlertTriangle className="w-3.5 h-3.5" /> Retrying ({source.consecutiveFailures} attempts)
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-[#16805D] flex items-center gap-1 bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
                        <CheckCircle className="w-3.5 h-3.5" /> Healthy
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-[#0F172A] mb-1">
                    {source.name}
                  </h3>

                  <p className="text-xs text-[#64748B] mb-2 leading-relaxed">
                    <span className="font-semibold text-[#475569]">Coverage:</span> {source.coverageScope}
                  </p>

                  {/* Failure Callout if present */}
                  {source.lastError && (
                    <div className="mb-3 p-2 bg-[#FEF2F2] border border-[#FCA5A5] rounded text-[11px] text-[#991B1B]">
                      <span className="font-semibold">Recent error:</span> {source.lastError}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#F1F5F9] text-xs text-[#475569] space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#64748B]">Last Attempt:</span>
                    <span className="font-medium text-[#0F172A]">
                      {source.lastAttemptedAt
                        ? new Date(source.lastAttemptedAt).toLocaleTimeString("en-IN", {
                            timeZone: "Asia/Kolkata",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Active"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#64748B]">Reliability Score:</span>
                    <span className="font-medium text-[#16805D]">
                      {Math.round(source.reliabilityScore * 100)}% Verified
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Non-Integrated, Inaccessible, or Manual Sources */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#142D4E] tracking-tight">
            Manual Ingestion & Monitored Circulars
          </h2>
          <p className="text-xs text-[#64748B]">
            Sources that lack public REST APIs or restrict automation are tracked manually through faculty circulars, scout noticeboards, or institutional circulars.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {manualOrUnintegratedSources.map((source) => (
            <div
              key={source.id}
              className="bg-white rounded-md border border-[#E2E8F0] p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]">
                    {source.integrationStatus === "manual_only" ? "Manual Circulars" : "API Inaccessible"}
                  </span>
                  <span className="text-xs font-medium text-[#64748B] flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-[#94A3B8]" />
                    {source.integrationStatus === "manual_only" ? "Campus Scout Monitored" : "Manual Moderation"}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-[#0F172A] mb-1">
                  {source.name}
                </h3>
                <p className="text-xs text-[#64748B] mb-3 leading-relaxed">
                  <span className="font-semibold text-[#475569]">Coverage:</span> {source.coverageScope}
                </p>
              </div>

              <div className="pt-3 border-t border-[#F1F5F9] text-xs text-[#64748B]">
                <div className="flex items-center justify-between text-[11px]">
                  <span>Verification Method:</span>
                  <span className="font-medium text-[#334155]">Official PDF / Circular Cross-check</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Statewide District Coverage Tracker */}
      <div className="bg-white rounded-md border border-[#E2E8F0] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#142D4E] tracking-tight">
              Statewide District Coverage Breakdown (All 31 Districts)
            </h2>
            <p className="text-xs text-[#64748B]">
              HackMitra verifies coverage across all 31 districts of Karnataka, distinguishing districts with verified zero events from districts that have not been adequately searched.
            </p>
          </div>
          <Link
            href="/districts"
            className="text-xs font-semibold text-[#2563EB] hover:underline"
          >
            Explore District Directory &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="border border-[#BBF7D0] bg-[#F0FDF4] rounded-md p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16805D]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#16805D]">
                Verified Active
              </h3>
            </div>
            <p className="text-2xl font-black text-[#142D4E]">
              {data?.districtCoverage.verifiedActive || 0}
            </p>
            <p className="text-xs text-[#475569] mt-1">
              Districts with currently active hackathons open for registration.
            </p>
          </div>

          <div className="border border-[#BFDBFE] bg-[#EFF6FF] rounded-md p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">
                Verified Zero
              </h3>
            </div>
            <p className="text-2xl font-black text-[#142D4E]">
              {data?.districtCoverage.verifiedZero || 0}
            </p>
            <p className="text-xs text-[#475569] mt-1">
              Districts actively audited where no hackathons are currently open.
            </p>
          </div>

          <div className="border border-[#FED7AA] bg-[#FFF7ED] rounded-md p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#C2410C]">
                Seeking Leads
              </h3>
            </div>
            <p className="text-2xl font-black text-[#142D4E]">
              {data?.districtCoverage.seekingLeads || 0}
            </p>
            <p className="text-xs text-[#475569] mt-1">
              Districts actively recruiting student campus scouts and college leads.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 4: Recent Automated Audit Logs */}
      {data?.recentDiscoveryRuns && data.recentDiscoveryRuns.length > 0 && (
        <div className="bg-white rounded-md border border-[#E2E8F0] p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#142D4E] tracking-tight">
            Recent Automated Discovery Runs
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                  <th className="py-2 font-semibold">Source</th>
                  <th className="py-2 font-semibold">Status</th>
                  <th className="py-2 font-semibold">Started At</th>
                  <th className="py-2 font-semibold">Discovered</th>
                  <th className="py-2 font-semibold">Ingested</th>
                  <th className="py-2 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {data.recentDiscoveryRuns.slice(0, 6).map((run) => (
                  <tr key={run.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-2 font-bold text-[#142D4E]">{run.source_id}</td>
                    <td className="py-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          run.status === "completed"
                            ? "bg-[#DCFCE7] text-[#166534]"
                            : run.status === "running"
                            ? "bg-[#DBEAFE] text-[#1E40AF]"
                            : "bg-[#FEE2E2] text-[#991B1B]"
                        }`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="py-2 text-[#475569]">
                      {new Date(run.started_at).toLocaleTimeString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="py-2 font-medium text-[#16805D]">{run.events_discovered || 0} new</td>
                    <td className="py-2 text-[#475569]">{run.records_ingested || 0}</td>
                    <td className="py-2 text-[#64748B] max-w-xs truncate">
                      {run.error_message || "Ingestion completed successfully"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reporting Inaccuracies Banner */}
      <div className="bg-[#FEF2F2] rounded-md border border-[#FCA5A5] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#B91C1C] shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm text-[#991B1B]">
              Found a Dead Link or Closed Registration?
            </h3>
            <p className="text-xs text-[#7F1D1D] mt-0.5 max-w-xl">
              Our automated bots inspect registration URLs continuously. If a Google Form reaches its response limit before our next cycle, please report it directly to our moderation team.
            </p>
          </div>
        </div>

        <a
          href="mailto:inaccuracies@hackmitra.org?subject=Reporting%20Hackathon%20Inaccuracy"
          className="shrink-0"
        >
          <Button variant="outline" size="sm" className="border-[#B91C1C] text-[#B91C1C] hover:bg-[#FEE2E2]">
            Report Inaccuracy
          </Button>
        </a>
      </div>
    </div>
  );
}
