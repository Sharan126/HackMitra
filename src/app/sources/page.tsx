import React from "react";
import { Metadata } from "next";
import { SourcesDashboard } from "../../components/sources/SourcesDashboard";
import { automationScheduler } from "../../lib/scheduler/worker";

export const metadata: Metadata = {
  title: "Sources & Verification Health | HackMitra",
  description:
    "Transparency charter and automated health status across all Karnataka hackathon discovery channels and institutional sources.",
};

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  let initialHealth = null;
  try {
    initialHealth = await automationScheduler.getSystemHealth();
  } catch (err) {
    console.warn("Could not pre-render initial system health:", err);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <SourcesDashboard initialData={initialHealth} />
    </div>
  );
}
