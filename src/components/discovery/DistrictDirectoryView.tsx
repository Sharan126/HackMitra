"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DistrictSummary } from "@/types/hackathon";
import { StatewideDistrictStats } from "@/lib/services/districts";
import {
  Search,
  MapPin,
  Compass,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Filter,
  ShieldCheck,
  Radio,
  X,
  ExternalLink,
} from "lucide-react";

interface DistrictDirectoryViewProps {
  districts: DistrictSummary[];
  stats: StatewideDistrictStats;
}

export function DistrictDirectoryView({ districts, stats }: DistrictDirectoryViewProps) {
  const router = useRouter();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  // Division filter: 'all' | 'Belagavi' | 'Kalaburagi' | 'Mysuru' | 'Bengaluru'
  const [selectedDivision, setSelectedDivision] = useState<string>("all");
  // Status filter: 'all' | 'verified_active' | 'verified_zero' | 'seeking_leads'
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const divisions = [
    { id: "all", label: "All Karnataka", count: districts.length },
    { id: "Belagavi", label: "Belagavi Division", sub: "Kittur Karnataka", count: 7 },
    { id: "Kalaburagi", label: "Kalaburagi Division", sub: "Kalyana Karnataka", count: 7 },
    { id: "Mysuru", label: "Mysuru Division", sub: "Southern & Coastal", count: 8 },
    { id: "Bengaluru", label: "Bengaluru Division", sub: "Central & Urban", count: 9 },
  ];

  // Quick jump selector handler
  const handleQuickJump = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const slug = e.target.value;
    if (slug) {
      router.push(`/districts/${slug}`);
    }
  };

  // Filtered districts
  const filteredDistricts = useMemo(() => {
    return districts.filter((d) => {
      // 1. Division filter
      if (selectedDivision !== "all" && d.division !== selectedDivision) {
        return false;
      }

      // 2. Status filter
      if (statusFilter !== "all" && d.coverageStatus !== statusFilter) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = d.name.toLowerCase().includes(q);
        const matchesKannada = d.kannadaName.toLowerCase().includes(q);
        const matchesHq = d.headquarters.toLowerCase().includes(q);
        const matchesDivision = d.division.toLowerCase().includes(q);
        const matchesCluster = d.cluster.toLowerCase().includes(q);
        const matchesColleges = d.keyColleges.some((c) => c.toLowerCase().includes(q));

        if (!matchesName && !matchesKannada && !matchesHq && !matchesDivision && !matchesCluster && !matchesColleges) {
          return false;
        }
      }

      return true;
    });
  }, [districts, selectedDivision, statusFilter, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Statewide All-Karnataka Overview Banner */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#F1F5F9]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] text-xs font-bold uppercase tracking-wider mb-2">
              <Compass className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Statewide Innovation Geography</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#142D4E] tracking-tight">
              All 31 Districts of Karnataka
            </h1>
            <p className="text-xs sm:text-sm text-[#475569] mt-1 max-w-2xl leading-relaxed">
              Transparent hackathon discovery across all 4 administrative divisions. We audit VTU campuses, autonomous colleges, and NAIN incubation hubs beyond Bengaluru.
            </p>
          </div>

          {/* Quick Jump Selector */}
          <div className="w-full md:w-72 bg-[#F8FAFC] p-3.5 rounded-md border border-[#CBD5E1]">
            <label htmlFor="quick-district-jump" className="block text-xs font-bold text-[#142D4E] mb-1.5 flex items-center justify-between">
              <span>Quick District Jump</span>
              <span className="text-[10px] text-[#64748B] font-normal">31 Districts</span>
            </label>
            <div className="relative">
              <select
                id="quick-district-jump"
                onChange={handleQuickJump}
                defaultValue=""
                className="w-full pl-3 pr-8 py-2 text-xs font-medium text-[#0F172A] bg-white border border-[#CBD5E1] rounded shadow-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] appearance-none"
              >
                <option value="" disabled>
                  Select a district to jump...
                </option>
                {districts.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.name} ({d.kannadaName}) - {d.division} Div
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#64748B]">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* All-Karnataka Statistics Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          <div className="p-3 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">Districts Tracked</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#142D4E]">{stats.totalDistricts} of 31</span>
              <span className="text-[11px] font-bold text-[#16805D]">100%</span>
            </div>
            <span className="text-[11px] text-[#64748B] mt-0.5 block">Statewide coverage</span>
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">Monitored Colleges</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#142D4E]">{stats.totalMonitoredColleges}+</span>
            </div>
            <span className="text-[11px] text-[#64748B] mt-0.5 block">VTU & autonomous hubs</span>
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">NAIN Incubators</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#142D4E]">{stats.totalNainCenters}</span>
              <span className="text-[11px] font-bold text-[#2563EB]">K-Tech</span>
            </div>
            <span className="text-[11px] text-[#64748B] mt-0.5 block">Tier-2/3 student incubators</span>
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">Data Freshness</span>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#16805D] animate-pulse" />
              <span className="text-xs font-bold text-[#0F172A]">Every 12 Hours</span>
            </div>
            <span className="text-[11px] text-[#64748B] mt-0.5 block">Last audit: {stats.lastAuditedTimestamp}</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 sm:p-5 shadow-xs space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search district by name (e.g., Dharwad, ಬೆಳಗಾವಿ, Mysuru), headquarters, or engineering college..."
            className="w-full pl-10 pr-10 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] p-1"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Division Tabs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#142D4E] uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Administrative Division</span>
            </span>
            <span className="text-xs text-[#64748B]">
              Showing {filteredDistricts.length} of {districts.length} Districts
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {divisions.map((div) => {
              const isActive = selectedDivision === div.id;
              return (
                <button
                  key={div.id}
                  onClick={() => setSelectedDivision(div.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 border ${
                    isActive
                      ? "bg-[#142D4E] text-white border-[#142D4E] shadow-xs"
                      : "bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1] hover:text-[#0F172A]"
                  }`}
                >
                  <span>{div.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-[#E2E8F0] text-[#475569]"
                    }`}
                  >
                    {div.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Coverage Status Filter Pills */}
        <div className="pt-2 border-t border-[#F1F5F9] flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[#64748B] mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#64748B]" />
            <span>Audit Status:</span>
          </span>

          <button
            onClick={() => setStatusFilter("all")}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              statusFilter === "all"
                ? "bg-[#2563EB] text-white font-semibold"
                : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"
            }`}
          >
            All Districts ({districts.length})
          </button>

          <button
            onClick={() => setStatusFilter("verified_active")}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
              statusFilter === "verified_active"
                ? "bg-[#16805D] text-white font-semibold"
                : "bg-[#ECFDF5] text-[#16805D] border border-[#A7F3D0] hover:bg-[#D1FAE5]"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>Active Events ({stats.coverageBreakdown.verifiedActive})</span>
          </button>

          <button
            onClick={() => setStatusFilter("verified_zero")}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
              statusFilter === "verified_zero"
                ? "bg-[#0369A1] text-white font-semibold"
                : "bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] hover:bg-[#BAE6FD]"
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Audited: 0 Active ({stats.coverageBreakdown.verifiedZero})</span>
          </button>

          <button
            onClick={() => setStatusFilter("seeking_leads")}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
              statusFilter === "seeking_leads"
                ? "bg-[#D97706] text-white font-semibold"
                : "bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] hover:bg-[#FDE68A]"
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>Radar: Seeking Leads ({stats.coverageBreakdown.seekingLeads})</span>
          </button>
        </div>
      </div>

      {/* Zero search matches state */}
      {filteredDistricts.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center mx-auto text-[#64748B]">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-[#142D4E]">No matching Karnataka districts found</h3>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto">
            We searched for &quot;{searchQuery}&quot; across district names, headquarters, and college hubs. Try clearing your filters or search terms.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedDivision("all");
              setStatusFilter("all");
            }}
            className="px-4 py-2 text-xs font-semibold bg-[#142D4E] text-white rounded hover:bg-[#2563EB] transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        /* Districts Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredDistricts.map((district) => {
            return (
              <div
                key={district.id}
                className="group bg-white rounded-md border border-[#E2E8F0] p-4 shadow-xs hover:border-[#2563EB] hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  {/* District Title & Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/districts/${district.slug}`}
                          className="font-bold text-base text-[#142D4E] group-hover:text-[#2563EB] transition-colors"
                        >
                          {district.name}
                        </Link>
                      </div>
                      <div className="text-xs text-[#64748B] font-normal flex items-center gap-1.5 mt-0.5">
                        <span className="font-kannada font-medium text-[#475569]">{district.kannadaName}</span>
                        <span>•</span>
                        <span>HQ: {district.headquarters}</span>
                      </div>
                    </div>
                  </div>

                  {/* Division & Cluster Tag */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className="px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#475569] text-[10px] font-semibold border border-[#E2E8F0]">
                      {district.division} Div
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#F8FAFC] text-[#64748B] text-[10px] border border-[#E2E8F0]">
                      {district.cluster}
                    </span>
                  </div>

                  {/* Coverage Status Banner */}
                  <div className="mb-3">
                    {district.coverageStatus === "verified_active" ? (
                      <div className="p-2 rounded bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#16805D] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{district.hackathonCount} Verified Event{district.hackathonCount === 1 ? "" : "s"}</span>
                        </span>
                        {district.openCount > 0 && (
                          <span className="text-[10px] font-semibold text-[#16805D] bg-white px-1.5 py-0.5 rounded">
                            {district.openCount} Open
                          </span>
                        )}
                      </div>
                    ) : district.coverageStatus === "verified_zero" ? (
                      <div className="p-2 rounded bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-[#0369A1] flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Audited: 0 Active</span>
                        </span>
                        <span className="text-[10px] text-[#0369A1] font-medium">Clean Window</span>
                      </div>
                    ) : (
                      <div className="p-2 rounded bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-[#B45309] flex items-center gap-1">
                          <Radio className="w-3.5 h-3.5" />
                          <span>Radar: Seeking Leads</span>
                        </span>
                        <span className="text-[10px] text-[#B45309] font-medium">Be a Scout</span>
                      </div>
                    )}
                  </div>

                  {/* Coverage Source Numbers */}
                  <div className="text-[11px] text-[#64748B] space-y-1 pt-2 border-t border-[#F1F5F9]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Monitored Campuses:</span>
                      <span className="font-semibold text-[#142D4E]">
                        {district.monitoredCollegesCount} Colleges {district.nainCentersCount > 0 ? `• ${district.nainCentersCount} NAIN` : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Last Pipeline Audit:</span>
                      <span className="text-[#475569] font-medium">{district.lastAudited.replace("Today at ", "").replace("Yesterday at ", "Y'day ")}</span>
                    </div>
                  </div>

                  {/* Key Institutions Preview */}
                  <div className="mt-2.5 text-[11px]">
                    <span className="text-[#475569] font-semibold block mb-0.5">Key Institutions:</span>
                    <p className="text-[#64748B] line-clamp-2 leading-relaxed">
                      {district.keyColleges.slice(0, 3).join(", ")}
                    </p>
                  </div>
                </div>

                {/* Footer link */}
                <div className="mt-4 pt-3 border-t border-[#F1F5F9]">
                  <Link
                    href={`/districts/${district.slug}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs font-bold text-[#142D4E] bg-[#F8FAFC] border border-[#CBD5E1] hover:bg-[#142D4E] hover:text-white hover:border-[#142D4E] transition-all"
                  >
                    <span>View District Radar</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
