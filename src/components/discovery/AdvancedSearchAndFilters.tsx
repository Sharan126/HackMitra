"use client";

import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  Sparkles,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Filter,
  Trophy,
  Users,
  GraduationCap,
  Calendar,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { KARNATAKA_DISTRICTS, REGIONAL_CLUSTERS, District } from "../../lib/karnataka-data";
import { SearchAndFilterParams, SortOption } from "../../types/hackathon";

interface AdvancedSearchAndFiltersProps {
  params: SearchAndFilterParams;
  onFilterChange: (newParams: Partial<SearchAndFilterParams>) => void;
  onReset: () => void;
  totalResults: number;
  className?: string;
}

export function AdvancedSearchAndFilters({
  params,
  onFilterChange,
  onReset,
  totalResults,
  className,
}: AdvancedSearchAndFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Check active filters count
  const activeFiltersCount = [
    Boolean(params.search),
    params.districtId && params.districtId !== "all",
    Boolean(params.city),
    params.cluster && params.cluster !== "All Karnataka",
    params.registrationStatus && params.registrationStatus !== "all",
    params.deadlineRange && params.deadlineRange !== "all",
    params.eventDateRange && params.eventDateRange !== "all",
    params.format && params.format !== "all",
    params.feeType && params.feeType !== "all",
    params.eligibility && params.eligibility !== "all",
    params.participationType && params.participationType !== "all",
    Boolean(params.teamSize),
    params.technologyDomain && params.technologyDomain !== "all",
    params.organizerType && params.organizerType !== "all",
    params.prizePoolVerified,
    Boolean(params.minPrizeInr),
  ].filter(Boolean).length;

  const handleClusterSelect = (clusterName: string) => {
    onFilterChange({
      cluster: clusterName,
      districtId: "all",
      page: 1,
    });
  };

  return (
    <div
      className={cn(
        "bg-white rounded-md border border-[#E2E8F0] shadow-xs p-4 sm:p-5 space-y-4",
        className
      )}
    >
      {/* Cluster Navigation Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#F1F5F9] no-scrollbar">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] shrink-0 mr-1.5 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Clusters:</span>
        </span>
        {REGIONAL_CLUSTERS.map((cluster: string) => {
          const isActive = (params.cluster || "All Karnataka") === cluster;
          return (
            <button
              key={cluster}
              type="button"
              onClick={() => handleClusterSelect(cluster)}
              className={cn(
                "shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors border select-none cursor-pointer",
                isActive
                  ? "bg-[#142D4E] text-white border-[#142D4E]"
                  : "bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
              )}
            >
              {cluster}
            </button>
          );
        })}
      </div>

      {/* Primary Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
        <div className="flex-1">
          <Input
            value={params.search || ""}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            placeholder="Search event titles, organizers, colleges, technologies (AI, IoT, Web3), or descriptions..."
            leftIcon={<Search className="w-4 h-4 text-[#64748B]" />}
            rightIcon={
              params.search ? (
                <button
                  type="button"
                  onClick={() => onFilterChange({ search: "", page: 1 })}
                  className="hover:text-[#0F172A] cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null
            }
          />
        </div>

        {/* Sort Selector */}
        <div className="w-full sm:w-52">
          <Select
            value={params.sortBy || "relevance"}
            onChange={(e) =>
              onFilterChange({ sortBy: e.target.value as SortOption, page: 1 })
            }
          >
            <option value="relevance">Sort: Most Relevant</option>
            <option value="deadline_asc">Deadline: Soonest First</option>
            <option value="deadline_desc">Deadline: Furthest First</option>
            <option value="date_asc">Event Date: Earliest First</option>
            <option value="date_desc">Event Date: Latest First</option>
            <option value="recent_discovery">Recently Discovered</option>
            <option value="prize_desc">Highest Prize Pool</option>
          </Select>
        </div>
      </div>

      {/* Primary Quick Filters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 text-xs">
        {/* District Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
            District:
          </label>
          <Select
            value={params.districtId || "all"}
            onChange={(e) => onFilterChange({ districtId: e.target.value, page: 1 })}
            leftIcon={<MapPin className="w-3.5 h-3.5 text-[#64748B]" />}
          >
            <option value="all">All 31 Districts</option>
            <optgroup label="Belagavi Division">
              {KARNATAKA_DISTRICTS.filter((d: District) => d.division === "Belagavi").map((d: District) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.kannadaName})
                </option>
              ))}
            </optgroup>
            <optgroup label="Mysuru Division">
              {KARNATAKA_DISTRICTS.filter((d: District) => d.division === "Mysuru").map((d: District) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.kannadaName})
                </option>
              ))}
            </optgroup>
            <optgroup label="Kalaburagi Division (Kalyana KA)">
              {KARNATAKA_DISTRICTS.filter((d: District) => d.division === "Kalaburagi").map((d: District) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.kannadaName})
                </option>
              ))}
            </optgroup>
            <optgroup label="Bengaluru Division">
              {KARNATAKA_DISTRICTS.filter((d: District) => d.division === "Bengaluru").map((d: District) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.kannadaName})
                </option>
              ))}
            </optgroup>
          </Select>
        </div>

        {/* Registration Status Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
            Registration Status:
          </label>
          <Select
            value={params.registrationStatus || "all"}
            onChange={(e) => onFilterChange({ registrationStatus: e.target.value as any, page: 1 })}
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

        {/* Participation Format */}
        <div>
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
            Format:
          </label>
          <Select
            value={params.format || "all"}
            onChange={(e) => onFilterChange({ format: e.target.value as any, page: 1 })}
          >
            <option value="all">All Formats</option>
            <option value="in_person">In-Person</option>
            <option value="hybrid">Hybrid</option>
            <option value="online">Online</option>
          </Select>
        </div>

        {/* Free or Paid */}
        <div>
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
            Fee:
          </label>
          <Select
            value={params.feeType || "all"}
            onChange={(e) => onFilterChange({ feeType: e.target.value as any, page: 1 })}
          >
            <option value="all">Any Fee</option>
            <option value="free">Free Only</option>
            <option value="paid">Paid Entry</option>
          </Select>
        </div>

        {/* Toggle Advanced Filters Button */}
        <div className="col-span-2 sm:col-span-4 lg:col-span-1 flex items-end">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full justify-between"
            onClick={() => setShowAdvanced(!showAdvanced)}
            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-[#2563EB]" />}
            rightIcon={
              showAdvanced ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )
            }
          >
            <span>{showAdvanced ? "Fewer Filters" : "More Filters"}</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white text-[10px] flex items-center justify-center font-bold ml-1">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Advanced Filters Expandable Drawer */}
      {showAdvanced && (
        <div className="pt-3 border-t border-[#F1F5F9] space-y-3 bg-[#F8FAFC] p-3.5 rounded-md border border-[#E2E8F0]">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
            {/* City */}
            <div>
              <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                City / Town:
              </label>
              <Input
                value={params.city || ""}
                onChange={(e) => onFilterChange({ city: e.target.value, page: 1 })}
                placeholder="e.g. Hubballi, Nitte, Surathkal"
              />
            </div>

            {/* Student-Only or Open Eligibility */}
            <div>
              <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                Eligibility:
              </label>
              <Select
                value={params.eligibility || "all"}
                onChange={(e) => onFilterChange({ eligibility: e.target.value as any, page: 1 })}
              >
                <option value="all">All Eligibility</option>
                <option value="students_only">Student-Only (College / VTU)</option>
                <option value="open_to_all">Open to All Developers</option>
              </Select>
            </div>

            {/* Individual vs Team */}
            <div>
              <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                Participation Type:
              </label>
              <Select
                value={params.participationType || "all"}
                onChange={(e) => onFilterChange({ participationType: e.target.value as any, page: 1 })}
              >
                <option value="all">Individual or Team</option>
                <option value="individual">Solo / Individual Permitted</option>
                <option value="team_only">Team Only (2+ Members)</option>
              </Select>
            </div>

            {/* Exact Team Size */}
            <div>
              <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                Team Size:
              </label>
              <Select
                value={params.teamSize ? String(params.teamSize) : "all"}
                onChange={(e) =>
                  onFilterChange({
                    teamSize: e.target.value === "all" ? undefined : parseInt(e.target.value, 10),
                    page: 1,
                  })
                }
              >
                <option value="all">Any Team Size</option>
                <option value="1">Solo (1 Member)</option>
                <option value="2">2 Members</option>
                <option value="3">3 Members</option>
                <option value="4">4 Members</option>
                <option value="5">5+ Members</option>
              </Select>
            </div>

            {/* Technology Domain */}
            <div>
              <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                Technology Domain:
              </label>
              <Select
                value={params.technologyDomain || "all"}
                onChange={(e) => onFilterChange({ technologyDomain: e.target.value, page: 1 })}
              >
                <option value="all">All Domains</option>
                <option value="AI">Artificial Intelligence / ML</option>
                <option value="Blockchain">Blockchain & Web3</option>
                <option value="IoT">IoT & Embedded Hardware</option>
                <option value="Agritech">AgriTech & Rural Solutions</option>
                <option value="FinTech">FinTech</option>
                <option value="HealthTech">HealthTech & BioSensors</option>
                <option value="Clean Energy">CleanTech & Renewables</option>
                <option value="Future Mobility">Future Mobility</option>
              </Select>
            </div>

            {/* Organizer Category */}
            <div>
              <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                Organizer Category:
              </label>
              <Select
                value={params.organizerType || "all"}
                onChange={(e) => onFilterChange({ organizerType: e.target.value as any, page: 1 })}
              >
                <option value="all">All Organizers</option>
                <option value="College">Engineering College</option>
                <option value="University">University</option>
                <option value="KDEM / K-Tech">KDEM / K-Tech / Govt</option>
                <option value="Incubator">Startup Incubator</option>
                <option value="Student Club">Student Club</option>
                <option value="Corporate">Corporate</option>
              </Select>
            </div>

            {/* Prize Pool */}
            <div>
              <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                Prize Pool:
              </label>
              <Select
                value={params.minPrizeInr ? String(params.minPrizeInr) : params.prizePoolVerified ? "verified" : "all"}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "all") {
                    onFilterChange({ prizePoolVerified: false, minPrizeInr: undefined, page: 1 });
                  } else if (val === "verified") {
                    onFilterChange({ prizePoolVerified: true, minPrizeInr: undefined, page: 1 });
                  } else {
                    onFilterChange({ prizePoolVerified: true, minPrizeInr: parseInt(val, 10), page: 1 });
                  }
                }}
              >
                <option value="all">Any Prize</option>
                <option value="verified">Verified Prizes Only</option>
                <option value="50000">₹50,000+ Prize Pool</option>
                <option value="100000">₹1,00,000+ Prize Pool</option>
                <option value="250000">₹2,50,000+ Prize Pool</option>
              </Select>
            </div>

            {/* Event Timing */}
            <div>
              <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                Event Timing:
              </label>
              <Select
                value={params.eventDateRange || "all"}
                onChange={(e) => onFilterChange({ eventDateRange: e.target.value as any, page: 1 })}
              >
                <option value="all">Any Event Date</option>
                <option value="upcoming">Upcoming Events</option>
                <option value="this_month">Happening This Month</option>
                <option value="next_month">Happening Next Month</option>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips & Status Bar */}
      <div className="pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between text-xs text-[#64748B] gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-[#0F172A]">
            {totalResults} verified hackathon{totalResults === 1 ? "" : "s"} found
          </span>

          {/* Active Chips */}
          {params.cluster && params.cluster !== "All Karnataka" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] font-medium border border-[#BFDBFE]">
              <span>Cluster: {params.cluster}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ cluster: "All Karnataka", page: 1 })}
                className="hover:text-[#1E40AF]"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {params.districtId && params.districtId !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F1F5F9] text-[#142D4E] font-medium border border-[#CBD5E1]">
              <span>District: {params.districtId}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ districtId: "all", page: 1 })}
                className="hover:text-[#0F172A]"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {params.registrationStatus && params.registrationStatus !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F1F5F9] text-[#142D4E] font-medium border border-[#CBD5E1]">
              <span>Status: {params.registrationStatus}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ registrationStatus: "all", page: 1 })}
                className="hover:text-[#0F172A]"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {params.format && params.format !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F1F5F9] text-[#142D4E] font-medium border border-[#CBD5E1]">
              <span>Format: {params.format}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ format: "all", page: 1 })}
                className="hover:text-[#0F172A]"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {params.feeType && params.feeType !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F1F5F9] text-[#142D4E] font-medium border border-[#CBD5E1]">
              <span>Fee: {params.feeType}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ feeType: "all", page: 1 })}
                className="hover:text-[#0F172A]"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold flex items-center gap-1 hover:underline cursor-pointer select-none"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All Filters ({activeFiltersCount})</span>
          </button>
        )}
      </div>
    </div>
  );
}
