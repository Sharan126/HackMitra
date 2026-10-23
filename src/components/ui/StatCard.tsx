import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon?: React.ReactNode;
  badge?: string;
  className?: string;
}

export function StatCard({ label, value, subtext, icon, badge, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-md border border-[#E2E8F0] p-4 sm:p-5 flex flex-col justify-between shadow-xs transition-colors hover:border-[#CBD5E1]",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          {label}
        </span>
        {icon ? (
          <div className="w-8 h-8 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#142D4E]">
            {icon}
          </div>
        ) : badge ? (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
            {badge}
          </span>
        ) : null}
      </div>
      <div>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
          {value}
        </div>
        {subtext && (
          <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}
