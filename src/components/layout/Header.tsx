"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import {
  Compass,
  MapPin,
  PlusCircle,
  Menu,
  X,
  ShieldCheck,
  Building2,
  FileCheck2,
  Layers,
  Sparkles,
  User,
} from "lucide-react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { label: "Hackathons", href: "/hackathons", icon: Layers },
    { label: "Districts", href: "/districts", icon: MapPin },
    { label: "Sources", href: "/sources", icon: FileCheck2 },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xs border-b border-[#E2E8F0]">
      {/* Top Utility Announcement Bar */}
      <div className="bg-[#142D4E] text-white text-[11px] py-1 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16805D] animate-pulse" />
            <span className="font-medium text-slate-200">
              Karnataka-Wide Hackathon Network: 31 Districts Covered
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-slate-300">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#34D399]" />
              <span>100% Moderator Verified</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#60A5FA]" />
              <span>Beyond Bengaluru Initiative</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-md bg-[#142D4E] flex items-center justify-center text-white shadow-xs group-hover:bg-[#1D3F6C] transition-colors">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#142D4E]">
                  HackMitra
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                  KA
                </span>
              </div>
              <p className="text-[10px] text-[#64748B] font-medium leading-none -mt-0.5 hidden sm:block">
                Every Hackathon. Every District. One Platform.
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-xs font-semibold px-3 py-2 rounded transition-colors flex items-center gap-1.5",
                    isActive
                      ? "text-[#142D4E] bg-[#F1F5F9] font-bold"
                      : "text-[#334155] hover:text-[#142D4E] hover:bg-[#F1F5F9]"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <Link href="/submit">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
            >
              Submit Hackathon
            </Button>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E2E8F0] px-4 py-4 space-y-3">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium px-3 py-2.5 rounded text-[#0F172A] hover:bg-[#F1F5F9] flex items-center gap-2"
                >
                  <Icon className="w-4 h-4 text-[#2563EB]" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <Link
              href="/submit"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium px-3 py-2.5 rounded text-[#142D4E] bg-[#EFF6FF] flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-[#2563EB]" />
              <span>Submit College Hackathon</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
