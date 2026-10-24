"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HackathonCard } from "../../components/ui/HackathonCard";
import { AdvancedSearchAndFilters } from "../../components/discovery/AdvancedSearchAndFilters";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { Button } from "../../components/ui/Button";
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  Hackathon,
  SearchAndFilterParams,
  PaginatedHackathonsResult,
} from "../../types/hackathon";

function HackathonsDirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial filter values from URL search params
  const [params, setParams] = useState<SearchAndFilterParams>(() => ({
    search: searchParams.get("search") || "",
    districtId: searchParams.get("district") || "all",
    city: searchParams.get("city") || "",
    cluster: searchParams.get("cluster") || "All Karnataka",
    registrationStatus: (searchParams.get("status") as any) || "all",
    deadlineRange: (searchParams.get("deadline") as any) || "all",
    eventDateRange: (searchParams.get("eventDate") as any) || "all",
    format: (searchParams.get("mode") as any) || "all",
    feeType: (searchParams.get("fee") as any) || "all",
    eligibility: (searchParams.get("eligibility") as any) || "all",
    participationType: (searchParams.get("participation") as any) || "all",
    teamSize: searchParams.get("teamSize") ? parseInt(searchParams.get("teamSize")!, 10) : undefined,
    technologyDomain: searchParams.get("tech") || "all",
    organizerType: (searchParams.get("organizer") as any) || "all",
    prizePoolVerified: searchParams.get("verifiedPrize") === "true",
    minPrizeInr: searchParams.get("minPrize") ? parseInt(searchParams.get("minPrize")!, 10) : undefined,
    sortBy: (searchParams.get("sort") as any) || "relevance",
    page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
    pageSize: 12,
  }));

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PaginatedHackathonsResult>({
    hackathons: [],
    totalCount: 0,
    page: 1,
    pageSize: 12,
    totalPages: 1,
    hasMore: false,
    appliedFilters: {},
  });

  // Sync params to URL query string
  const updateUrl = useCallback((newParams: SearchAndFilterParams) => {
    const sp = new URLSearchParams();

    if (newParams.search) sp.set("search", newParams.search);
    if (newParams.districtId && newParams.districtId !== "all") sp.set("district", newParams.districtId);
    if (newParams.city) sp.set("city", newParams.city);
    if (newParams.cluster && newParams.cluster !== "All Karnataka") sp.set("cluster", newParams.cluster);
    if (newParams.registrationStatus && newParams.registrationStatus !== "all") sp.set("status", newParams.registrationStatus);
    if (newParams.deadlineRange && newParams.deadlineRange !== "all") sp.set("deadline", newParams.deadlineRange);
    if (newParams.eventDateRange && newParams.eventDateRange !== "all") sp.set("eventDate", newParams.eventDateRange);
    if (newParams.format && newParams.format !== "all") sp.set("mode", newParams.format);
    if (newParams.feeType && newParams.feeType !== "all") sp.set("fee", newParams.feeType);
    if (newParams.eligibility && newParams.eligibility !== "all") sp.set("eligibility", newParams.eligibility);
    if (newParams.participationType && newParams.participationType !== "all") sp.set("participation", newParams.participationType);
    if (newParams.teamSize) sp.set("teamSize", String(newParams.teamSize));
    if (newParams.technologyDomain && newParams.technologyDomain !== "all") sp.set("tech", newParams.technologyDomain);
    if (newParams.organizerType && newParams.organizerType !== "all") sp.set("organizer", newParams.organizerType);
    if (newParams.prizePoolVerified) sp.set("verifiedPrize", "true");
    if (newParams.minPrizeInr) sp.set("minPrize", String(newParams.minPrizeInr));
    if (newParams.sortBy && newParams.sortBy !== "relevance") sp.set("sort", newParams.sortBy);
    if (newParams.page && newParams.page > 1) sp.set("page", String(newParams.page));

    const qs = sp.toString();
    router.replace(`/hackathons${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [router]);

  // Execute database query via API
  const fetchHackathons = useCallback(async (currentParams: SearchAndFilterParams) => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (currentParams.search) sp.set("search", currentParams.search);
      if (currentParams.districtId) sp.set("district", currentParams.districtId);
      if (currentParams.city) sp.set("city", currentParams.city);
      if (currentParams.cluster) sp.set("cluster", currentParams.cluster);
      if (currentParams.registrationStatus) sp.set("status", currentParams.registrationStatus);
      if (currentParams.deadlineRange) sp.set("deadline", currentParams.deadlineRange);
      if (currentParams.eventDateRange) sp.set("eventDate", currentParams.eventDateRange);
      if (currentParams.format) sp.set("mode", currentParams.format);
      if (currentParams.feeType) sp.set("fee", currentParams.feeType);
      if (currentParams.eligibility) sp.set("eligibility", currentParams.eligibility);
      if (currentParams.participationType) sp.set("participation", currentParams.participationType);
      if (currentParams.teamSize) sp.set("teamSize", String(currentParams.teamSize));
      if (currentParams.technologyDomain) sp.set("tech", currentParams.technologyDomain);
      if (currentParams.organizerType) sp.set("organizer", currentParams.organizerType);
      if (currentParams.prizePoolVerified) sp.set("verifiedPrize", "true");
      if (currentParams.minPrizeInr) sp.set("minPrize", String(currentParams.minPrizeInr));
      if (currentParams.sortBy) sp.set("sort", currentParams.sortBy);
      if (currentParams.page) sp.set("page", String(currentParams.page));
      sp.set("pageSize", "12");

      const res = await fetch(`/api/hackathons?${sp.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to query hackathons:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHackathons(params);
    updateUrl(params);
  }, [params, fetchHackathons, updateUrl]);

  const handleFilterChange = (updates: Partial<SearchAndFilterParams>) => {
    setParams((prev: SearchAndFilterParams) => ({
      ...prev,
      ...updates,
    }));
  };

  const handleReset = () => {
    const resetParams: SearchAndFilterParams = {
      search: "",
      districtId: "all",
      city: "",
      cluster: "All Karnataka",
      registrationStatus: "all",
      deadlineRange: "all",
      eventDateRange: "all",
      format: "all",
      feeType: "all",
      eligibility: "all",
      participationType: "all",
      teamSize: undefined,
      technologyDomain: "all",
      organizerType: "all",
      prizePoolVerified: false,
      minPrizeInr: undefined,
      sortBy: "relevance",
      page: 1,
      pageSize: 12,
    };
    setParams(resetParams);
  };

  const handlePageChange = (newPage: number) => {
    setParams((prev: SearchAndFilterParams) => ({
      ...prev,
      page: newPage,
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fromIndex = data.totalCount === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const toIndex = Math.min(data.page * data.pageSize, data.totalCount);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Page Header */}
      <div className="border-b border-[#E2E8F0] pb-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2563EB] mb-2">
          <Layers className="w-4 h-4 text-[#2563EB]" />
          <span>Real Database Query Engine</span>
          <span className="text-[#94A3B8]">•</span>
          <span className="text-[#16805D] flex items-center gap-1 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% Verified Listings
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#142D4E] tracking-tight">
          Karnataka Hackathons Radar
        </h1>
        <p className="text-xs sm:text-sm text-[#475569] mt-1 max-w-3xl leading-relaxed">
          Comprehensive multi-faceted discovery querying authentic hackathons across all 31 Karnataka districts—filtered by district, city, closing deadline, mode, eligibility, team size, technology, and verified prize pool.
        </p>
      </div>

      {/* Advanced Filter Component */}
      <AdvancedSearchAndFilters
        params={params}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        totalResults={data.totalCount}
      />

      {/* Results Header / Pagination Bounds */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#64748B]">
        <span>
          Showing <span className="font-semibold text-[#0F172A]">{fromIndex}-{toIndex}</span> of{" "}
          <span className="font-semibold text-[#0F172A]">{data.totalCount}</span> verified hackathons
        </span>

        {data.totalPages > 1 && (
          <span className="text-xs text-[#64748B]">
            Page <span className="font-semibold text-[#0F172A]">{data.page}</span> of{" "}
            <span className="font-semibold text-[#0F172A]">{data.totalPages}</span>
          </span>
        )}
      </div>

      {/* Results Grid / Loading / Empty State */}
      {loading ? (
        <div className="py-6">
          <LoadingState count={6} />
        </div>
      ) : data.hackathons.length === 0 ? (
        <EmptyState onReset={handleReset} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.hackathons.map((hackathon: Hackathon) => (
            <HackathonCard key={hackathon.id} hackathon={hackathon} />
          ))}
        </div>
      )}

      {/* Bottom Pagination Controls */}
      {!loading && data.totalPages > 1 && (
        <div className="pt-6 border-t border-[#E2E8F0] flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handlePageChange(data.page - 1)}
            disabled={data.page <= 1}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Previous Page
          </Button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: data.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === data.totalPages || Math.abs(p - data.page) <= 1)
              .map((p, idx, arr) => {
                const isCurrent = p === data.page;
                const prevPage = arr[idx - 1];
                const showEllipsis = prevPage && p - prevPage > 1;

                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="px-1 text-xs text-[#94A3B8]">...</span>}
                    <button
                      type="button"
                      onClick={() => handlePageChange(p)}
                      className={`w-8 h-8 rounded text-xs font-semibold select-none transition-colors border ${
                        isCurrent
                          ? "bg-[#142D4E] text-white border-[#142D4E]"
                          : "bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]"
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handlePageChange(data.page + 1)}
            disabled={!data.hasMore}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Next Page
          </Button>
        </div>
      )}
    </div>
  );
}

export default function HackathonsDirectoryPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-12"><LoadingState count={6} /></div>}>
      <HackathonsDirectoryContent />
    </Suspense>
  );
}
