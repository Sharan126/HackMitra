import React from "react";
import { cn } from "@/lib/utils";
import { SearchX, PlusCircle, RotateCcw } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
  showSubmitAction?: boolean;
  className?: string;
}

export function EmptyState({
  title = "No hackathons found matching your criteria",
  description = "Try adjusting your filters, selecting a different Karnataka district, or clearing the active search keyword.",
  onReset,
  showSubmitAction = true,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-md border border-[#E2E8F0] p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center mx-auto mb-4 text-[#64748B]">
        <SearchX className="w-6 h-6" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-[#0F172A] tracking-tight mb-2">
        {title}
      </h3>

      <p className="text-sm text-[#64748B] leading-relaxed mb-6 max-w-md mx-auto">
        {description}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onReset && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Filters
          </Button>
        )}

        {showSubmitAction && (
          <a href="/submit">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
            >
              Submit an Event
            </Button>
          </a>
        )}
      </div>

      <p className="mt-6 text-xs text-[#94A3B8] border-t border-[#F1F5F9] pt-4">
        Know of an upcoming college or university hackathon in your district? Help fellow students by submitting the official circular.
      </p>
    </div>
  );
}
