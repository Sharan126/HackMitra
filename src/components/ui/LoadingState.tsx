import React from "react";
import { cn } from "../../lib/utils";

interface LoadingStateProps {
  count?: number;
  className?: string;
}

export function LoadingState({ count = 3, className }: LoadingStateProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-md border border-[#E2E8F0] p-5 animate-pulse flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 w-28 bg-[#E2E8F0] rounded" />
              <div className="h-5 w-20 bg-[#E2E8F0] rounded" />
            </div>

            <div className="h-4 w-40 bg-[#F1F5F9] rounded mb-2" />
            <div className="h-6 w-5/6 bg-[#E2E8F0] rounded mb-2" />
            <div className="h-4 w-3/4 bg-[#F1F5F9] rounded mb-5" />

            <div className="grid grid-cols-3 gap-3 py-3 border-y border-[#F1F5F9] mb-4">
              <div className="h-8 bg-[#F1F5F9] rounded" />
              <div className="h-8 bg-[#F1F5F9] rounded" />
              <div className="h-8 bg-[#F1F5F9] rounded" />
            </div>

            <div className="flex gap-2">
              <div className="h-5 w-16 bg-[#F1F5F9] rounded" />
              <div className="h-5 w-20 bg-[#F1F5F9] rounded" />
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
            <div className="h-4 w-32 bg-[#F1F5F9] rounded" />
            <div className="h-8 w-24 bg-[#E2E8F0] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
