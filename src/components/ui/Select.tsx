import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, leftIcon, children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-[#64748B]">
              {leftIcon}
            </div>
          )}
          <select
            ref={ref}
            className={cn(
              "w-full h-10 appearance-none rounded-md bg-white border border-[#CBD5E1] text-[#0F172A] text-sm",
              "transition-colors focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]",
              "disabled:bg-[#F1F5F9] disabled:text-[#94A3B8] disabled:cursor-not-allowed cursor-pointer",
              leftIcon ? "pl-9" : "pl-3",
              "pr-9",
              error && "border-[#B91C1C] focus:border-[#B91C1C] focus:ring-[#B91C1C]",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <div className="absolute right-3 flex items-center pointer-events-none text-[#64748B]">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <p className="mt-1 text-xs text-[#B91C1C]">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
