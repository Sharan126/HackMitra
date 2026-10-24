"use client";

import React, { useState } from "react";
import { useAuth } from "../../lib/auth/auth-context";
import { Button } from "../ui/Button";
import { X, Lock, Mail, Compass, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const res = await signUp(email, password);
        if (res.success) {
          setSuccessMessage("Account created! Check your email or sign in directly.");
        } else {
          setError(res.error || "Failed to create account");
        }
      } else {
        const res = await signIn(email, password);
        if (res.success) {
          closeAuthModal();
        } else {
          setError(res.error || "Invalid email or password");
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoStudentLogin = async () => {
    setError(null);
    setLoading(true);
    // Use test student credentials
    const demoEmail = "student@hackmitra.in";
    const demoPass = "HackMitra2026!";
    setEmail(demoEmail);
    setPassword(demoPass);

    // Try signing in; if user doesn't exist, sign up then sign in
    let res = await signIn(demoEmail, demoPass);
    if (!res.success) {
      await signUp(demoEmail, demoPass);
      res = await signIn(demoEmail, demoPass);
    }

    if (res.success) {
      closeAuthModal();
    } else {
      setError(res.error || "Demo login failed");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-[#E2E8F0] overflow-hidden">
        {/* Header Banner */}
        <div className="bg-[#142D4E] p-6 text-white text-left relative">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-1.5 rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded bg-[#2563EB] flex items-center justify-center text-white">
              <Compass className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-base tracking-tight">HackMitra Accounts</span>
          </div>
          <h2 className="text-lg font-bold text-white">
            {isSignUp ? "Create Student Account" : "Sign In to HackMitra"}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Save hackathons, track deadlines, and receive verified Karnataka alerts.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(null); }}
            className={`flex-1 py-2.5 text-xs font-semibold text-center transition-colors ${
              !isSignUp ? "text-[#142D4E] border-b-2 border-[#142D4E] bg-white font-bold" : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(null); }}
            className={`flex-1 py-2.5 text-xs font-semibold text-center transition-colors ${
              isSignUp ? "text-[#142D4E] border-b-2 border-[#142D4E] bg-white font-bold" : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Content & Form */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Student / Developer Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="you@college.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full justify-center"
              disabled={loading}
            >
              {loading ? "Processing..." : isSignUp ? "Create Student Account" : "Sign In"}
            </Button>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-4 pt-4 border-t border-[#F1F5F9] text-center">
            <button
              type="button"
              onClick={handleDemoStudentLogin}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Use 1-Click Demo Student Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
