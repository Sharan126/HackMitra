"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { KARNATAKA_DISTRICTS } from "@/lib/karnataka-data";
import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  Building,
  MapPin,
  Calendar,
  ExternalLink,
  Sparkles,
  Info,
} from "lucide-react";

export default function SubmitHackathonPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    organizer: "",
    organizerType: "college",
    districtId: "bengaluru-urban",
    venue: "",
    mode: "in_person",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    isFree: true,
    feeAmount: "",
    prizePool: "",
    registrationUrl: "",
    sourceProofUrl: "",
    submitterEmail: "",
    submitterRole: "student_lead",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate server action submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#142D4E] hover:text-[#2563EB] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Karnataka Hackathon Radar</span>
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-md border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#142D4E] mb-2">
          <ShieldCheck className="w-4 h-4 text-[#16805D]" />
          <span>Institutional Verification Gate</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#142D4E] mb-2">
          Submit a Karnataka Hackathon
        </h1>
        <p className="text-sm text-[#475569] leading-relaxed max-w-2xl">
          Help students across all 31 districts discover your technical event. All submissions are verified against official institutional circulars and active registration links before appearing on the public directory.
        </p>

        <div className="mt-4 pt-4 border-t border-[#F1F5F9] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#64748B]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16805D]" />
            <span>Zero listing fee</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            <span>&lt; 12 hr review SLA</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
            <span>Proof URL required</span>
          </div>
        </div>
      </div>

      {submitted ? (
        <div className="bg-white rounded-md border border-[#A7F3D0] p-8 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center mx-auto mb-4 text-[#16805D]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#0F172A] tracking-tight mb-2">
            Event Submitted for Verification
          </h2>
          <p className="text-sm text-[#475569] leading-relaxed mb-6">
            Thank you! Our moderators will test the registration link, inspect the institutional circular proof, and publish the verified badge within 12 hours.
          </p>
          <div className="flex justify-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSubmitted(false)}
            >
              Submit Another Event
            </Button>
            <Link href="/">
              <Button variant="primary" size="sm">
                Return to Directory
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Event Identity */}
          <div className="bg-white rounded-md border border-[#E2E8F0] p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] border-b border-[#F1F5F9] pb-2">
              1. Event & Organizer Identity
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                Hackathon Title *
              </label>
              <Input
                required
                placeholder="e.g. KLE Tech Innovate 2026 or HackVerse 5.0"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Organizer / College Name *
                </label>
                <Input
                  required
                  placeholder="e.g. NITK Surathkal, PDA College Kalaburagi"
                  leftIcon={<Building className="w-4 h-4" />}
                  value={formData.organizer}
                  onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Organizer Type *
                </label>
                <Select
                  value={formData.organizerType}
                  onChange={(e) => setFormData({ ...formData, organizerType: e.target.value })}
                >
                  <option value="college">VTU / Engineering College</option>
                  <option value="university">Autonomous University</option>
                  <option value="government_ktech">KDEM / K-Tech / NAIN Center</option>
                  <option value="incubator">Incubator / Accelerator</option>
                  <option value="student_club">Student Developer Club / GDG</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Karnataka District * (All 31 Districts Supported)
                </label>
                <Select
                  value={formData.districtId}
                  onChange={(e) => setFormData({ ...formData, districtId: e.target.value })}
                  leftIcon={<MapPin className="w-4 h-4" />}
                >
                  {KARNATAKA_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.kannadaName})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Venue / Location *
                </label>
                <Input
                  required
                  placeholder="e.g. Main Auditorium, College Campus or Online"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Event Format *
                </label>
                <Select
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                >
                  <option value="in_person">In-Person</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="online">Online</option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Total Prize Pool (INR)
                </label>
                <Input
                  placeholder="e.g. ₹2,00,000"
                  value={formData.prizePool}
                  onChange={(e) => setFormData({ ...formData, prizePool: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Registration Fee
                </label>
                <div className="flex items-center gap-3 h-10 px-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="feeType"
                      checked={formData.isFree}
                      onChange={() => setFormData({ ...formData, isFree: true, feeAmount: "" })}
                    />
                    <span>Free Entry</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="feeType"
                      checked={!formData.isFree}
                      onChange={() => setFormData({ ...formData, isFree: false })}
                    />
                    <span>Paid</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Dates & Deadlines */}
          <div className="bg-white rounded-md border border-[#E2E8F0] p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] border-b border-[#F1F5F9] pb-2">
              2. Timeline & Deadlines
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Registration Deadline *
                </label>
                <Input
                  type="date"
                  required
                  value={formData.registrationDeadline}
                  onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Event Start Date *
                </label>
                <Input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Event End Date *
                </label>
                <Input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Verification Proof URLs */}
          <div className="bg-white rounded-md border border-[#E2E8F0] p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] border-b border-[#F1F5F9] pb-2">
              3. Verification & Official Links
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                Official Registration URL * (Devfolio, Unstop, or College Portal)
              </label>
              <Input
                type="url"
                required
                placeholder="https://..."
                leftIcon={<ExternalLink className="w-4 h-4" />}
                value={formData.registrationUrl}
                onChange={(e) => setFormData({ ...formData, registrationUrl: e.target.value })}
                helperText="Must be a live, working registration form or portal."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                Institutional Proof URL * (Official circular PDF, website link, or public post)
              </label>
              <Input
                type="url"
                required
                placeholder="https://nie.ac.in/circulars/hackathon.pdf"
                leftIcon={<ShieldCheck className="w-4 h-4 text-[#16805D]" />}
                value={formData.sourceProofUrl}
                onChange={(e) => setFormData({ ...formData, sourceProofUrl: e.target.value })}
                helperText="Moderators use this URL to verify that the event is authentic before approving."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Your Official Email *
                </label>
                <Input
                  type="email"
                  required
                  placeholder="studentlead@college.edu.in"
                  value={formData.submitterEmail}
                  onChange={(e) => setFormData({ ...formData, submitterEmail: e.target.value })}
                  helperText="Used only if we need clarification during verification."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Your Affiliation *
                </label>
                <Select
                  value={formData.submitterRole}
                  onChange={(e) => setFormData({ ...formData, submitterRole: e.target.value })}
                >
                  <option value="student_lead">Student Organizer / Club Lead</option>
                  <option value="faculty_coordinator">Faculty Coordinator / HOD</option>
                  <option value="nain_coordinator">NAIN / Incubator Coordinator</option>
                  <option value="participant">Participant Submitting Discovered Event</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link href="/">
              <Button type="button" variant="ghost" size="md">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              leftIcon={<ShieldCheck className="w-4 h-4" />}
            >
              Submit for Verification
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
