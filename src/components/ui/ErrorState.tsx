import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Failed to load events",
  message = "An error occurred while fetching verified hackathons. Please check your internet connection or try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-md border border-[#FCA5A5] p-6 sm:p-8 text-center max-w-lg mx-auto shadow-xs",
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-[#FEF2F2] border border-[#FCA5A5] flex items-center justify-center mx-auto mb-3 text-[#B91C1C]">
        <AlertTriangle className="w-5 h-5" />
      </div>

      <h3 className="text-base font-bold text-[#0F172A] tracking-tight mb-1.5">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-[#64748B] mb-5 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RotateCw className="w-3.5 h-3.5" />}
        >
          Try Again
        </Button>
      )}
    </div>
  );
}
