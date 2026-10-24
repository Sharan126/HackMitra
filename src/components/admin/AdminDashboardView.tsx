"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck2,
  Clock,
  Layers,
  Server,
  RefreshCw,
  LogOut,
  Edit3,
  Trash2,
  Copy,
  ExternalLink,
  PlusCircle,
  Check,
  X,
  Search,
  Filter,
  AlertCircle,
  Merge,
  MessageSquare,
  Eye,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Hackathon } from "../../types/hackathon";
import { KARNATAKA_DISTRICTS } from "../../lib/karnataka-data";
import { UserErrorReport } from "../../lib/services/error-reports";

export interface AdminDashboardProps {
  currentUser: { email: string; name: string; role: string };
}

export function AdminDashboardView({ currentUser }: AdminDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "queue" | "events" | "stale" | "duplicates" | "sources" | "reports" | "create"
  >("queue");

  // State collections
  const [pendingEvents, setPendingEvents] = useState<Hackathon[]>([]);
  const [allEvents, setAllEvents] = useState<Hackathon[]>([]);
  const [staleEvents, setStaleEvents] = useState<Hackathon[]>([]);
  const [sources, setSources] = useState<Record<string, any>>({});
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [errorReports, setErrorReports] = useState<UserErrorReport[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  // Edit Modal State
  const [editingEvent, setEditingEvent] = useState<Hackathon | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [editReason, setEditReason] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Quick Action Modal State (e.g. Approve/Reject reason prompt)
  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    action: string;
    eventId: string;
    targetStatus?: string;
  } | null>(null);
  const [promptReason, setPromptReason] = useState("");

  // Create Form State
  const [createFormData, setCreateFormData] = useState({
    title: "",
    organizer: "",
    organizerType: "College",
    districtId: "dharwad",
    city: "Hubballi",
    venue: "",
    format: "in_person",
    registrationUrl: "",
    officialWebsiteUrl: "",
    registrationDeadline: "",
    startDate: "",
    endDate: "",
    prizePoolInr: 100000,
    isFree: true,
    registrationFeeInr: 0,
    eligibility: "Open to all engineering students across Karnataka",
    teamSizeMin: 2,
    teamSizeMax: 4,
    reason: "Direct verified campus organizer submission",
  });

  const loadAllData = async () => {
    setIsLoading(true);
    setActionErrorMessage(null);
    try {
      // 1. Fetch Review Queue (pending_verification)
      const qRes = await fetch("/api/admin/events?verificationStatus=pending_verification");
      const qData = await qRes.json();
      if (qData.success) setPendingEvents(qData.hackathons || []);

      // 2. Fetch Stale Events
      const sRes = await fetch("/api/admin/events?currentStatus=stale");
      const sData = await sRes.json();
      if (sData.success) setStaleEvents(sData.hackathons || []);

      // 3. Fetch All Events
      const aRes = await fetch("/api/admin/events?pageSize=50");
      const aData = await aRes.json();
      if (aData.success) setAllEvents(aData.hackathons || []);

      // 4. Fetch Sources
      const srcRes = await fetch("/api/admin/sources");
      const srcData = await srcRes.json();
      if (srcData.success) setSources(srcData.sources || {});

      // 5. Fetch Duplicates
      const dupRes = await fetch("/api/admin/duplicates");
      const dupData = await dupRes.json();
      if (dupData.success) setDuplicates(dupData.duplicateGroups || []);

      // 6. Fetch Error Reports
      const repRes = await fetch("/api/admin/reports");
      const repData = await repRes.json();
      if (repData.success) setErrorReports(repData.reports || []);
    } catch (err: any) {
      setActionErrorMessage(err.message || "Failed to load administrative data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Approve or Reject from Queue
  const executeQueueAction = async () => {
    if (!promptModal) return;
    if (!promptReason.trim()) {
      alert("A specific reason is mandatory for the audit trail.");
      return;
    }

    try {
      const res = await fetch(`/api/admin/events/${promptModal.eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: promptModal.action,
          reason: promptReason,
          currentStatus: promptModal.targetStatus,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setActionSuccessMessage(`Successfully updated event (${promptModal.action}). Audit log recorded.`);
        setPromptModal(null);
        setPromptReason("");
        await loadAllData();
      } else {
        setActionErrorMessage(json.error || "Action failed");
      }
    } catch (err: any) {
      setActionErrorMessage(err.message);
    }
  };

  // Open Edit Modal
  const openEditModal = (h: Hackathon) => {
    setEditingEvent(h);
    setEditFormData({
      title: h.title,
      organizer: h.organizer,
      city: h.city,
      venue: h.venue,
      format: h.format,
      registrationUrl: h.registrationUrl,
      officialWebsiteUrl: h.officialWebsiteUrl,
      registrationDeadline: h.registrationDeadline,
      startDate: h.startDate,
      endDate: h.endDate,
      currentStatus: h.registrationStatus,
      prizePoolInr: h.prizePoolInr || 0,
      isFree: h.isFree,
      registrationFeeInr: h.registrationFeeInr || 0,
      eligibility: h.eligibility || "",
    });
    setEditReason("");
  };

  // Save Event Edits
  const handleSaveEdit = async () => {
    if (!editingEvent) return;
    if (!editReason.trim()) {
      alert("Please enter the reason for this edit (mandatory for audit trail).");
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const res = await fetch(`/api/admin/events/${editingEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit",
          reason: editReason,
          ...editFormData,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setActionSuccessMessage(`Event '${editingEvent.title}' updated successfully. Audit history logged.`);
        setEditingEvent(null);
        await loadAllData();
      } else {
        setActionErrorMessage(json.error || "Failed to update event");
      }
    } catch (err: any) {
      setActionErrorMessage(err.message);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Resolve Duplicate Merge
  const handleMergeDuplicate = async (canonicalId: string, duplicateId: string) => {
    const reason = prompt("Enter the reason for merging duplicate records (e.g. 'Duplicate registration URL'):");
    if (!reason) return;

    try {
      const res = await fetch("/api/admin/duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canonicalId, duplicateId, reason }),
      });
      const json = await res.json();
      if (json.success) {
        setActionSuccessMessage("Duplicate record merged into canonical hackathon successfully.");
        await loadAllData();
      } else {
        setActionErrorMessage(json.error || "Failed to merge duplicate");
      }
    } catch (err: any) {
      setActionErrorMessage(err.message);
    }
  };

  // Toggle Source Status
  const handleToggleSource = async (sourceId: string, currentActive: boolean) => {
    const reason = prompt(
      `Enter reason for ${currentActive ? "disabling" : "enabling"} source '${sourceId}':`
    );
    if (!reason) return;

    try {
      const res = await fetch("/api/admin/sources", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId, isActive: !currentActive, reason }),
      });
      const json = await res.json();
      if (json.success) {
        setActionSuccessMessage(`Source '${sourceId}' status updated.`);
        await loadAllData();
      } else {
        setActionErrorMessage(json.error || "Failed to update source");
      }
    } catch (err: any) {
      setActionErrorMessage(err.message);
    }
  };

  // Resolve Error Report
  const handleResolveReport = async (reportId: string, status: "resolved" | "dismissed") => {
    const notes = prompt(`Enter resolution explanation for marking as ${status}:`);
    if (!notes) return;

    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, status, notes }),
      });
      const json = await res.json();
      if (json.success) {
        setActionSuccessMessage(`Report ${reportId} marked as ${status}.`);
        await loadAllData();
      } else {
        setActionErrorMessage(json.error || "Failed to resolve report");
      }
    } catch (err: any) {
      setActionErrorMessage(err.message);
    }
  };

  // Submit Manual Event Creation
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.reason.trim()) {
      alert("Please provide the reason for manual submission.");
      return;
    }

    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createFormData),
      });

      const json = await res.json();
      if (json.success) {
        setActionSuccessMessage(`Hackathon '${createFormData.title}' created and verified!`);
        setActiveTab("events");
        await loadAllData();
      } else {
        setActionErrorMessage(json.error || "Failed to create hackathon");
      }
    } catch (err: any) {
      setActionErrorMessage(err.message);
    }
  };

  const filteredEvents = allEvents.filter(
    (e) =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.districtName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Admin Header Bar */}
      <div className="bg-[#142D4E] text-white rounded-md p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#93C5FD] mb-1">
            <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
            <span>Authenticated Moderator Console</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            HackMitra Administrative Dashboard
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Logged in as <span className="text-white font-semibold">{currentUser.email}</span> &bull; Role:{" "}
            <span className="uppercase text-[#38BDF8] font-bold">{currentUser.role}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAllData}
            disabled={isLoading}
            className="text-xs border-[#334155] text-white hover:bg-[#1E293B]"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-xs border-[#EF4444] text-[#EF4444] hover:bg-[#450A0A]"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            Logout
          </Button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab("queue")}
          className={`cursor-pointer p-4 rounded-md border transition-all ${
            activeTab === "queue"
              ? "bg-[#EFF6FF] border-[#3B82F6] ring-1 ring-[#3B82F6]"
              : "bg-white border-[#E2E8F0] hover:border-[#94A3B8]"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB] block">
            Review Queue
          </span>
          <p className="text-2xl font-black text-[#142D4E] mt-1">{pendingEvents.length}</p>
          <span className="text-[11px] text-[#64748B]">Pending verification</span>
        </div>

        <div
          onClick={() => setActiveTab("stale")}
          className={`cursor-pointer p-4 rounded-md border transition-all ${
            activeTab === "stale"
              ? "bg-[#FEF2F2] border-[#EF4444] ring-1 ring-[#EF4444]"
              : "bg-white border-[#E2E8F0] hover:border-[#94A3B8]"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#DC2626] block">
            Stale Events
          </span>
          <p className="text-2xl font-black text-[#142D4E] mt-1">{staleEvents.length}</p>
          <span className="text-[11px] text-[#64748B]">&gt;48h overdue checks</span>
        </div>

        <div
          onClick={() => setActiveTab("duplicates")}
          className={`cursor-pointer p-4 rounded-md border transition-all ${
            activeTab === "duplicates"
              ? "bg-[#FFFBEB] border-[#F59E0B] ring-1 ring-[#F59E0B]"
              : "bg-white border-[#E2E8F0] hover:border-[#94A3B8]"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#D97706] block">
            Duplicate Clusters
          </span>
          <p className="text-2xl font-black text-[#142D4E] mt-1">{duplicates.length}</p>
          <span className="text-[11px] text-[#64748B]">Resolvable candidates</span>
        </div>

        <div
          onClick={() => setActiveTab("reports")}
          className={`cursor-pointer p-4 rounded-md border transition-all ${
            activeTab === "reports"
              ? "bg-[#F5F3FF] border-[#8B5CF6] ring-1 ring-[#8B5CF6]"
              : "bg-white border-[#E2E8F0] hover:border-[#94A3B8]"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED] block">
            User Reports
          </span>
          <p className="text-2xl font-black text-[#142D4E] mt-1">
            {errorReports.filter((r) => r.status === "pending").length}
          </p>
          <span className="text-[11px] text-[#64748B]">Student inquiries</span>
        </div>
      </div>

      {/* Action Messages */}
      {actionSuccessMessage && (
        <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded text-xs text-[#065F46] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-[#065F46] hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionErrorMessage && (
        <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded text-xs text-[#991B1B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#EF4444]" />
            <span>{actionErrorMessage}</span>
          </div>
          <button onClick={() => setActionErrorMessage(null)} className="text-[#991B1B] hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-[#CBD5E1] flex items-center gap-2 overflow-x-auto text-xs font-bold">
        {[
          { key: "queue", label: `Review Queue (${pendingEvents.length})` },
          { key: "events", label: `All Events (${allEvents.length})` },
          { key: "stale", label: `Stale Review (${staleEvents.length})` },
          { key: "duplicates", label: `Duplicates (${duplicates.length})` },
          { key: "sources", label: "Source Controls" },
          { key: "reports", label: `Error Reports (${errorReports.length})` },
          { key: "create", label: "+ Manual Submit" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`py-2.5 px-4 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "border-[#2563EB] text-[#2563EB] bg-[#EFF6FF]/40"
                : "border-transparent text-[#64748B] hover:text-[#142D4E]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: REVIEW QUEUE */}
      {activeTab === "queue" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#142D4E] uppercase tracking-wider">
              Pending Event Submissions Awaiting Moderator Authentication
            </h2>
            <span className="text-xs text-[#64748B]">
              Submissions require source verification before public listing
            </span>
          </div>

          {pendingEvents.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded p-8 text-center text-xs text-[#64748B]">
              <CheckCircle2 className="w-8 h-8 text-[#16805D] mx-auto mb-2" />
              <p className="font-bold text-[#142D4E]">Review queue is clear!</p>
              <p className="mt-1">All campus scout submissions have been authenticated.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white border border-[#BFDBFE] rounded-md p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] mr-2">
                        Pending Verification
                      </span>
                      <span className="text-xs font-semibold text-[#142D4E]">{event.districtName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          setPromptModal({
                            isOpen: true,
                            title: `Approve '${event.title}'`,
                            action: "approve",
                            eventId: event.id,
                            targetStatus: "open",
                          })
                        }
                        className="text-xs bg-[#16805D] hover:bg-[#126649] text-white"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Approve & Publish
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPromptModal({
                            isOpen: true,
                            title: `Reject '${event.title}'`,
                            action: "reject",
                            eventId: event.id,
                            targetStatus: "cancelled",
                          })
                        }
                        className="text-xs border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2]"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-black text-base text-[#142D4E]">{event.title}</h3>
                    <p className="text-xs text-[#64748B]">
                      Organizer: <span className="font-semibold text-[#334155]">{event.organizer}</span> &bull; Venue:{" "}
                      <span className="font-semibold text-[#334155]">{event.venue}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#F8FAFC] p-3 rounded border border-[#E2E8F0]">
                    <div>
                      <span className="text-[#64748B] block text-[11px]">Official / Proof URL:</span>
                      <a
                        href={event.officialWebsiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2563EB] hover:underline flex items-center gap-1 font-medium truncate"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        {event.officialWebsiteUrl}
                      </a>
                    </div>

                    <div>
                      <span className="text-[#64748B] block text-[11px]">Registration Form URL:</span>
                      <a
                        href={event.registrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2563EB] hover:underline flex items-center gap-1 font-medium truncate"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        {event.registrationUrl}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL HACKATHONS & EDITOR */}
      {activeTab === "events" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search event title, organizer, city, or district..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#CBD5E1] rounded focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <span className="text-xs font-semibold text-[#64748B]">
              Showing {filteredEvents.length} events
            </span>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-md overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
                  <th className="py-2.5 px-4 font-bold">Event Title</th>
                  <th className="py-2.5 px-4 font-bold">District / City</th>
                  <th className="py-2.5 px-4 font-bold">Status</th>
                  <th className="py-2.5 px-4 font-bold">Deadline</th>
                  <th className="py-2.5 px-4 font-bold">Verification</th>
                  <th className="py-2.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4 font-bold text-[#142D4E] max-w-xs">
                      <div className="truncate">{event.title}</div>
                      <div className="text-[11px] font-normal text-[#64748B] truncate">{event.organizer}</div>
                    </td>
                    <td className="py-3 px-4 text-[#334155]">
                      <div>{event.districtName}</div>
                      <div className="text-[11px] text-[#64748B]">{event.city}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#EFF6FF] text-[#1D4ED8]">
                        {event.registrationStatus.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#334155]">{event.registrationDeadline}</td>
                    <td className="py-3 px-4">
                      <span className="text-[#16805D] font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {event.verificationStatus || "verified"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(event)}
                          className="text-[11px] h-7 px-2 border-[#CBD5E1] text-[#142D4E] hover:bg-[#F1F5F9]"
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STALE EVENTS REVIEW */}
      {activeTab === "stale" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#142D4E] uppercase tracking-wider">
              Overdue Verification Records Requiring Reverification
            </h2>
            <span className="text-xs text-[#64748B]">
              Records with verification older than 48 hours
            </span>
          </div>

          {staleEvents.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded p-8 text-center text-xs text-[#64748B]">
              <CheckCircle2 className="w-8 h-8 text-[#16805D] mx-auto mb-2" />
              <p className="font-bold text-[#142D4E]">Zero Stale Events!</p>
              <p className="mt-1">All events have active verification records within the 48-hour SLA.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {staleEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white border border-[#FCA5A5] rounded-md p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="font-bold text-sm text-[#142D4E]">{event.title}</h3>
                    <p className="text-xs text-[#64748B]">
                      {event.districtName} &bull; Deadline: {event.registrationDeadline}
                    </p>
                    <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
                      Status: STALE &bull; Reason: {event.verificationNotes || "Verification overdue >48 hours"}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(event)}
                    className="text-xs border-[#2563EB] text-[#2563EB] hover:bg-[#EFF6FF] shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    Review & Confirm Status
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DUPLICATE RESOLUTION */}
      {activeTab === "duplicates" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#142D4E] uppercase tracking-wider">
              Duplicate Detection & Canonical Resolution
            </h2>
            <span className="text-xs text-[#64748B]">
              Clusters sharing matching registration URLs or title & district
            </span>
          </div>

          {duplicates.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded p-8 text-center text-xs text-[#64748B]">
              <CheckCircle2 className="w-8 h-8 text-[#16805D] mx-auto mb-2" />
              <p className="font-bold text-[#142D4E]">Zero Duplicates Found</p>
              <p className="mt-1">All hackathons have unique canonical URLs and slugs.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {duplicates.map((group, idx) => (
                <div key={idx} className="bg-white border border-[#FDE68A] rounded-md p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#D97706] flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      Duplicate Cluster ({group.events.length} records)
                    </span>
                    <span className="text-[11px] text-[#64748B]">{group.reason}</span>
                  </div>

                  <div className="divide-y divide-[#F1F5F9] border border-[#E2E8F0] rounded">
                    {group.events.map((e: any, eIdx: number) => (
                      <div key={e.id} className="p-3 flex items-center justify-between gap-4 text-xs">
                        <div>
                          <span className="font-bold text-[#142D4E]">{e.title}</span>
                          <span className="text-[#64748B] block text-[11px]">
                            ID: {e.id} &bull; District: {e.district_name} &bull; URL: {e.registration_url}
                          </span>
                        </div>

                        {eIdx > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMergeDuplicate(group.events[0].id, e.id)}
                            className="text-xs border-[#D97706] text-[#D97706] hover:bg-[#FFFBEB] shrink-0"
                          >
                            <Merge className="w-3.5 h-3.5 mr-1" />
                            Merge into Primary
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SOURCE CONTROLS */}
      {activeTab === "sources" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#142D4E] uppercase tracking-wider">
              Source Feeds & Scraper Controls
            </h2>
            <span className="text-xs text-[#64748B]">
              Enable or disable discovery sources with recorded moderator rationale
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(sources).map(([key, item]: any) => (
              <div key={key} className="bg-white border border-[#E2E8F0] rounded-md p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F1F5F9] text-[#334155]">
                      {item.config?.sourceType}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        item.status === "healthy"
                          ? "bg-[#DCFCE7] text-[#166534]"
                          : item.status === "failing"
                          ? "bg-[#FEE2E2] text-[#991B1B]"
                          : "bg-[#F1F5F9] text-[#475569]"
                      }`}
                    >
                      {item.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-[#142D4E]">{item.config?.name}</h3>
                  <p className="text-xs text-[#64748B] mt-1">{item.config?.coverageScope}</p>

                  {item.lastError && (
                    <div className="mt-2 p-2 bg-[#FEF2F2] border border-[#FCA5A5] rounded text-[11px] text-[#991B1B]">
                      <span className="font-bold">Error:</span> {item.lastError}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
                  <span className="text-[11px] text-[#64748B]">
                    Status: <strong className="text-[#0F172A]">{item.config?.isActive ? "Active" : "Disabled"}</strong>
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleSource(key, item.config?.isActive ?? true)}
                    className="text-xs h-7 border-[#CBD5E1]"
                  >
                    {item.config?.isActive ? "Disable Source" : "Enable Source"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: USER ERROR REPORTS */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#142D4E] uppercase tracking-wider">
              Student & User Inaccuracy Reports
            </h2>
            <span className="text-xs text-[#64748B]">
              Community alerts regarding expired forms, dead links, or incorrect dates
            </span>
          </div>

          {errorReports.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded p-8 text-center text-xs text-[#64748B]">
              <CheckCircle2 className="w-8 h-8 text-[#16805D] mx-auto mb-2" />
              <p className="font-bold text-[#142D4E]">Zero Reports Pending</p>
              <p className="mt-1">No community inaccuracy reports are currently open.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {errorReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white border border-[#E2E8F0] rounded-md p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5]">
                      {report.reportType.replace("_", " ")}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        report.status === "resolved"
                          ? "bg-[#DCFCE7] text-[#166534]"
                          : report.status === "pending"
                          ? "bg-[#FEF3C7] text-[#92400E]"
                          : "bg-[#F1F5F9] text-[#475569]"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#142D4E] font-bold">{report.details}</p>
                  <p className="text-[11px] text-[#64748B]">
                    Reporter: {report.reporterEmail} &bull; Target: {report.hackathonTitle || "General"}
                  </p>

                  {report.status === "pending" && (
                    <div className="pt-2 flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleResolveReport(report.id, "resolved")}
                        className="text-xs h-7 bg-[#16805D] text-white"
                      >
                        Resolve & Close
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveReport(report.id, "dismissed")}
                        className="text-xs h-7 border-[#94A3B8] text-[#64748B]"
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}

                  {report.resolutionNotes && (
                    <div className="mt-1 p-2 bg-[#F8FAFC] rounded text-[11px] text-[#475569] border border-[#E2E8F0]">
                      <span className="font-bold">Resolution Note:</span> {report.resolutionNotes} (by {report.resolvedBy})
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: MANUAL EVENT CREATION */}
      {activeTab === "create" && (
        <div className="bg-white border border-[#E2E8F0] rounded-md p-6 shadow-xs max-w-3xl space-y-4">
          <h2 className="text-base font-bold text-[#142D4E]">
            Direct Moderator Event Creation & Verification
          </h2>
          <p className="text-xs text-[#64748B]">
            Creates a pre-verified hackathon record. All fields are authenticated and logged into the audit trail.
          </p>

          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[#142D4E] mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                  placeholder="e.g. KLE Tech Innovate 2026"
                  className="w-full p-2 border border-[#CBD5E1] rounded"
                />
              </div>

              <div>
                <label className="block font-bold text-[#142D4E] mb-1">Organizer Institution *</label>
                <input
                  type="text"
                  required
                  value={createFormData.organizer}
                  onChange={(e) => setCreateFormData({ ...createFormData, organizer: e.target.value })}
                  placeholder="e.g. KLE Technological University"
                  className="w-full p-2 border border-[#CBD5E1] rounded"
                />
              </div>

              <div>
                <label className="block font-bold text-[#142D4E] mb-1">Karnataka District *</label>
                <select
                  value={createFormData.districtId}
                  onChange={(e) => setCreateFormData({ ...createFormData, districtId: e.target.value })}
                  className="w-full p-2 border border-[#CBD5E1] rounded bg-white"
                >
                  {KARNATAKA_DISTRICTS.map((d) => (
                    <option key={d.slug} value={d.slug}>
                      {d.name} ({d.kannadaName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#142D4E] mb-1">City / Town *</label>
                <input
                  type="text"
                  required
                  value={createFormData.city}
                  onChange={(e) => setCreateFormData({ ...createFormData, city: e.target.value })}
                  placeholder="e.g. Hubballi"
                  className="w-full p-2 border border-[#CBD5E1] rounded"
                />
              </div>

              <div>
                <label className="block font-bold text-[#142D4E] mb-1">Registration Deadline *</label>
                <input
                  type="datetime-local"
                  required
                  value={createFormData.registrationDeadline}
                  onChange={(e) => setCreateFormData({ ...createFormData, registrationDeadline: e.target.value })}
                  className="w-full p-2 border border-[#CBD5E1] rounded"
                />
              </div>

              <div>
                <label className="block font-bold text-[#142D4E] mb-1">Start Date *</label>
                <input
                  type="datetime-local"
                  required
                  value={createFormData.startDate}
                  onChange={(e) => setCreateFormData({ ...createFormData, startDate: e.target.value })}
                  className="w-full p-2 border border-[#CBD5E1] rounded"
                />
              </div>

              <div>
                <label className="block font-bold text-[#142D4E] mb-1">Official Registration Link *</label>
                <input
                  type="url"
                  required
                  value={createFormData.registrationUrl}
                  onChange={(e) => setCreateFormData({ ...createFormData, registrationUrl: e.target.value })}
                  placeholder="https://devfolio.co/..."
                  className="w-full p-2 border border-[#CBD5E1] rounded"
                />
              </div>

              <div>
                <label className="block font-bold text-[#142D4E] mb-1">Source Proof URL *</label>
                <input
                  type="url"
                  required
                  value={createFormData.officialWebsiteUrl}
                  onChange={(e) => setCreateFormData({ ...createFormData, officialWebsiteUrl: e.target.value })}
                  placeholder="Official college notification or circular link"
                  className="w-full p-2 border border-[#CBD5E1] rounded"
                />
              </div>

              <div>
                <label className="block font-bold text-[#142D4E] mb-1">Verified Prize Pool (INR)</label>
                <input
                  type="number"
                  value={createFormData.prizePoolInr}
                  onChange={(e) => setCreateFormData({ ...createFormData, prizePoolInr: parseInt(e.target.value, 10) || 0 })}
                  className="w-full p-2 border border-[#CBD5E1] rounded"
                />
              </div>

              <div>
                <label className="block font-bold text-[#142D4E] mb-1">Participation Format</label>
                <select
                  value={createFormData.format}
                  onChange={(e) => setCreateFormData({ ...createFormData, format: e.target.value })}
                  className="w-full p-2 border border-[#CBD5E1] rounded bg-white"
                >
                  <option value="in_person">In-Person (Campus Hackathon)</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="online">Online / Virtual</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#142D4E] mb-1">
                Mandatory Moderator Rationale (Why is this event being added?) *
              </label>
              <textarea
                required
                rows={2}
                value={createFormData.reason}
                onChange={(e) => setCreateFormData({ ...createFormData, reason: e.target.value })}
                placeholder="State the verification source, circular verification, and rationale..."
                className="w-full p-2 border border-[#CBD5E1] rounded"
              />
            </div>

            <Button type="submit" variant="primary" size="md" className="bg-[#142D4E] text-white text-xs font-bold">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Publish Verified Hackathon
            </Button>
          </form>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-[#CBD5E1] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-bold text-sm text-[#142D4E]">
                Edit Hackathon: <span className="text-[#2563EB]">{editingEvent.title}</span>
              </h3>
              <button onClick={() => setEditingEvent(null)} className="text-[#64748B] hover:text-[#0F172A]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-[#142D4E] mb-1">Title</label>
                <input
                  type="text"
                  value={editFormData.title || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full p-2 border border-[#CBD5E1] rounded"
                />
              </div>

              <div>
                <label className="block font-bold text-[#142D4E] mb-1">Organizer</label>
                <input
                  type="text"
                  value={editFormData.organizer || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, organizer: e.target.value })}
                  className="w-full p-2 border border-[#CBD5E1] rounded"
                />
              </div>

              <div>
                <label className="block font-bold text-[#142D4E] mb-1">Registration Deadline</label>
                <input
                  type="text"
                  value={editFormData.registrationDeadline || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, registrationDeadline: e.target.value })}
                  className="w-full p-2 border border-[#CBD5E1] rounded"
                />
              </div>

              <div>
                <label className="block font-bold text-[#142D4E] mb-1">Registration Status Override</label>
                <select
                  value={editFormData.currentStatus || "open"}
                  onChange={(e) => setEditFormData({ ...editFormData, currentStatus: e.target.value })}
                  className="w-full p-2 border border-[#CBD5E1] rounded bg-white font-bold text-[#2563EB]"
                >
                  <option value="open">Registration Open</option>
                  <option value="closing_soon">Closing Soon</option>
                  <option value="deadline_today">Deadline Today</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="closed">Registration Closed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="stale">Stale (Needs Reverification)</option>
                  <option value="unverified">Unverified (Dead Link)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#142D4E] mb-1">Registration URL</label>
                <input
                  type="url"
                  value={editFormData.registrationUrl || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, registrationUrl: e.target.value })}
                  className="w-full p-2 border border-[#CBD5E1] rounded"
                />
              </div>

              <div>
                <label className="block font-bold text-[#142D4E] mb-1">Official Website / Proof URL</label>
                <input
                  type="url"
                  value={editFormData.officialWebsiteUrl || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, officialWebsiteUrl: e.target.value })}
                  className="w-full p-2 border border-[#CBD5E1] rounded"
                />
              </div>

              <div>
                <label className="block font-bold text-[#142D4E] mb-1">Verified Prize Pool (INR)</label>
                <input
                  type="number"
                  value={editFormData.prizePoolInr || 0}
                  onChange={(e) => setEditFormData({ ...editFormData, prizePoolInr: e.target.value })}
                  className="w-full p-2 border border-[#CBD5E1] rounded"
                />
              </div>

              <div>
                <label className="block font-bold text-[#142D4E] mb-1">Venue</label>
                <input
                  type="text"
                  value={editFormData.venue || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, venue: e.target.value })}
                  className="w-full p-2 border border-[#CBD5E1] rounded"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[#F1F5F9]">
              <label className="block text-xs font-bold text-[#DC2626] uppercase tracking-wider mb-1">
                Mandatory Audit Rationale (Why is this record being changed?) *
              </label>
              <textarea
                required
                rows={2}
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="e.g. Organizer extended deadline per circular; corrected entry fee..."
                className="w-full p-2 border border-[#EF4444] rounded text-xs focus:ring-1 focus:ring-[#EF4444]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingEvent(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveEdit}
                disabled={isSubmittingEdit}
                className="text-xs bg-[#16805D] text-white font-bold"
              >
                {isSubmittingEdit ? "Saving Audit..." : "Save Changes & Log Audit"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ACTION PROMPT MODAL */}
      {promptModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-[#CBD5E1] w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-sm text-[#142D4E]">{promptModal.title}</h3>

            <div>
              <label className="block text-xs font-bold text-[#142D4E] mb-1">
                Moderator Audit Rationale *
              </label>
              <textarea
                required
                rows={3}
                value={promptReason}
                onChange={(e) => setPromptReason(e.target.value)}
                placeholder="Enter mandatory rationale (e.g. 'Verified college official circular', 'Dead Google Form link')..."
                className="w-full p-2 border border-[#CBD5E1] rounded text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setPromptModal(null)} className="text-xs">
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={executeQueueAction}
                className="text-xs bg-[#142D4E] text-white font-bold"
              >
                Confirm & Log Audit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
