import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { StatusLabel } from "./StatusLabel";
import { Hackathon } from "@/types/hackathon";
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  ExternalLink,
  ShieldCheck,
  Building,
  Clock,
  ArrowRight,
} from "lucide-react";

interface HackathonCardProps {
  hackathon: Hackathon;
  className?: string;
  compact?: boolean;
}

export function HackathonCard({ hackathon, className, compact = false }: HackathonCardProps) {
  // Map format to status label type
  const formatMap = {
    in_person: "in_person",
    hybrid: "hybrid",
    online: "online",
  } as const;

  // Map registration status
  const regStatusMap = {
    open: "reg_open",
    closing_soon: "reg_closing",
    closed: "reg_closed",
    upcoming: "under_review",
  } as const;

  const regStatusTextMap = {
    open: "Registration Open",
    closing_soon: "Closing Soon",
    closed: "Registration Closed",
    upcoming: "Upcoming",
  };

  return (
    <article
      className={cn(
        "group bg-white rounded-md border border-[#E2E8F0] shadow-xs hover:border-[#CBD5E1] transition-all flex flex-col justify-between overflow-hidden",
        className
      )}
    >
      {/* Top Meta Bar */}
      <div className="p-3.5 sm:p-4 border-b border-[#F1F5F9] bg-[#FAFCFF] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* District & City */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#142D4E]/8 text-[#142D4E] font-medium border border-[#142D4E]/15 text-xs">
            <MapPin className="w-3 h-3 text-[#142D4E]" />
            <span>
              {hackathon.city}, {hackathon.districtName}
            </span>
            {hackathon.kannadaDistrict && (
              <span className="text-[#64748B] font-normal ml-0.5">
                ({hackathon.kannadaDistrict})
              </span>
            )}
          </span>

          {hackathon.isBeyondBengaluru && (
            <StatusLabel type="beyond_bengaluru" size="xs" />
          )}

          <StatusLabel type={formatMap[hackathon.format]} size="xs" />
        </div>

        <div className="flex items-center gap-1.5">
          <StatusLabel
            type={regStatusMap[hackathon.registrationStatus]}
            customText={regStatusTextMap[hackathon.registrationStatus]}
            size="xs"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {/* Organizer */}
        <div className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1.5">
          <Building className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
          <span className="font-medium text-[#475569] truncate">
            {hackathon.organizer}
          </span>
          <span className="text-[#CBD5E1]">•</span>
          <span className="text-[11px] text-[#64748B] shrink-0">
            {hackathon.organizerType}
          </span>
        </div>

        {/* Event Title */}
        <Link href={`/hackathons/${hackathon.slug}`} className="group/link block">
          <h3 className="text-base sm:text-lg font-bold text-[#0F172A] tracking-tight group-hover/link:text-[#2563EB] transition-colors line-clamp-2 mb-2 leading-snug">
            {hackathon.title}
          </h3>
        </Link>

        {hackathon.tagline && (
          <p className="text-xs text-[#64748B] line-clamp-1 mb-3">
            {hackathon.tagline}
          </p>
        )}

        {/* Key Specs Grid: Event Dates, Registration Deadline, Prize Pool */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-2.5 py-2.5 border-y border-[#F1F5F9] text-xs">
          <div className="flex items-center gap-2 text-[#475569]">
            <Calendar className="w-4 h-4 text-[#64748B] shrink-0" />
            <div>
              <p className="text-[10px] uppercase font-semibold text-[#64748B] tracking-wider">
                Event Dates
              </p>
              <p className="font-medium text-[#0F172A] truncate">
                {hackathon.startDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[#475569]">
            <Clock className="w-4 h-4 text-[#B45309] shrink-0" />
            <div>
              <p className="text-[10px] uppercase font-semibold text-[#64748B] tracking-wider">
                Apply Deadline
              </p>
              <p className="font-semibold text-[#0F172A] truncate">
                {hackathon.registrationDeadline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[#475569] col-span-2 sm:col-span-1">
            <Trophy className="w-4 h-4 text-[#16805D] shrink-0" />
            <div>
              <p className="text-[10px] uppercase font-semibold text-[#64748B] tracking-wider">
                Prize / Fee
              </p>
              <p className="font-medium text-[#0F172A] truncate">
                {hackathon.prizePool} • {hackathon.isFree ? "Free" : hackathon.feeAmount || "Paid"}
              </p>
            </div>
          </div>
        </div>

        {/* Theme Tags */}
        {!compact && hackathon.themeTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 my-2">
            {hackathon.themeTags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2 py-0.5 bg-[#F1F5F9] text-[#475569] rounded border border-[#E2E8F0]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Moderator Verification Line */}
        <div className="mt-auto pt-3 border-t border-[#F8FAFC] flex flex-wrap items-center justify-between text-[11px] text-[#64748B] gap-2">
          <div className="flex items-center gap-1.5 text-[#16805D]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-medium">Verified by Moderator</span>
            <span className="text-[#94A3B8]">({hackathon.verifiedAt})</span>
          </div>

          <span className="text-[11px] text-[#64748B]">
            Source: <span className="font-medium text-[#475569]">{hackathon.sourcePlatform}</span>
          </span>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="p-3 sm:px-5 sm:py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between gap-3">
        <Link
          href={`/hackathons/${hackathon.slug}`}
          className="text-xs font-semibold text-[#142D4E] hover:text-[#2563EB] transition-colors inline-flex items-center gap-1"
        >
          <span>View Details & Rules</span>
          <ArrowRight className="w-3 h-3" />
        </Link>

        <a
          href={hackathon.registrationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium rounded bg-[#142D4E] hover:bg-[#1D3F6C] text-white border border-[#0D1E35] transition-colors gap-1.5 shadow-xs"
        >
          <span>Official Apply</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </article>
  );
}
