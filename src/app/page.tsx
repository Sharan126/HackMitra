"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  getAllHackathons,
  getHomepageStats,
  getDistrictSummaries,
  getRegistrationOpenHackathons,
  getRecentlyDiscoveredHackathons,
  filterHackathons,
} from "../lib/services/hackathons";
import { KARNATAKA_DISTRICTS, District } from "../lib/karnataka-data";
import { HackathonCard } from "../components/ui/HackathonCard";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { StatusLabel } from "../components/ui/StatusLabel";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingState } from "../components/ui/LoadingState";
import { ErrorState } from "../components/ui/ErrorState";
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  X,
  ArrowRight,
  PlusCircle,
  Radio,
  SlidersHorizontal,
  Layers,
  ChevronRight,
  Building,
  RotateCcw,
} from "lucide-react";

export default function HomePage() {
  const allHackathons = useMemo(() => getAllHackathons(), []);
  const stats = useMemo(() => getHomepageStats(), []);
  const districtSummaries = useMemo(() => getDistrictSummaries(), []);
  const registrationOpenList = useMemo(() => getRegistrationOpenHackathons(3), []);
  const recentlyDiscoveredList = useMemo(() => getRecentlyDiscoveredHackathons(3), []);

  // Filter State
  const [search, setSearch] = useState("");
  const [districtId, setDistrictId] = useState("all");
  const [cluster, setCluster] = useState("All Karnataka");
  const [registrationStatus, setRegistrationStatus] = useState("all");
  const [deadlineRange, setDeadlineRange] = useState("all");
  const [format, setFormat] = useState("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Check if any search or filter is active
  const isFiltering =
    search.trim() !== "" ||
    districtId !== "all" ||
    cluster !== "All Karnataka" ||
    registrationStatus !== "all" ||
    deadlineRange !== "all" ||
    format !== "all";

  // Filtered Hackathons
  const filteredHackathons = useMemo(() => {
    return filterHackathons(allHackathons, {
      search,
      districtId,
      cluster,
      registrationStatus,
      deadlineRange,
      format,
    });
  }, [allHackathons, search, districtId, cluster, registrationStatus, deadlineRange, format]);

  const handleResetFilters = () => {
    setSearch("");
    setDistrictId("all");
    setCluster("All Karnataka");
    setRegistrationStatus("all");
    setDeadlineRange("all");
    setFormat("all");
  };

  const selectCluster = (clusterName: string) => {
    setCluster(clusterName);
    setDistrictId("all");
  };

  const selectDistrictFromHub = (selectedId: string) => {
    setDistrictId(selectedId);
    setCluster("All Karnataka");
    // Scroll smoothly to the results area
    const el = document.getElementById("search-results-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* SECTION 2 & 3: Concise Headline, Introduction & Last Updated Indicator */}
      <section className="bg-white border-b border-[#E2E8F0] pt-8 pb-9 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            {/* System Status & Last Updated Indicator (SECTION 10) */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#F1F5F9] border border-[#CBD5E1] text-[11px] font-medium text-[#142D4E]">
              <span className="w-2 h-2 rounded-full bg-[#16805D] animate-pulse shrink-0" />
              <span>Statewide Directory</span>
              <span className="text-[#94A3B8]">•</span>
              <span className="text-[#64748B]">Last updated: {stats.lastUpdatedTimestamp}</span>
              <span className="text-[#94A3B8]">•</span>
              <span className="text-[#16805D] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> 100% Verified
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <Link
                href="/sources"
                className="text-[#64748B] hover:text-[#2563EB] flex items-center gap-1 transition-colors font-medium"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#16805D]" />
                <span>Verification Rubric</span>
              </Link>
              <span className="text-[#CBD5E1]">•</span>
              <Link
                href="/submit"
                className="text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 transition-colors font-semibold"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Submit Event</span>
              </Link>
            </div>
          </div>

          <div className="max-w-3xl">
            {/* Concise Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#142D4E] leading-tight">
              Find your next hackathon.
            </h1>

            {/* Short Introduction */}
            <p className="mt-3 text-sm sm:text-base text-[#475569] leading-relaxed">
              Karnataka-wide hackathon discovery covering all 31 districts—from Hubballi-Dharwad, Mangaluru, and Mysuru to Belagavi, Kalaburagi, and Bengaluru. Moderator-verified college fests, university makeathons, and startup challenges.
            </p>
          </div>

          {/* Quick Cluster Selector Pills */}
          <div className="mt-5 pt-4 border-t border-[#F1F5F9] flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] shrink-0 mr-1">
              Quick Filter:
            </span>
            <button
              type="button"
              onClick={() => selectCluster("Beyond Bengaluru")}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors border select-none cursor-pointer shrink-0 flex items-center gap-1 ${
                cluster === "Beyond Bengaluru"
                  ? "bg-[#142D4E] text-white border-[#142D4E]"
                  : "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE] hover:bg-[#DBEAFE]"
              }`}
            >
              <Sparkles className="w-3 h-3 text-[#2563EB]" />
              <span>Beyond Bengaluru (Tier 2/3)</span>
            </button>
            <button
              type="button"
              onClick={() => selectCluster("Hubballi-Dharwad-Belagavi")}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors border select-none cursor-pointer shrink-0 ${
                cluster === "Hubballi-Dharwad-Belagavi"
                  ? "bg-[#142D4E] text-white border-[#142D4E]"
                  : "bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-[#F1F5F9]"
              }`}
            >
              Hubballi-Dharwad & Belagavi
            </button>
            <button
              type="button"
              onClick={() => selectCluster("Mangaluru Coastal")}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors border select-none cursor-pointer shrink-0 ${
                cluster === "Mangaluru Coastal"
                  ? "bg-[#142D4E] text-white border-[#142D4E]"
                  : "bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-[#F1F5F9]"
              }`}
            >
              Coastal Hub (Mangaluru/Udupi)
            </button>
            <button
              type="button"
              onClick={() => selectCluster("Mysuru Cluster")}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors border select-none cursor-pointer shrink-0 ${
                cluster === "Mysuru Cluster"
                  ? "bg-[#142D4E] text-white border-[#142D4E]"
                  : "bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-[#F1F5F9]"
              }`}
            >
              Mysuru Cluster
            </button>
            <button
              type="button"
              onClick={() => selectCluster("Kalyana Karnataka")}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors border select-none cursor-pointer shrink-0 ${
                cluster === "Kalyana Karnataka"
                  ? "bg-[#142D4E] text-white border-[#142D4E]"
                  : "bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-[#F1F5F9]"
              }`}
            >
              Kalyana Karnataka
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 6: Compact Statistics (Database-Driven Model) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-md border border-[#E2E8F0] shadow-xs p-3 sm:p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[#F1F5F9]">
            {/* Stat 1: Open Registrations */}
            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#16805D]" />
                <span>Open Registrations</span>
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-[#0F172A]">
                  {stats.openRegistrations}
                </span>
                <span className="text-xs text-[#16805D] font-medium">Accepting Teams</span>
              </div>
            </div>

            {/* Stat 2: Upcoming Events */}
            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5 mb-1">
                <Calendar className="w-3 h-3 text-[#2563EB]" />
                <span>Upcoming Events</span>
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-[#0F172A]">
                  {stats.upcomingEvents}
                </span>
                <span className="text-xs text-[#475569] font-medium">Scheduled</span>
              </div>
            </div>

            {/* Stat 3: Ongoing / This Month */}
            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5 mb-1">
                <Radio className="w-3 h-3 text-[#D97706]" />
                <span>Active This Month</span>
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-[#0F172A]">
                  {stats.ongoingOrThisMonth}
                </span>
                <span className="text-xs text-[#475569] font-medium">Sprint Windows</span>
              </div>
            </div>

            {/* Stat 4: Districts Represented */}
            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5 mb-1">
                <MapPin className="w-3 h-3 text-[#142D4E]" />
                <span>Districts Represented</span>
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-[#0F172A]">
                  {stats.districtsRepresented}
                </span>
                <span className="text-xs text-[#64748B] font-medium">
                  of 31 Districts Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 & 5: Fast Scanner Search Input & Multi-Dimension Filters */}
      <section id="search-section" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-md border border-[#E2E8F0] shadow-xs p-4 sm:p-5 space-y-3">
          {/* Main Search Input */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="flex-1">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search event name, tech stack (AI, IoT), college (KLE, NITK, NIE), city (Hubballi), or district..."
                leftIcon={<Search className="w-4 h-4 text-[#64748B]" />}
                rightIcon={
                  search ? (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : null
                }
              />
            </div>

            {/* Mobile Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="sm:hidden flex items-center justify-between px-3 py-2 border border-[#CBD5E1] rounded-md text-xs font-semibold text-[#142D4E] bg-[#F8FAFC]"
            >
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Filter by District, Status & Format</span>
              </span>
              {isFiltering && (
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              )}
            </button>

            {/* Desktop Filters Row */}
            <div className="hidden sm:flex items-center gap-2.5">
              {/* District Filter (SECTION 5) */}
              <div className="w-56">
                <Select
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value)}
                  leftIcon={<MapPin className="w-3.5 h-3.5 text-[#64748B]" />}
                >
                  <option value="all">All 31 Districts</option>
                  <optgroup label="Belagavi Division">
                    {KARNATAKA_DISTRICTS.filter((d) => d.division === "Belagavi").map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.kannadaName})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Mysuru Division">
                    {KARNATAKA_DISTRICTS.filter((d) => d.division === "Mysuru").map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.kannadaName})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Kalaburagi Division (Kalyana KA)">
                    {KARNATAKA_DISTRICTS.filter((d) => d.division === "Kalaburagi").map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.kannadaName})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Bengaluru Division">
                    {KARNATAKA_DISTRICTS.filter((d) => d.division === "Bengaluru").map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.kannadaName})
                      </option>
                    ))}
                  </optgroup>
                </Select>
              </div>

              {/* Registration Status Filter */}
              <div className="w-44">
                <Select
                  value={registrationStatus}
                  onChange={(e) => setRegistrationStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Registration Open</option>
                  <option value="deadline_today">Deadline Today</option>
                  <option value="closing_soon">Closing Soon</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing Event</option>
                  <option value="closed">Registration Closed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="unverified">Unverified Source</option>
                  <option value="stale">Needs Reverification</option>
                </Select>
              </div>

              {/* Deadline Filter */}
              <div className="w-36">
                <Select
                  value={deadlineRange}
                  onChange={(e) => setDeadlineRange(e.target.value)}
                >
                  <option value="all">Any Deadline</option>
                  <option value="7_days">&lt; 7 Days</option>
                  <option value="14_days">&lt; 14 Days</option>
                  <option value="30_days">This Month</option>
                </Select>
              </div>

              {/* Event Format Filter */}
              <div className="w-36">
                <Select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                >
                  <option value="all">All Formats</option>
                  <option value="in_person">In-Person</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="online">Online</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Mobile Collapsible Filters */}
          {showMobileFilters && (
            <div className="sm:hidden pt-3 border-t border-[#F1F5F9] space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                  Karnataka District:
                </label>
                <Select
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value)}
                  leftIcon={<MapPin className="w-3.5 h-3.5 text-[#64748B]" />}
                >
                  <option value="all">All 31 Districts</option>
                  {KARNATAKA_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.kannadaName})
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                    Status:
                  </label>
                  <Select
                    value={registrationStatus}
                    onChange={(e) => setRegistrationStatus(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="open">Open</option>
                    <option value="deadline_today">Deadline Today</option>
                    <option value="closing_soon">Closing Soon</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="closed">Closed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="unverified">Unverified</option>
                    <option value="stale">Stale</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                    Deadline:
                  </label>
                  <Select
                    value={deadlineRange}
                    onChange={(e) => setDeadlineRange(e.target.value)}
                  >
                    <option value="all">Any</option>
                    <option value="7_days">&lt; 7 Days</option>
                    <option value="14_days">&lt; 14 Days</option>
                    <option value="30_days">30 Days</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                    Format:
                  </label>
                  <Select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="in_person">In-Person</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="online">Online</option>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Filter Status & Active Reset Bar */}
          <div className="pt-2 border-t border-[#F8FAFC] flex flex-wrap items-center justify-between text-xs text-[#64748B] gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#0F172A]">
                {filteredHackathons.length} verified hackathon{filteredHackathons.length === 1 ? "" : "s"} found
              </span>
              {cluster !== "All Karnataka" && (
                <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] font-medium border border-[#BFDBFE] text-[11px]">
                  {cluster}
                </span>
              )}
              {districtId !== "all" && (
                <span className="px-2 py-0.5 rounded bg-[#F1F5F9] text-[#142D4E] font-medium border border-[#CBD5E1] text-[11px]">
                  District: {districtId}
                </span>
              )}
            </div>

            {isFiltering && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset all filters</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* FILTER RESULTS SECTION (Appears immediately when user searches or filters) */}
      {isFiltering ? (
        <section id="search-results-section" className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <h2 className="text-lg font-bold text-[#142D4E] tracking-tight">
              Filtered Search Results ({filteredHackathons.length})
            </h2>
            <Link
              href="/hackathons"
              className="text-xs font-semibold text-[#2563EB] hover:underline"
            >
              Open Full Directory →
            </Link>
          </div>

          {filteredHackathons.length === 0 ? (
            <EmptyState
              title="No hackathons match your exact filter combination"
              description="Try selecting a different district, removing the deadline limit, or broadening your search terms."
              onReset={handleResetFilters}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredHackathons.map((h) => (
                <HackathonCard key={h.id} hackathon={h} />
              ))}
            </div>
          )}
        </section>
      ) : (
        /* DEFAULT HOMEPAGE SECTIONS (When no filter is active) */
        <div className="space-y-12">
          {/* SECTION 9: Registration-Open Opportunities */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#16805D]" />
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#142D4E]">
                    Registration-Open Opportunities
                  </h2>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Verified hackathons currently accepting student and developer applications.
                </p>
              </div>

              <Link
                href="/hackathons"
                className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 self-start sm:self-auto"
              >
                <span>View all active events ({stats.openRegistrations})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {registrationOpenList.map((h) => (
                <HackathonCard key={h.id} hackathon={h} />
              ))}
            </div>
          </section>

          {/* SECTION 8: Recently Discovered Hackathons */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#2563EB]" />
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#142D4E]">
                    Recently Discovered & Verified
                  </h2>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Freshly indexed circulars and announcements from Karnataka college campuses.
                </p>
              </div>

              <Link
                href="/sources"
                className="text-xs font-medium text-[#64748B] hover:text-[#2563EB] flex items-center gap-1 self-start sm:self-auto"
              >
                <span>How we verify listings</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recentlyDiscoveredList.map((h) => (
                <HackathonCard key={h.id} hackathon={h} compact={true} />
              ))}
            </div>
          </section>

          {/* SECTION 7: District Discovery Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#2563EB]" />
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#142D4E]">
                    District Discovery Hub
                  </h2>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Jump directly to local engineering fests across Karnataka&apos;s 4 administrative divisions.
                </p>
              </div>

              <Link
                href="/districts"
                className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Explore all 31 districts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* Highlight prominent districts */}
              {[
                { id: "dharwad", name: "Hubballi-Dharwad", kannada: "ಧಾರವಾಡ", count: 1, region: "Kittur KA" },
                { id: "dakshina-kannada", name: "Mangaluru", kannada: "ದಕ್ಷಿಣ ಕನ್ನಡ", count: 1, region: "Coastal" },
                { id: "mysuru", name: "Mysuru", kannada: "ಮೈಸೂರು", count: 1, region: "Mysuru" },
                { id: "belagavi", name: "Belagavi", kannada: "ಬೆಳಗಾವಿ", count: 1, region: "Kittur KA" },
                { id: "kalaburagi", name: "Kalaburagi", kannada: "ಕಲಬುರಗಿ", count: 1, region: "Kalyana KA" },
                { id: "bengaluru-urban", name: "Bengaluru Urban", kannada: "ಬೆಂಗಳೂರು", count: 1, region: "Bengaluru" },
                { id: "shivamogga", name: "Shivamogga", kannada: "ಶಿವಮೊಗ್ಗ", count: 1, region: "Central KA" },
                { id: "udupi", name: "Udupi", kannada: "ಉಡುಪಿ", count: 1, region: "Coastal" },
                { id: "davanagere", name: "Davanagere", kannada: "ದಾವಣಗೆರೆ", count: 0, region: "Central KA" },
                { id: "ballari", name: "Ballari", kannada: "ಬಳ್ಳಾರಿ", count: 0, region: "Kalyana KA" },
                { id: "tumakuru", name: "Tumakuru", kannada: "ತುಮಕೂರು", count: 0, region: "Central KA" },
                { id: "hassan", name: "Hassan", kannada: "ಹಾಸನ", count: 0, region: "Mysuru" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectDistrictFromHub(item.id)}
                  className="p-3 rounded-md bg-white border border-[#E2E8F0] shadow-xs hover:border-[#2563EB] hover:bg-[#F8FAFC] transition-colors text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-[#64748B] mb-1">
                      <span>{item.region}</span>
                      {item.count > 0 ? (
                        <span className="text-[#16805D] font-bold">
                          {item.count} Open
                        </span>
                      ) : (
                        <span className="text-[#94A3B8]">Radar On</span>
                      )}
                    </div>
                    <span className="font-bold text-xs text-[#0F172A] block group-hover:text-[#2563EB] transition-colors truncate">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-[#64748B] block">
                      {item.kannada}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Institutional Submission CTA Banner */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="bg-[#142D4E] text-white rounded-md p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/10 text-emerald-300 text-[11px] font-semibold mb-2">
                  <Building className="w-3 h-3" />
                  <span>College & Club Coordinators</span>
                </span>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  Hosting an engineering fest in your district?
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Submit your institutional circular or portal link. We verify organizers within 12 hours and feature your event across all 31 districts with zero listing fee.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <Link href="/submit">
                  <Button variant="accent" size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
                    Submit College Circular
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
