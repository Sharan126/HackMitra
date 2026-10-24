"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useAuth } from "../../lib/auth/auth-context";
import { Button } from "../../components/ui/Button";
import { StatusLabel } from "../../components/ui/StatusLabel";
import { KARNATAKA_DISTRICTS } from "../../lib/karnataka-data";
import {
  Bookmark,
  Bell,
  Settings,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Layers,
  ChevronRight,
  Filter,
} from "lucide-react";

const TECH_DOMAINS = [
  "Artificial Intelligence & Machine Learning",
  "Web3 & Blockchain",
  "Cloud Computing & DevOps",
  "Cybersecurity & Privacy",
  "Internet of Things (IoT) & Robotics",
  "Mobile App Development",
  "Agritech & Rural Innovation",
  "Healthcare & BioTech",
  "FinTech & Digital Commerce",
  "CleanTech & Sustainability",
  "Open Source & Public Digital Goods",
];

export default function UserProfilePage() {
  const { user, token, loading: authLoading, openAuthModal, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<"saved" | "preferences" | "delivery">("saved");

  // State
  const [savedEvents, setSavedEvents] = useState<any[]>([]);
  const [pendingReminders, setPendingReminders] = useState<any[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Preferences form
  const [email, setEmail] = useState("");
  const [homeDistrictId, setHomeDistrictId] = useState<string | null>(null);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyDeadlineReminders, setNotifyDeadlineReminders] = useState(true);
  const [notifyNewInDistrict, setNotifyNewInDistrict] = useState(true);
  const [notifyStatusChanges, setNotifyStatusChanges] = useState(true);

  // Feedback
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load user data
  useEffect(() => {
    if (!user || !token) return;

    let isMounted = true;
    setLoadingData(true);

    async function fetchData() {
      try {
        // 1. Fetch saved events
        const savedRes = await fetch("/api/user/saved-events", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (savedRes.ok) {
          const sData = await savedRes.json();
          if (isMounted) {
            setSavedEvents(sData.savedEvents || []);
            setPendingReminders(sData.pendingReminders || []);
          }
        }

        // 2. Fetch preferences
        const prefRes = await fetch("/api/user/preferences", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (prefRes.ok) {
          const pData = await prefRes.json();
          const p = pData.preferences;
          if (isMounted && p) {
            setEmail(p.email || user?.email || "");
            setHomeDistrictId(p.home_district_id);
            setSelectedDistricts(p.preferred_districts || []);
            setSelectedThemes(p.preferred_themes || []);
            setNotifyEmail(p.notify_email ?? true);
            setNotifyDeadlineReminders(p.notify_deadline_reminders ?? true);
            setNotifyNewInDistrict(p.notify_new_in_district ?? true);
            setNotifyStatusChanges(p.notify_status_changes ?? true);
          }
        }

        // 3. Fetch delivery history
        const notifRes = await fetch("/api/user/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (notifRes.ok) {
          const nData = await notifRes.json();
          if (isMounted) {
            setDeliveryLogs(nData.deliveryLogs || []);
          }
        }
      } catch (err) {
        console.error("Failed to load user profile data:", err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    }

    fetchData();
    return () => { isMounted = false; };
  }, [user, token]);

  // Handle Unsave
  const handleUnsave = async (hackathonId: string) => {
    if (!token) return;
    try {
      const res = await fetch("/api/user/saved-events", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ hackathonId }),
      });
      if (res.ok) {
        setSavedEvents((prev) => prev.filter((e) => e.hackathon_id !== hackathonId));
        setPendingReminders((prev) => prev.filter((r) => r.hackathon_id !== hackathonId));
      }
    } catch (err) {
      console.error("Unsave failed:", err);
    }
  };

  // Handle Save Preferences
  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const res = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          home_district_id: homeDistrictId,
          preferred_districts: selectedDistricts,
          preferred_themes: selectedThemes,
          notify_email: notifyEmail,
          notify_deadline_reminders: notifyDeadlineReminders,
          notify_new_in_district: notifyNewInDistrict,
          notify_status_changes: notifyStatusChanges,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Preferences update failed:", err);
    }
  };

  // Handle Send Test Notification
  const handleSendTest = async () => {
    if (!token) return;
    setTestSending(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/user/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setTestResult({ success: true, message: data.message || "Test email delivered successfully!" });
        // Refresh logs
        const notifRes = await fetch("/api/user/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (notifRes.ok) {
          const nData = await notifRes.json();
          setDeliveryLogs(nData.deliveryLogs || []);
        }
      } else {
        setTestResult({ success: false, message: data.message || "Delivery failed" });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Network request failed" });
    } finally {
      setTestSending(false);
    }
  };

  // District selector helpers
  const toggleDistrict = (id: string) => {
    setSelectedDistricts((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const toggleTheme = (theme: string) => {
    setSelectedThemes((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]
    );
  };

  const selectAllDistricts = () => {
    setSelectedDistricts(KARNATAKA_DISTRICTS.map((d) => d.slug));
  };

  const clearAllDistricts = () => {
    setSelectedDistricts([]);
  };

  if (authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-sm text-[#64748B]">
        Loading your HackMitra profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#2563EB] mx-auto flex items-center justify-center">
          <Bookmark className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#142D4E] tracking-tight">
          Student Radar & Notifications
        </h1>
        <p className="text-sm text-[#64748B]">
          Sign in to save hackathons to your watchlist, configure Karnataka district alerts, and receive verified 24h deadline reminders.
        </p>
        <div className="pt-2">
          <Button variant="primary" size="md" onClick={openAuthModal}>
            Sign In or Create Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Banner Profile Summary */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#142D4E] tracking-tight">
              Student Hackathon Radar
            </h1>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              Active Member
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Logged in as <strong className="text-[#334155]">{user.email}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#E2E8F0] gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("saved")}
          className={`pb-3 px-3 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === "saved"
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Saved Hackathons ({savedEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("preferences")}
          className={`pb-3 px-3 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === "preferences"
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Districts & Preferences</span>
        </button>

        <button
          onClick={() => setActiveTab("delivery")}
          className={`pb-3 px-3 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === "delivery"
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Delivery History & Reminders</span>
        </button>
      </div>

      {/* Tab 1: Saved Hackathons */}
      {activeTab === "saved" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#64748B]">
              Hackathons saved to your personal watchlist. Automated 48h and 24h reminders are scheduled for active deadlines.
            </p>
            <Link href="/hackathons">
              <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                Browse More
              </Button>
            </Link>
          </div>

          {savedEvents.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-12 text-center space-y-3">
              <Bookmark className="w-8 h-8 text-[#94A3B8] mx-auto" />
              <h3 className="text-sm font-bold text-[#142D4E]">No Saved Hackathons Yet</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                Explore Karnataka-wide hackathons and click the "Save Hackathon" bookmark to arm automated deadline reminders.
              </p>
              <Link href="/hackathons">
                <Button variant="primary" size="sm">Explore Events</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedEvents.map((item) => {
                const h = item.hackathons;
                if (!h) return null;
                const hasReminder = pendingReminders.some((r) => r.hackathon_id === item.hackathon_id);

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-xs flex flex-col justify-between hover:border-[#CBD5E1] transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                          {h.district_name}
                        </span>
                        <StatusLabel type={h.current_status} size="sm" />
                      </div>

                      <Link href={`/hackathons/${h.slug}`}>
                        <h3 className="font-bold text-sm sm:text-base text-[#142D4E] hover:text-[#2563EB] transition-colors line-clamp-1">
                          {h.title}
                        </h3>
                      </Link>

                      <p className="text-xs text-[#64748B] mt-1">{h.organizer}</p>

                      <div className="mt-3 py-2 border-y border-[#F1F5F9] text-xs flex items-center justify-between text-[#475569]">
                        <div className="flex items-center gap-1 text-[#B45309] font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            Deadline: {new Date(h.registration_deadline).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <span className="font-semibold text-[#16805D]">{h.prize_pool_text}</span>
                      </div>

                      {hasReminder && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[#16805D] bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-[#16805D]" />
                          <span>24h & 48h Deadline Reminders Armed</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleUnsave(item.hackathon_id)}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <Link href={`/hackathons/${h.slug}`}>
                          <Button variant="ghost" size="sm">Details</Button>
                        </Link>
                        {h.registration_url && (
                          <a href={h.registration_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="primary" size="sm" rightIcon={<ExternalLink className="w-3 h-3" />}>
                              Register
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Districts & Preferences */}
      {activeTab === "preferences" && (
        <form onSubmit={handleSavePreferences} className="space-y-6">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Preferences and district filters updated successfully!</span>
            </div>
          )}

          {/* Section 1: Notification Delivery Toggles */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#142D4E] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#2563EB]" />
              <span>Notification Channels & Delivery Preferences</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Recipient Notification Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>
                <p className="text-[11px] text-[#64748B] mt-1">
                  Alerts will be dispatched through HackMitra's verified delivery service.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Home District
                </label>
                <select
                  value={homeDistrictId || ""}
                  onChange={(e) => setHomeDistrictId(e.target.value || null)}
                  className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#2563EB] bg-white"
                >
                  <option value="">None selected</option>
                  {KARNATAKA_DISTRICTS.map((d) => (
                    <option key={d.slug} value={d.slug}>
                      {d.name} ({d.kannadaName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-[#F1F5F9] space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="rounded text-[#2563EB] focus:ring-[#2563EB] w-4 h-4"
                />
                <div>
                  <span className="text-xs font-semibold text-[#142D4E]">Master Email Notifications</span>
                  <p className="text-[11px] text-[#64748B]">
                    Enable or disable all outgoing email alerts.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyDeadlineReminders}
                  onChange={(e) => setNotifyDeadlineReminders(e.target.checked)}
                  className="rounded text-[#2563EB] focus:ring-[#2563EB] w-4 h-4"
                />
                <div>
                  <span className="text-xs font-semibold text-[#142D4E]">48h & 24h Registration Deadline Reminders</span>
                  <p className="text-[11px] text-[#64748B]">
                    Receive reminders before registration closes for your saved hackathons.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyNewInDistrict}
                  onChange={(e) => setNotifyNewInDistrict(e.target.checked)}
                  className="rounded text-[#2563EB] focus:ring-[#2563EB] w-4 h-4"
                />
                <div>
                  <span className="text-xs font-semibold text-[#142D4E]">New Hackathons in Preferred Districts</span>
                  <p className="text-[11px] text-[#64748B]">
                    Get immediate alerts whenever a newly announced hackathon matches your district selections.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyStatusChanges}
                  onChange={(e) => setNotifyStatusChanges(e.target.checked)}
                  className="rounded text-[#2563EB] focus:ring-[#2563EB] w-4 h-4"
                />
                <div>
                  <span className="text-xs font-semibold text-[#142D4E]">Deadline Extensions & Status Changes</span>
                  <p className="text-[11px] text-[#64748B]">
                    Receive updates when a saved event's deadline is extended or date postponed.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Preferred Karnataka Districts */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-[#142D4E] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#2563EB]" />
                  <span>Preferred Karnataka Districts ({selectedDistricts.length} / 31 Selected)</span>
                </h2>
                <p className="text-xs text-[#64748B]">
                  Leave all unselected to monitor the entire state of Karnataka, or select target districts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllDistricts}
                  className="text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
                >
                  Select All 31
                </button>
                <span className="text-[#CBD5E1]">•</span>
                <button
                  type="button"
                  onClick={clearAllDistricts}
                  className="text-[11px] font-semibold text-[#64748B] hover:underline cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2">
              {KARNATAKA_DISTRICTS.map((d) => {
                const isSelected = selectedDistricts.includes(d.slug);
                return (
                  <button
                    key={d.slug}
                    type="button"
                    onClick={() => toggleDistrict(d.slug)}
                    className={`text-left px-3 py-2 rounded text-xs border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-[#EFF6FF] border-[#2563EB] text-[#142D4E] font-bold"
                        : "bg-white border-[#E2E8F0] text-[#475569] hover:border-[#CBD5E1]"
                    }`}
                  >
                    <span className="truncate">{d.name}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Technology Interests */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#142D4E] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2563EB]" />
              <span>Technology Interests ({selectedThemes.length} Selected)</span>
            </h2>
            <p className="text-xs text-[#64748B]">
              Filter alerts to hackathons matching specific technological domains.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {TECH_DOMAINS.map((domain) => {
                const isSelected = selectedThemes.includes(domain);
                return (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => toggleTheme(domain)}
                    className={`px-3 py-1.5 rounded text-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#142D4E] border-[#142D4E] text-white font-semibold"
                        : "bg-white border-[#E2E8F0] text-[#334155] hover:border-[#CBD5E1]"
                    }`}
                  >
                    <span>{domain}</span>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-[#34D399]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Action */}
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="md">
              Save Notification Preferences
            </Button>
          </div>
        </form>
      )}

      {/* Tab 3: Delivery History & Reminders */}
      {activeTab === "delivery" && (
        <div className="space-y-6">
          {/* Channel Verification Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-[#142D4E] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#16805D]" />
                <span>Test End-to-End Delivery Channel</span>
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Send an immediate test alert to <strong className="text-[#334155]">{email || user.email}</strong> to verify dispatch.
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Send className="w-3.5 h-3.5" />}
              onClick={handleSendTest}
              disabled={testSending}
            >
              {testSending ? "Dispatching..." : "Send Test Notification"}
            </Button>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded border text-xs flex items-center gap-2 ${
                testResult.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Pending Scheduled Reminders */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <h3 className="text-xs font-bold text-[#142D4E] uppercase tracking-wider">
                Scheduled Reminders Queue ({pendingReminders.length})
              </h3>
            </div>

            {pendingReminders.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#64748B]">
                No pending deadline reminders scheduled. Save a hackathon to arm automatic 24h & 48h reminders.
              </div>
            ) : (
              <div className="divide-y divide-[#F1F5F9] text-xs">
                {pendingReminders.map((r) => (
                  <div key={r.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-[#142D4E]">
                        {r.hackathons?.title || "Hackathon"}
                      </span>
                      <div className="text-[11px] text-[#64748B] flex items-center gap-2 mt-0.5">
                        <span className="capitalize">{r.reminder_type.replace(/_/g, " ")}</span>
                        <span>•</span>
                        <span>Target: {new Date(r.target_deadline).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-[#475569]">
                        Trigger: {new Date(r.scheduled_for).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery Audit History */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <h3 className="text-xs font-bold text-[#142D4E] uppercase tracking-wider">
                Delivery Logs Audit Trail ({deliveryLogs.length})
              </h3>
            </div>

            {deliveryLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#64748B]">
                No delivery history recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Recipient</th>
                      <th className="py-2.5 px-4 font-semibold">Type</th>
                      <th className="py-2.5 px-4 font-semibold">Subject</th>
                      <th className="py-2.5 px-4 font-semibold">Status</th>
                      <th className="py-2.5 px-4 font-semibold">Provider</th>
                      <th className="py-2.5 px-4 font-semibold">Sent At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {deliveryLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-2.5 px-4 font-medium text-[#142D4E]">{log.recipient_email}</td>
                        <td className="py-2.5 px-4 text-[#475569] capitalize">
                          {log.notification_type.replace(/_/g, " ")}
                        </td>
                        <td className="py-2.5 px-4 text-[#334155] max-w-xs truncate">{log.subject}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.status === "delivered"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : log.status === "skipped_opt_out"
                                ? "bg-slate-100 text-slate-700 border border-slate-200"
                                : "bg-red-50 text-red-800 border border-red-200"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-[#64748B] text-[11px] font-mono">
                          {log.provider}
                        </td>
                        <td className="py-2.5 px-4 text-[#64748B] whitespace-nowrap">
                          {new Date(log.sent_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
