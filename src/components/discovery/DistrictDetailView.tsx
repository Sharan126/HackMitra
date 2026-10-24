"use client";

import React, { useState } from "react";
import Link from "next/link";
import { District } from "../../lib/karnataka-data";
import { Hackathon } from "../../types/hackathon";
import { HackathonCard } from "../ui/HackathonCard";
import {
  MapPin,
  ArrowLeft,
  Calendar,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Radio,
  Clock,
  Compass,
  PlusCircle,
  ExternalLink,
  Bell,
  Users,
  AlertTriangle,
  Info,
} from "lucide-react";

interface DistrictDetailViewProps {
  district: District;
  discoveredEvents: Hackathon[];
  openRegistrations: Hackathon[];
  upcomingEvents: Hackathon[];
  closedEvents: Hackathon[];
  sisterDistricts: { name: string; slug: string; kannadaName: string; hackathonCount: number }[];
}

export function DistrictDetailView({
  district,
  discoveredEvents,
  openRegistrations,
  upcomingEvents,
  closedEvents,
  sisterDistricts,
}: DistrictDetailViewProps) {
  const [activeTab, setActiveTab] = useState<"all" | "open" | "upcoming">("all");
  const [alertSubmitted, setAlertSubmitted] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  const handleAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setAlertSubmitted(true);
    }
  };

  const displayedEvents =
    activeTab === "open"
      ? openRegistrations
      : activeTab === "upcoming"
      ? upcomingEvents
      : discoveredEvents;

  return (
    <div className="space-y-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <Link
          href="/districts"
          className="inline-flex items-center gap-1.5 font-semibold text-[#142D4E] hover:text-[#2563EB] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All 31 Karnataka Districts</span>
        </Link>

        <div className="flex items-center gap-2 text-[#64748B]">
          <span>{district.division} Division</span>
          <span>•</span>
          <span>{district.cluster}</span>
        </div>
      </div>

      {/* District Header Banner */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-[#F1F5F9]">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#142D4E] text-white text-[11px] font-bold tracking-wide">
                {district.division} Division
              </span>
              <span className="px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] text-[11px] font-semibold border border-[#E2E8F0]">
                {district.cluster}
              </span>
              <span className="text-xs text-[#64748B]">
                HQ: <strong className="text-[#0F172A]">{district.headquarters}</strong>
              </span>
            </div>

            <div className="flex items-baseline gap-3 pt-1">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#142D4E] tracking-tight">
                {district.name}
              </h1>
              <span className="text-lg sm:text-2xl font-bold font-kannada text-[#64748B]">
                {district.kannadaName}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#475569] max-w-2xl leading-relaxed">
              District hackathon directory and verification radar for {district.name}. Tracking collegiate hackathons, VTU circulars, faculty notices, and NAIN incubator sprints.
            </p>
          </div>

          {/* Audit Freshness & Status Card */}
          <div className="w-full lg:w-80 bg-[#F8FAFC] rounded-md border border-[#CBD5E1] p-4 text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <span className="font-bold text-[#142D4E] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Audit Freshness</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#16805D] border border-[#A7F3D0]">
                Verified
              </span>
            </div>

            <div className="space-y-1.5 text-[#64748B]">
              <div className="flex justify-between">
                <span>Last Scanned:</span>
                <span className="font-semibold text-[#0F172A]">{district.lastAudited}</span>
              </div>
              <div className="flex justify-between">
                <span>Audit Frequency:</span>
                <span className="font-semibold text-[#0F172A]">Every {district.auditFrequencyHours} Hours</span>
              </div>
              <div className="flex justify-between">
                <span>Campuses Monitored:</span>
                <span className="font-semibold text-[#0F172A]">
                  {district.monitoredCollegesCount} Colleges ({district.nainCentersCount} NAIN Hubs)
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px]">
              <span className="text-[#64748B]">District Status:</span>
              {discoveredEvents.length > 0 ? (
                <span className="font-bold text-[#16805D] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Active Opportunities</span>
                </span>
              ) : district.coverageStatus === "verified_zero" ? (
                <span className="font-bold text-[#0369A1] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Audited (0 Active)</span>
                </span>
              ) : (
                <span className="font-bold text-[#D97706] flex items-center gap-1">
                  <Radio className="w-3 h-3" />
                  <span>Seeking Leads</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Statistical Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="p-3 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">Total Discovered</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#142D4E]">{discoveredEvents.length}</span>
              <span className="text-xs text-[#64748B]">Events</span>
            </div>
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">Open Registrations</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#16805D]">{openRegistrations.length}</span>
              <span className="text-xs text-[#16805D] font-bold">Accepting Entries</span>
            </div>
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">Upcoming Fests</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#0369A1]">{upcomingEvents.length}</span>
              <span className="text-xs text-[#64748B]">Scheduled</span>
            </div>
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">Monitored Hubs</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#142D4E]">{district.monitoredCollegesCount}</span>
              <span className="text-xs text-[#64748B]">VTU Campuses</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* If Hackathons Exist: Show Filter Tabs and Cards Grid */}
        {discoveredEvents.length > 0 ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    activeTab === "all"
                      ? "bg-[#142D4E] text-white"
                      : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                  }`}
                >
                  All Events ({discoveredEvents.length})
                </button>

                <button
                  onClick={() => setActiveTab("open")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    activeTab === "open"
                      ? "bg-[#16805D] text-white"
                      : "bg-[#ECFDF5] text-[#16805D] hover:bg-[#D1FAE5]"
                  }`}
                >
                  Open Registrations ({openRegistrations.length})
                </button>

                <button
                  onClick={() => setActiveTab("upcoming")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    activeTab === "upcoming"
                      ? "bg-[#0369A1] text-white"
                      : "bg-[#E0F2FE] text-[#0369A1] hover:bg-[#BAE6FD]"
                  }`}
                >
                  Upcoming ({upcomingEvents.length})
                </button>
              </div>

              <div className="text-xs text-[#64748B]">
                Showing {displayedEvents.length} event{displayedEvents.length === 1 ? "" : "s"} in {district.name}
              </div>
            </div>

            {displayedEvents.length === 0 ? (
              <div className="bg-white rounded-lg border border-[#E2E8F0] p-8 text-center space-y-2">
                <h4 className="text-sm font-bold text-[#142D4E]">No {activeTab} events right now</h4>
                <p className="text-xs text-[#64748B]">
                  Check the &quot;All Events&quot; tab to explore all verified hackathons in {district.name}.
                </p>
                <button
                  onClick={() => setActiveTab("all")}
                  className="mt-2 text-xs font-semibold text-[#2563EB] hover:underline"
                >
                  View All {discoveredEvents.length} Events
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayedEvents.map((hackathon) => (
                  <HackathonCard key={hackathon.id} hackathon={hackathon} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ZERO RESULTS DISTINCTION (Critical Requirement) */
          <div className="space-y-6">
            {district.coverageStatus === "verified_zero" ? (
              /* SCENARIO A: VERIFIED ZERO (Audited, clean zero-state) */
              <div className="bg-white rounded-lg border-2 border-[#BAE6FD] p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center shrink-0 text-[#0369A1]">
                    <ShieldCheck className="w-7 h-7" />
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#E0F2FE] text-[#0369A1] text-xs font-bold uppercase tracking-wider">
                      <span>Audit Status: Fully Audited • 0 Active Hackathons</span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-[#142D4E]">
                      No active hackathons currently open in {district.name}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                      Our discovery pipeline audited official circulars, VTU notifications, and incubation calendars from all{" "}
                      <strong>{district.monitoredCollegesCount} monitored colleges</strong> and NAIN centers in {district.name} on{" "}
                      <strong>{district.lastAudited}</strong>.
                    </p>

                    <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                      There are currently no active hackathons or open registrations scheduled for this cycle. The next automated scan will run in{" "}
                      <strong>{district.auditFrequencyHours} hours</strong>.
                    </p>
                  </div>
                </div>

                {/* Audit Proof Checklist */}
                <div className="bg-[#F8FAFC] rounded-md border border-[#E2E8F0] p-4 text-xs space-y-2">
                  <span className="font-bold text-[#142D4E] block">Institutions Verified During Last Cycle:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#475569]">
                    {district.keyInstitutions.map((inst, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#16805D] shrink-0" />
                        <span className="truncate">{inst}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions for Verified Zero */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <Link
                    href="/submit"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#142D4E] text-white text-xs font-bold rounded-md hover:bg-[#2563EB] transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Submit Unlisted {district.name} Circular</span>
                  </Link>

                  <a
                    href="#notify-section"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#CBD5E1] text-[#0F172A] text-xs font-semibold rounded-md hover:bg-[#F8FAFC] transition-colors"
                  >
                    <Bell className="w-4 h-4 text-[#2563EB]" />
                    <span>Get Alerted When {district.name} Posts an Event</span>
                  </a>
                </div>
              </div>
            ) : (
              /* SCENARIO B: SEEKING LEADS (Radar is active, calls for student scouts) */
              <div className="bg-white rounded-lg border-2 border-[#FDE68A] p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center shrink-0 text-[#B45309]">
                    <Radio className="w-7 h-7 animate-pulse" />
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#FEF3C7] text-[#B45309] text-xs font-bold uppercase tracking-wider">
                      <span>Radar Active • Seeking Campus Ambassadors in {district.name}</span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-[#142D4E]">
                      Are you a student or faculty member in {district.name}?
                    </h3>

                    <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                      While HackMitra monitors state-level portals, collegiate hackathons and tech fests in {district.name} are often circulated through internal departmental noticeboards, club flyers, and college WhatsApp groups before reaching the public web.
                    </p>

                    <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                      We are recruiting <strong>Campus Scouts</strong> for engineering colleges in {district.headquarters} and across {district.name} to ensure every student build sprint is spotlighted statewide.
                    </p>
                  </div>
                </div>

                {/* How campus scouts help */}
                <div className="bg-[#FFFBEB] rounded-md border border-[#FDE68A] p-4 text-xs space-y-2">
                  <span className="font-bold text-[#B45309] block">How to Help Bridge the Discovery Gap:</span>
                  <ul className="list-disc list-inside space-y-1 text-[#78350F]">
                    <li>Share photos of circulars or brochures from your college noticeboard.</li>
                    <li>Submit registration links for departmental fests, IEEE student branches, and ACM chapters.</li>
                    <li>Help classmates and local developers participate in statewide hackathons.</li>
                  </ul>
                </div>

                {/* Actions for Seeking Leads */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <Link
                    href="/submit"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#D97706] text-white text-xs font-bold rounded-md hover:bg-[#B45309] transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    <span>Become a Campus Scout for {district.name}</span>
                  </Link>

                  <Link
                    href="/submit"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#CBD5E1] text-[#0F172A] text-xs font-semibold rounded-md hover:bg-[#F8FAFC] transition-colors"
                  >
                    <PlusCircle className="w-4 h-4 text-[#D97706]" />
                    <span>Submit College Fest Circular</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Source Coverage & Monitored Campuses Transparency Box */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <h3 className="text-sm sm:text-base font-bold text-[#142D4E] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#2563EB]" />
              <span>Monitored Sources & Institutions in {district.name}</span>
            </h3>
            <span className="text-xs text-[#64748B]">
              {district.keyInstitutions.length} Key Hubs Tracked
            </span>
          </div>

          <p className="text-xs text-[#475569] leading-relaxed">
            HackMitra scans institutional circulars, university boards, and official student portals for the following campuses in {district.name}:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {district.keyInstitutions.map((college, i) => (
              <div
                key={i}
                className="p-2.5 bg-[#F8FAFC] rounded border border-[#E2E8F0] flex items-start gap-2 text-xs"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
                <span className="font-medium text-[#0F172A]">{college}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-[#64748B]">
              Missing an engineering college, polytechnic, or incubator in {district.name}?
            </span>
            <Link
              href="/submit"
              className="font-bold text-[#2563EB] hover:underline flex items-center gap-1"
            >
              <span>Suggest a Campus to Monitor</span>
              <ArrowLeft className="w-3 h-3 rotate-180" />
            </Link>
          </div>
        </div>

        {/* District Notification Alert Section */}
        <div id="notify-section" className="bg-[#142D4E] rounded-lg p-6 sm:p-8 text-white shadow-xs space-y-4">
          <div className="max-w-2xl space-y-1">
            <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#93C5FD]">
              <Bell className="w-3.5 h-3.5" />
              <span>District Alerts</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold">
              Never miss a hackathon in {district.name}
            </h3>
            <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
              Get an instant notification whenever an engineering college or incubator in {district.name} opens registrations.
            </p>
          </div>

          {alertSubmitted ? (
            <div className="p-3.5 bg-[#16805D]/20 border border-[#16805D] rounded-md text-xs font-semibold text-[#6EE7B7] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16805D]" />
              <span>You are subscribed to verified hackathon alerts for {district.name}!</span>
            </div>
          ) : (
            <form onSubmit={handleAlertSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md">
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter your student or personal email..."
                className="px-3.5 py-2 text-xs rounded bg-white text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] flex-1"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors shrink-0"
              >
                Set District Alert
              </button>
            </form>
          )}
        </div>

        {/* Sister Districts in Same Division */}
        {sisterDistricts.length > 0 && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <h3 className="text-sm font-bold text-[#142D4E] flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#2563EB]" />
                <span>Explore Other Districts in {district.division} Division</span>
              </h3>
              <Link href="/districts" className="text-xs font-semibold text-[#2563EB] hover:underline">
                View All 31
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sisterDistricts.map((sister) => (
                <Link
                  key={sister.slug}
                  href={`/districts/${sister.slug}`}
                  className="p-3 rounded border border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#F8FAFC] transition-all flex flex-col justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-[#142D4E]">{sister.name}</h4>
                    <span className="text-[10px] text-[#64748B] block">{sister.kannadaName}</span>
                  </div>
                  <div className="mt-2 text-[10px] font-semibold text-[#2563EB] flex items-center justify-between">
                    <span>{sister.hackathonCount > 0 ? `${sister.hackathonCount} Active` : "Radar Open"}</span>
                    <ArrowLeft className="w-2.5 h-2.5 rotate-180" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
