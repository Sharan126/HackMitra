"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth/auth-context";
import { Bookmark, Check, Loader2 } from "lucide-react";

interface SaveEventButtonProps {
  hackathonId: string;
  initialSaved?: boolean;
  size?: "sm" | "md" | "icon";
  className?: string;
  onToggle?: (isSaved: boolean) => void;
}

export function SaveEventButton({
  hackathonId,
  initialSaved = false,
  size = "md",
  className = "",
  onToggle,
}: SaveEventButtonProps) {
  const { user, token, openAuthModal } = useAuth();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Check if event is saved when user loads
  useEffect(() => {
    if (!user || !token) {
      setIsSaved(false);
      return;
    }

    let isMounted = true;
    async function checkSaved() {
      try {
        const res = await fetch("/api/user/saved-events", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const match = data.savedEvents?.some((e: any) => e.hackathon_id === hackathonId);
          if (isMounted) setIsSaved(Boolean(match));
        }
      } catch {
        // Ignore background check failure
      }
    }

    checkSaved();
    return () => { isMounted = false; };
  }, [user, token, hackathonId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || !token) {
      openAuthModal();
      return;
    }

    setLoading(true);
    const nextSaved = !isSaved;

    try {
      if (nextSaved) {
        const res = await fetch("/api/user/saved-events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ hackathonId }),
        });

        if (res.ok) {
          setIsSaved(true);
          setJustSaved(true);
          setTimeout(() => setJustSaved(false), 3000);
          onToggle?.(true);
        }
      } else {
        const res = await fetch("/api/user/saved-events", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ hackathonId }),
        });

        if (res.ok) {
          setIsSaved(false);
          onToggle?.(false);
        }
      }
    } catch (err) {
      console.error("Failed to toggle save event:", err);
    } finally {
      setLoading(false);
    }
  };

  if (size === "icon") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        title={isSaved ? "Saved (Click to unsave)" : "Save to radar"}
        className={`p-2 rounded-md border transition-all cursor-pointer flex items-center justify-center ${
          isSaved
            ? "bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE]"
            : "bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#142D4E] hover:border-[#CBD5E1]"
        } ${className}`}
        aria-label={isSaved ? "Unsave hackathon" : "Save hackathon"}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
        ) : (
          <Bookmark className={`w-4 h-4 ${isSaved ? "fill-[#2563EB]" : ""}`} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-xs border transition-all cursor-pointer ${
        isSaved
          ? "bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB] hover:bg-[#DBEAFE]"
          : "bg-white border-[#CBD5E1] text-[#334155] hover:text-[#142D4E] hover:border-[#94A3B8]"
      } ${className}`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
      ) : justSaved ? (
        <Check className="w-3.5 h-3.5 text-[#16805D]" />
      ) : (
        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-[#2563EB]" : ""}`} />
      )}
      <span>
        {loading ? "Saving..." : justSaved ? "Reminder Armed!" : isSaved ? "Saved to Radar" : "Save Hackathon"}
      </span>
    </button>
  );
}
