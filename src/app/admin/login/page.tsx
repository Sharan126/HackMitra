"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, Mail, ArrowLeft, AlertCircle, KeyRound } from "lucide-react";
import { Button } from "../../../components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || "Authentication failed. Check administrator credentials.");
        return;
      }

      // Successfully authenticated -> redirect to admin dashboard
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Network error communicating with authentication service");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#142D4E] hover:text-[#2563EB] transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Public Platform</span>
          </Link>
        </div>

        <div className="bg-white rounded-md border border-[#E2E8F0] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-[#142D4E] tracking-tight">
              HackMitra Admin Portal
            </h1>
            <p className="text-xs text-[#64748B]">
              Restricted area for authorized statewide moderators and data stewards.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded text-xs text-[#991B1B] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#142D4E] uppercase tracking-wider mb-1">
                Moderator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="admin@hackmitra.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#142D4E] uppercase tracking-wider mb-1">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isLoading}
              className="w-full bg-[#142D4E] hover:bg-[#1E3A8A] text-white text-xs font-bold py-2.5"
            >
              <KeyRound className="w-4 h-4 mr-2" />
              {isLoading ? "Authenticating..." : "Authorize Session"}
            </Button>
          </form>

          <div className="pt-4 border-t border-[#F1F5F9] text-[11px] text-[#64748B] text-center leading-relaxed">
            All administrative actions, event edits, and status overrides are recorded in the immutable audit trail with moderator identity.
          </div>
        </div>
      </div>
    </div>
  );
}
