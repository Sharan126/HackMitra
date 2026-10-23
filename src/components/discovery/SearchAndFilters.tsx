import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  Sparkles,
  Filter,
} from "lucide-react";
import { KARNATAKA_DISTRICTS, REGIONAL_CLUSTERS } from "@/lib/karnataka-data";

export interface FilterState {
  search: string;
  district: string;
  cluster: string;
  mode: string;
  fee: string;
}

interface SearchAndFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
  totalResults?: number;
  className?: string;
}

export function SearchAndFilters({
  filters,
  onFilterChange,
  onReset,
  totalResults,
  className,
}: SearchAndFiltersProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.district !== "all" ||
    filters.cluster !== "All Karnataka" ||
    filters.mode !== "all" ||
    filters.fee !== "all";

  const handleClusterSelect = (clusterName: string) => {
    onFilterChange({
      ...filters,
      cluster: clusterName,
      // If switching cluster, reset specific district if it conflicts
      district: "all",
    });
  };

  return (
    <div
      className={cn(
        "bg-white rounded-md border border-[#E2E8F0] shadow-xs p-4 sm:p-5",
        className
      )}
    >
      {/* Cluster Navigation Chips (Horizontally Scrollable) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 border-b border-[#F1F5F9] no-scrollbar">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] shrink-0 mr-1.5 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Clusters:</span>
        </span>
        {REGIONAL_CLUSTERS.map((cluster) => {
          const isActive = filters.cluster === cluster;
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

      {/* Primary Search Bar & Quick Toggles */}
      <div className="flex flex-col sm:flex-row items-stretch gap-3">
        {/* Search Input */}
        <div className="flex-1">
          <Input
            value={filters.search}
            onChange={(e) =>
              onFilterChange({ ...filters, search: e.target.value })
            }
            placeholder="Search by hackathon title, college (e.g. KLE, BMS, NIE), or tech stack..."
            leftIcon={<Search className="w-4 h-4 text-[#64748B]" />}
            rightIcon={
              filters.search ? (
                <button
                  type="button"
                  onClick={() => onFilterChange({ ...filters, search: "" })}
                  className="hover:text-[#0F172A] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null
            }
          />
        </div>

        {/* Mobile Toggle Button */}
        <div className="sm:hidden flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full justify-between"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            leftIcon={<SlidersHorizontal className="w-4 h-4 text-[#2563EB]" />}
            rightIcon={
              hasActiveFilters ? (
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              ) : undefined
            }
          >
            <span>{showMobileFilters ? "Hide Filters" : "Filter by District & Mode"}</span>
          </Button>
        </div>

        {/* Desktop District Selector */}
        <div className="hidden sm:block w-64">
          <Select
            value={filters.district}
            onChange={(e) =>
              onFilterChange({ ...filters, district: e.target.value })
            }
            leftIcon={<MapPin className="w-4 h-4 text-[#64748B]" />}
          >
            <option value="all">All 31 Districts</option>
            <optgroup label="Bengaluru Division">
              {KARNATAKA_DISTRICTS.filter((d) => d.division === "Bengaluru").map(
                (d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.kannadaName})
                  </option>
                )
              )}
            </optgroup>
            <optgroup label="Mysuru Division">
              {KARNATAKA_DISTRICTS.filter((d) => d.division === "Mysuru").map(
                (d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.kannadaName})
                  </option>
                )
              )}
            </optgroup>
            <optgroup label="Belagavi Division">
              {KARNATAKA_DISTRICTS.filter((d) => d.division === "Belagavi").map(
                (d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.kannadaName})
                  </option>
                )
              )}
            </optgroup>
            <optgroup label="Kalaburagi Division (Kalyana Karnataka)">
              {KARNATAKA_DISTRICTS.filter((d) => d.division === "Kalaburagi").map(
                (d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.kannadaName})
                  </option>
                )
              )}
            </optgroup>
          </Select>
        </div>

        {/* Desktop Mode Filter */}
        <div className="hidden sm:block w-36">
          <Select
            value={filters.mode}
            onChange={(e) =>
              onFilterChange({ ...filters, mode: e.target.value })
            }
          >
            <option value="all">All Modes</option>
            <option value="in_person">In-Person</option>
            <option value="hybrid">Hybrid</option>
            <option value="online">Online</option>
          </Select>
        </div>

        {/* Desktop Fee Filter */}
        <div className="hidden sm:block w-32">
          <Select
            value={filters.fee}
            onChange={(e) =>
              onFilterChange({ ...filters, fee: e.target.value })
            }
          >
            <option value="all">Any Fee</option>
            <option value="free">Free Only</option>
            <option value="paid">Paid</option>
          </Select>
        </div>
      </div>

      {/* Mobile Expandable Filter Sheet */}
      {showMobileFilters && (
        <div className="sm:hidden mt-3 pt-3 border-t border-[#F1F5F9] space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1">
              Select District (All 31 Districts):
            </label>
            <Select
              value={filters.district}
              onChange={(e) =>
                onFilterChange({ ...filters, district: e.target.value })
              }
              leftIcon={<MapPin className="w-4 h-4 text-[#64748B]" />}
            >
              <option value="all">All 31 Districts</option>
              {KARNATAKA_DISTRICTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.kannadaName})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                Event Mode:
              </label>
              <Select
                value={filters.mode}
                onChange={(e) =>
                  onFilterChange({ ...filters, mode: e.target.value })
                }
              >
                <option value="all">All Modes</option>
                <option value="in_person">In-Person</option>
                <option value="hybrid">Hybrid</option>
                <option value="online">Online</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                Registration Fee:
              </label>
              <Select
                value={filters.fee}
                onChange={(e) =>
                  onFilterChange({ ...filters, fee: e.target.value })
                }
              >
                <option value="all">Any Fee</option>
                <option value="free">Free Only</option>
                <option value="paid">Paid</option>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Filter Status Bar */}
      <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between text-xs text-[#64748B] gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#0F172A]">
            {totalResults !== undefined ? `${totalResults} verified hackathons found` : "Karnataka Directory"}
          </span>
          {filters.cluster !== "All Karnataka" && (
            <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] font-medium border border-[#BFDBFE]">
              {filters.cluster}
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium flex items-center gap-1 hover:underline cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
