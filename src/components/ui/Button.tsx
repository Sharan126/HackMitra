import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "secondary" | "outline" | "ghost" | "success";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none text-center cursor-pointer";

    const variantStyles = {
      primary: "bg-[#142D4E] hover:bg-[#1D3F6C] text-white border border-[#0D1E35] shadow-xs",
      accent: "bg-[#2563EB] hover:bg-[#1D4ED8] text-white border border-[#1D4ED8] shadow-xs",
      secondary: "bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] shadow-xs",
      outline: "bg-transparent hover:bg-[#F1F5F9] text-[#142D4E] border border-[#CBD5E1]",
      ghost: "bg-transparent hover:bg-[#E2E8F0]/60 text-[#475569] hover:text-[#0F172A]",
      success: "bg-[#16805D] hover:bg-[#126A4D] text-white border border-[#126A4D] shadow-xs",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-9.5 px-4 text-sm gap-2",
      lg: "h-11 px-5 text-base gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
