import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, MapPin, Globe, Sparkles, Building2, AlertCircle } from "lucide-react";

export type StatusType =
  | "verified"
  | "under_review"
  | "campus_direct"
  | "reg_open"
  | "reg_closing"
  | "reg_closed"
  | "in_person"
  | "hybrid"
  | "online"
  | "beyond_bengaluru"
  | "free"
  | "paid";

interface StatusLabelProps {
  type: StatusType;
  customText?: string;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function StatusLabel({ type, customText, size = "sm", className }: StatusLabelProps) {
  const configs: Record<
    StatusType,
    { label: string; icon: React.ReactNode; styles: string }
  > = {
    verified: {
      label: "Verified Source",
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#16805D]" />,
      styles: "bg-[#ECFDF5] text-[#16805D] border-[#A7F3D0]",
    },
    under_review: {
      label: "Review in Progress",
      icon: <Clock className="w-3.5 h-3.5 text-[#B45309]" />,
      styles: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
    },
    campus_direct: {
      label: "Campus Lead Verified",
      icon: <Building2 className="w-3.5 h-3.5 text-[#1D4ED8]" />,
      styles: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
    },
    reg_open: {
      label: "Registration Open",
      icon: <span className="w-1.5 h-1.5 rounded-full bg-[#16805D] shrink-0" />,
      styles: "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]",
    },
    reg_closing: {
      label: "Closing Soon",
      icon: <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] shrink-0" />,
      styles: "bg-[#FFFBEB] text-[#92400E] border-[#FCD34D]",
    },
    reg_closed: {
      label: "Registration Closed",
      icon: <span className="w-1.5 h-1.5 rounded-full bg-[#64748B] shrink-0" />,
      styles: "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]",
    },
    in_person: {
      label: "In-Person",
      icon: <MapPin className="w-3.5 h-3.5 text-[#475569]" />,
      styles: "bg-white text-[#334155] border-[#CBD5E1]",
    },
    hybrid: {
      label: "Hybrid",
      icon: <Sparkles className="w-3.5 h-3.5 text-[#475569]" />,
      styles: "bg-white text-[#334155] border-[#CBD5E1]",
    },
    online: {
      label: "Online",
      icon: <Globe className="w-3.5 h-3.5 text-[#475569]" />,
      styles: "bg-white text-[#334155] border-[#CBD5E1]",
    },
    beyond_bengaluru: {
      label: "Beyond Bengaluru",
      icon: <Sparkles className="w-3.5 h-3.5 text-[#142D4E]" />,
      styles: "bg-[#F1F5F9] text-[#142D4E] border-[#CBD5E1] font-semibold",
    },
    free: {
      label: "Free Entry",
      icon: null,
      styles: "bg-[#F8FAFC] text-[#0F172A] border-[#E2E8F0] font-medium",
    },
    paid: {
      label: "Entry Fee",
      icon: <AlertCircle className="w-3 h-3 text-[#B45309]" />,
      styles: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
    },
  };

  const current = configs[type] || {
    label: customText || String(type || ""),
    icon: null,
    styles: "bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]",
  };
  const sizeClasses = {
    xs: "text-[11px] px-1.5 py-0.5 gap-1",
    sm: "text-xs px-2.5 py-0.5 gap-1.5",
    md: "text-xs px-3 py-1 gap-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded border font-medium leading-none select-none tracking-tight",
        sizeClasses[size],
        current.styles,
        className
      )}
    >
      {current.icon}
      <span>{customText || current.label}</span>
    </span>
  );
}
