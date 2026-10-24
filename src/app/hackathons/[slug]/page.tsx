import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getHackathonBySlugWithSources, getVerifiedHackathons } from "../../../lib/services/supabase-db";
import { getAllHackathons } from "../../../lib/services/hackathons";
import { Button } from "../../../components/ui/Button";
import { StatusLabel } from "../../../components/ui/StatusLabel";
import { SaveEventButton } from "../../../components/hackathons/SaveEventButton";
import { cn } from "../../../lib/utils";
import {
  Calendar,
  MapPin,
  Clock,
  Trophy,
  Users,
  ExternalLink,
  ShieldCheck,
  Building,
  ArrowLeft,
  CheckCircle2,
  FileText,
  AlertCircle,
  GraduationCap,
  UserCheck,
} from "lucide-react";

export async function generateStaticParams() {
  const hackathons = getAllHackathons();
  return hackathons.map((h) => ({
    slug: h.slug,
  }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function HackathonDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getHackathonBySlugWithSources(slug);

  if (!result || !result.hackathon) {
    notFound();
  }

  const { hackathon, sources, verificationLogs } = result;

  const formatText = {
    in_person: "In-Person (On-Campus)",
    hybrid: "Hybrid (Virtual Ideation + On-Campus Finale)",
    online: "100% Online",
  }[hackathon.format];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#142D4E] hover:text-[#2563EB] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Karnataka Hackathons Radar</span>
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white rounded-md border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#142D4E]/8 text-[#142D4E] font-medium border border-[#142D4E]/15 text-xs">
              <MapPin className="w-3.5 h-3.5 text-[#142D4E]" />
              <span>{hackathon.city}, {hackathon.districtName}</span>
              {hackathon.kannadaDistrict && (
                <span className="text-[#64748B]">({hackathon.kannadaDistrict})</span>
              )}
            </span>

            {hackathon.isBeyondBengaluru && (
              <StatusLabel type="beyond_bengaluru" size="sm" />
            )}

            <StatusLabel type={hackathon.format} size="sm" />
          </div>

          <div className="flex items-center gap-2">
            <StatusLabel
              type={hackathon.registrationStatus}
              size="sm"
            />
          </div>
        </div>

        {/* Organizer */}
        <div className="flex items-center gap-1.5 text-xs text-[#64748B] mb-2">
          <Building className="w-4 h-4 text-[#94A3B8]" />
          <span className="font-semibold text-[#475569]">{hackathon.organizer}</span>
          <span className="text-[#CBD5E1]">•</span>
          <span>{hackathon.organizerType}</span>
        </div>

        {/* Title & Tagline */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#142D4E] tracking-tight mb-2">
          {hackathon.title}
        </h1>
        {hackathon.tagline && (
          <p className="text-sm sm:text-base text-[#475569] mb-6">
            {hackathon.tagline}
          </p>
        )}

        {/* Key Attributes Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-y border-[#F1F5F9] text-xs">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#64748B] tracking-wider block mb-1">
              Event Dates
            </span>
            <div className="flex items-center gap-1.5 font-bold text-[#0F172A]">
              <Calendar className="w-4 h-4 text-[#2563EB]" />
              <span>{hackathon.startDate} - {hackathon.endDate}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-[#64748B] tracking-wider block mb-1">
              Apply Deadline
            </span>
            <div className="flex items-center gap-1.5 font-bold text-[#B45309]">
              <Clock className="w-4 h-4 text-[#B45309]" />
              <div className="min-w-0">
                <span>
                  {hackathon.registrationStatus === "deadline_today"
                    ? (hackathon.isDateOnlyDeadline ? "Closes Today (IST)" : hackathon.registrationDeadline)
                    : hackathon.registrationDeadline}
                </span>
                {hackathon.isDateOnlyDeadline && (
                  <span className="block text-[10px] font-normal text-[#64748B]">
                    Date-only deadline (Asia/Kolkata)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-[#64748B] tracking-wider block mb-1">
              Total Prize Pool
            </span>
            <div className="flex items-center gap-1.5 font-bold text-[#16805D]">
              <Trophy className="w-4 h-4 text-[#16805D]" />
              <span>{hackathon.prizePool}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-[#64748B] tracking-wider block mb-1">
              Fee & Team
            </span>
            <div className="flex items-center gap-1.5 font-bold text-[#0F172A]">
              <Users className="w-4 h-4 text-[#64748B]" />
              <span>{hackathon.teamSize} • {hackathon.isFree ? "Free Entry" : hackathon.feeAmount}</span>
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <a
              href={hackathon.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="primary"
                size="md"
                leftIcon={<ExternalLink className="w-4 h-4" />}
              >
                Go to Official Registration
              </Button>
            </a>
            {hackathon.officialWebsiteUrl && (
              <a
                href={hackathon.officialWebsiteUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary" size="md">
                  College Portal
                </Button>
              </a>
            )}
            <SaveEventButton hackathonId={hackathon.id} size="md" />
          </div>

          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <span className="text-slate-400">Indexed via {hackathon.sourcePlatform}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Description & Verification Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Schedule */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Event */}
          <div className="bg-white rounded-md border border-[#E2E8F0] p-6 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
              About This Hackathon
            </h2>
            <p className="text-sm text-[#475569] leading-relaxed whitespace-pre-line">
              {hackathon.description}
            </p>

            {/* Themes */}
            <div className="pt-3 border-t border-[#F1F5F9]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-2">
                Tracks & Themes
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {hackathon.themeTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 bg-[#F8FAFC] text-[#334155] rounded border border-[#E2E8F0]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Event Rounds & Timeline */}
          {hackathon.rounds && hackathon.rounds.length > 0 && (
            <div className="bg-white rounded-md border border-[#E2E8F0] p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                Timeline & Rounds
              </h2>
              <div className="space-y-3">
                {hackathon.rounds.map((round, idx) => (
                  <div
                    key={round.title}
                    className="p-3.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-3 text-xs"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#142D4E] text-white flex items-center justify-center font-bold shrink-0 text-xs">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#0F172A] text-sm">{round.title}</span>
                        <span className="text-[#64748B] font-medium">{round.date}</span>
                      </div>
                      <p className="text-[#475569] mt-1">{round.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Eligibility & Team Participation Guidelines */}
          <div className="bg-white rounded-md border border-[#E2E8F0] p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#2563EB]" />
              <span>Eligibility & Team Requirements</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">
                  Eligible Participants
                </span>
                <p className="font-medium text-[#0F172A] leading-relaxed">
                  {hackathon.eligibility || "Open to all students across Karnataka engineering, polytechnic, and university campuses."}
                </p>
              </div>

              <div className="p-3.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">
                  Team Formation Rules
                </span>
                <p className="font-medium text-[#0F172A] leading-relaxed">
                  {hackathon.teamSize}
                  {hackathon.teamSizeMin && hackathon.teamSizeMin <= 1 ? " (Solo participation permitted)" : " (Team submission only)"}
                </p>
              </div>

              <div className="p-3.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">
                  Registration Fee
                </span>
                <p className="font-medium text-[#0F172A]">
                  {hackathon.isFree ? "100% Free Entry (No fees for verified student teams)" : hackathon.feeAmount || `₹${hackathon.registrationFeeInr} / Team`}
                </p>
              </div>

              <div className="p-3.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">
                  Verified Prize Pool
                </span>
                <p className="font-semibold text-[#16805D]">
                  {hackathon.prizePool} {hackathon.prizePoolInr ? `(₹${hackathon.prizePoolInr.toLocaleString("en-IN")})` : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Venue & Location */}
          <div className="bg-white rounded-md border border-[#E2E8F0] p-6 shadow-xs space-y-2">
            <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
              Venue & Format
            </h2>
            <div className="flex items-start gap-2 text-xs text-[#475569]">
              <MapPin className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#0F172A]">{formatText}</p>
                <p className="text-[#64748B] mt-0.5">{hackathon.venue || "Campus details provided upon team confirmation"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Transparent Verification Audit Trail */}
        <div className="space-y-6">
          <div className="bg-white rounded-md border border-[#E2E8F0] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#142D4E]">
                <ShieldCheck className="w-4 h-4 text-[#16805D]" />
                <span>Verification Dossier</span>
              </div>
              <StatusLabel type={hackathon.registrationStatus} size="xs" />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Last Audit:</span>
                <span className="font-medium text-[#0F172A]">{hackathon.verifiedAt}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Timezone Engine:</span>
                <span className="font-medium text-[#0F172A]">Asia/Kolkata (IST +05:30)</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">District:</span>
                <span className="font-medium text-[#0F172A]">{hackathon.districtName}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Link Health:</span>
                <span className={cn(
                  "font-medium",
                  hackathon.registrationStatus === "unverified"
                    ? "text-[#DC2626]"
                    : "text-[#16805D]"
                )}>
                  {hackathon.registrationStatus === "unverified"
                    ? "Unreachable / HTTP Error"
                    : "200 OK (Authoritative)"}
                </span>
              </div>

              {hackathon.verificationNotes && (
                <div className="py-1 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B] block mb-0.5">Audit Note:</span>
                  <span className="text-[#334155] italic text-[11px] leading-relaxed">
                    {hackathon.verificationNotes}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#F1F5F9]">
              <a
                href={hackathon.sourceProofUrl || hackathon.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#2563EB] hover:text-[#1D4ED8] underline underline-offset-2 flex items-center gap-1 font-medium"
              >
                <span>Inspect Authoritative Source Evidence</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Verification Audit History */}
          {verificationLogs && verificationLogs.length > 0 && (
            <div className="bg-white rounded-md border border-[#E2E8F0] p-4 shadow-xs space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#142D4E]">
                <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Verification Audit History</span>
              </div>
              <div className="space-y-2 text-[11px]">
                {verificationLogs.slice(0, 3).map((log: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded bg-[#F8FAFC] border border-[#F1F5F9] space-y-1">
                    <div className="flex items-center justify-between text-[#64748B]">
                      <span className="font-semibold text-[#334155] capitalize">
                        {String(log.verification_check_type || "Audit").replace(/_/g, " ")}
                      </span>
                      <span>
                        {new Date(log.created_at).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-[#475569] leading-relaxed">{log.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report inaccuracy card */}
          <div className="bg-[#F8FAFC] rounded-md border border-[#E2E8F0] p-4 text-xs space-y-2">
            <span className="font-semibold text-[#0F172A] block">Notice a discrepancy?</span>
            <p className="text-[#64748B] text-[11px] leading-relaxed">
              If registration has closed early or prize details changed, help fellow Karnataka students by letting us know.
            </p>
            <a
              href={`mailto:inaccuracies@hackmitra.org?subject=Inaccuracy%20Report%20for%20${encodeURIComponent(hackathon.title)}`}
              className="text-[#B91C1C] hover:underline font-semibold block text-[11px]"
            >
              Report an inaccuracy →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
