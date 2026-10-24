import React from "react";
import { Metadata } from "next";
import { getAllDistrictSummaries, getStatewideDistrictStats } from "../../lib/services/districts";
import { DistrictDirectoryView } from "../../components/discovery/DistrictDirectoryView";

export const metadata: Metadata = {
  title: "All 31 Karnataka Districts | Statewide Hackathon Directory",
  description:
    "Explore hackathons, VTU engineering colleges, and NAIN incubators across all 31 districts of Karnataka. High-fidelity discovery beyond Bengaluru.",
  openGraph: {
    title: "All 31 Karnataka Districts | HackMitra",
    description:
      "Explore hackathons, VTU engineering colleges, and NAIN incubators across all 31 districts of Karnataka. High-fidelity discovery beyond Bengaluru.",
  },
};

export default function DistrictsDirectoryPage() {
  const districts = getAllDistrictSummaries();
  const stats = getStatewideDistrictStats();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <DistrictDirectoryView districts={districts} stats={stats} />
    </div>
  );
}
