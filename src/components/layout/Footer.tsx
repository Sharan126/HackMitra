import React from "react";
import Link from "next/link";
import { Compass, ShieldCheck, MapPin, ExternalLink, AlertTriangle, FileCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-[#E2E8F0] mt-16 text-xs text-[#64748B]">
      {/* Ecosystem Trust Banner */}
      <div className="bg-[#FAFCFF] border-b border-[#F1F5F9] py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#16805D] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-[#0F172A] text-sm">
                The HackMitra Verification Pledge
              </p>
              <p className="text-xs text-[#64748B]">
                Zero fabricated events. Zero dead ends. Every listing features an authentic institutional circular, official portal link, and moderator verification timestamp.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#475569]">
              Coverage:
            </span>
            <span className="px-2 py-0.5 rounded bg-white border border-[#CBD5E1] text-[#0F172A] font-medium text-xs">
              31 Districts
            </span>
            <span className="px-2 py-0.5 rounded bg-[#142D4E] text-white font-medium text-xs">
              All 4 Divisions
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#142D4E] flex items-center justify-center text-white">
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-[#142D4E]">
                HackMitra
              </span>
            </div>
            <p className="text-xs text-[#475569] leading-relaxed max-w-sm">
              Karnataka&apos;s unified hackathon discovery portal. Bridging students and developers across all 31 districts—from Bengaluru to Belagavi, Mangaluru to Kalaburagi, and every tier 2/3 engineering college campus.
            </p>
            <div className="p-2.5 rounded bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-[11px] max-w-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Notice an expired link or false entry fee?</span>
                <p className="mt-0.5">
                  <a
                    href="mailto:inaccuracies@hackmitra.org?subject=Reporting%20Hackathon%20Inaccuracy"
                    className="underline font-bold text-[#B91C1C] hover:text-[#7F1D1D]"
                  >
                    Report an inaccuracy here
                  </a>{" "}
                  for immediate moderator review (&lt; 2h SLA).
                </p>
              </div>
            </div>
          </div>

          {/* Regional Clusters */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-3">
              Regional Clusters
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/districts/dharwad" className="hover:text-[#2563EB] transition-colors">
                  Hubballi-Dharwad & Belagavi
                </Link>
              </li>
              <li>
                <Link href="/districts/mysuru" className="hover:text-[#2563EB] transition-colors">
                  Mysuru & Mandya
                </Link>
              </li>
              <li>
                <Link href="/districts/dakshina-kannada" className="hover:text-[#2563EB] transition-colors">
                  Mangaluru & Coastal Hub
                </Link>
              </li>
              <li>
                <Link href="/districts/kalaburagi" className="hover:text-[#2563EB] transition-colors">
                  Kalaburagi (Kalyana KA)
                </Link>
              </li>
              <li>
                <Link href="/districts" className="hover:text-[#2563EB] transition-colors font-medium text-[#2563EB]">
                  View All 31 Districts →
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform & Verification */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-3">
              Sources & Standards
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/sources" className="hover:text-[#2563EB] transition-colors flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5 text-[#16805D]" />
                  <span>Verified Sources Guide</span>
                </Link>
              </li>
              <li>
                <Link href="/submit" className="hover:text-[#2563EB] transition-colors">
                  Submit College Circular
                </Link>
              </li>
              <li>
                <Link href="/hackathons" className="hover:text-[#2563EB] transition-colors">
                  Browse All Hackathons
                </Link>
              </li>
              <li>
                <a
                  href="mailto:inaccuracies@hackmitra.org?subject=Reporting%20Hackathon%20Inaccuracy"
                  className="hover:text-[#2563EB] transition-colors flex items-center gap-1 text-[#B91C1C] font-medium"
                >
                  <span>Report Error / Dead Link</span>
                  <ExternalLink className="w-3 h-3 text-[#B91C1C]" />
                </a>
              </li>
            </ul>
          </div>

          {/* Institutional Ecosystem */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-3">
              Ecosystem
            </h4>
            <p className="text-xs leading-relaxed text-[#64748B] mb-2">
              Indexing events from VTU affiliated colleges, autonomous institutions, NAIN incubation hubs, K-Tech clusters, and leading student developer communities across Karnataka.
            </p>
            <div className="pt-2 border-t border-[#F1F5F9] flex items-center gap-1 text-[11px] text-[#94A3B8]">
              <MapPin className="w-3 h-3 text-[#2563EB]" />
              <span>Covering 31 Districts Statewide</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#94A3B8]">
          <p>© {new Date().getFullYear()} HackMitra. Every Hackathon. Every District. One Platform.</p>
          <p className="flex items-center gap-1">
            <span>Built with precision for students across Karnataka</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
