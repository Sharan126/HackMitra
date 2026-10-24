import React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightIcon, error, helperText, type = "text", ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-[#64748B]">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            ref={ref}
            className={cn(
              "w-full h-10 rounded-md bg-white border border-[#CBD5E1] text-[#0F172A] placeholder:text-[#94A3B8] text-sm",
              "transition-colors focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]",
              "disabled:bg-[#F1F5F9] disabled:text-[#94A3B8] disabled:cursor-not-allowed",
              leftIcon ? "pl-9" : "pl-3",
              rightIcon ? "pr-9" : "pr-3",
              error && "border-[#B91C1C] focus:border-[#B91C1C] focus:ring-[#B91C1C]",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-[#64748B]">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1 text-xs text-[#B91C1C]">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-[#64748B]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
