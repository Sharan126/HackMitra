"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { getAllHackathons, filterHackathons } from "@/lib/services/hackathons";
import { HackathonCard } from "@/components/ui/HackathonCard";
import { SearchAndFilters, FilterState } from "@/components/discovery/SearchAndFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { Layers, ArrowLeft, ShieldCheck } from "lucide-react";

export default function HackathonsDirectoryPage() {
  const allHackathons = useMemo(() => getAllHackathons(), []);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    district: "all",
    cluster: "All Karnataka",
    mode: "all",
    fee: "all",
  });

  const filteredHackathons = useMemo(() => {
    return filterHackathons(allHackathons, {
      search: filters.search,
      districtId: filters.district,
      cluster: filters.cluster,
      format: filters.mode,
      onlyFree: filters.fee === "free",
    });
  }, [allHackathons, filters]);

  const handleReset = () => {
    setFilters({
      search: "",
      district: "all",
      cluster: "All Karnataka",
      mode: "all",
      fee: "all",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2563EB] mb-2">
          <Layers className="w-4 h-4 text-[#2563EB]" />
          <span>Complete Karnataka Directory</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#142D4E] tracking-tight">
          All Verified Hackathons across Karnataka
        </h1>
        <p className="text-xs sm:text-sm text-[#475569] mt-1 max-w-2xl leading-relaxed">
          Filter authentic student hackathons across all 31 districts, KDEM tech clusters, and universities.
        </p>
      </div>

      {/* Filter Component */}
      <SearchAndFilters
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleReset}
        totalResults={filteredHackathons.length}
      />

      {/* Results Grid */}
      {filteredHackathons.length === 0 ? (
        <EmptyState onReset={handleReset} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHackathons.map((hackathon) => (
            <HackathonCard key={hackathon.id} hackathon={hackathon} />
          ))}
        </div>
      )}
    </div>
  );
}
