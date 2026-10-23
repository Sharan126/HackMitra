import React from "react";
import Link from "next/link";
import { ShieldCheck, FileCheck2, ExternalLink, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function SourcesPage() {
  const sources = [
    {
      name: "Institutional College Circulars & Portals",
      coverage: "VTU affiliated & autonomous engineering colleges across 31 districts",
      verification: "Human moderator verifies faculty coordinator, official college seal/circular PDF, and campus venue.",
      type: "Primary Campus Source",
    },
    {
      name: "Devfolio Karnataka Feed",
      coverage: "Bengaluru, Hubballi-Dharwad, Mangaluru, Belagavi tech fests",
      verification: "Direct platform API & application form link validation.",
      type: "National Platform",
    },
    {
      name: "Unstop Karnataka Fests",
      coverage: "University & student club technical competitions",
      verification: "Link healthcheck engine verifies active registration status & rules.",
      type: "National Platform",
    },
    {
      name: "K-Tech & NAIN (New Age Innovation Network)",
      coverage: "Incubation centers located in 40+ Tier 2/3 engineering colleges",
      verification: "Cross-checked with Karnataka Department of Electronics, IT & Bt announcements.",
      type: "State Innovation Network",
    },
    {
      name: "Student Club & Campus Ambassador Submissions",
      coverage: "IEEE student branches, ACM chapters, and Google Developer Groups",
      verification: "Submitted via HackMitra portal; authenticated before public indexing.",
      type: "Community Network",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#142D4E] hover:text-[#2563EB] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Homepage</span>
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-md border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#16805D] mb-2">
          <ShieldCheck className="w-4 h-4 text-[#16805D]" />
          <span>Verification & Data Integrity Charter</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#142D4E] tracking-tight">
          How HackMitra Verifies Karnataka Hackathons
        </h1>
        <p className="text-xs sm:text-sm text-[#475569] mt-2 leading-relaxed max-w-3xl">
          Students frequently miss genuine hackathons due to dead links, unverified posters, or predatory entry fees. HackMitra operates with a strict verification rubric: zero phantom prizes, zero dead links, and 100% verified source citations.
        </p>
      </div>

      {/* Source Platforms Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#142D4E] tracking-tight">
          Indexed Data Sources & Verification Rubric
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sources.map((source) => (
            <div
              key={source.name}
              className="bg-white rounded-md border border-[#E2E8F0] p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                    {source.type}
                  </span>
                  <span className="text-xs font-medium text-[#16805D] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
                <h3 className="font-bold text-sm text-[#0F172A] mb-1">
                  {source.name}
                </h3>
                <p className="text-xs text-[#64748B] mb-3">
                  <span className="font-semibold text-[#475569]">Coverage:</span> {source.coverage}
                </p>
              </div>

              <div className="pt-3 border-t border-[#F1F5F9] text-xs text-[#475569]">
                <span className="font-semibold block mb-0.5">Verification Rule:</span>
                <p className="text-[#64748B]">{source.verification}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reporting Inaccuracies Banner */}
      <div className="bg-[#FEF2F2] rounded-md border border-[#FCA5A5] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#B91C1C] shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm text-[#991B1B]">
              Found a Dead Link or Closed Registration?
            </h3>
            <p className="text-xs text-[#7F1D1D] mt-0.5 max-w-xl">
              We audit registration links every 12 hours. If a Google Form hits its quota or dates changed before our audit, please notify our moderation team.
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
