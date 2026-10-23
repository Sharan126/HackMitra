import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { KARNATAKA_DISTRICTS } from "@/lib/karnataka-data";
import { getDistrictBySlug, getAllDistrictSummaries } from "@/lib/services/districts";
import { DistrictDetailView } from "@/components/discovery/DistrictDetailView";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return KARNATAKA_DISTRICTS.map((d) => ({
    slug: d.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = getDistrictBySlug(slug);

  if (!data) {
    return {
      title: "District Not Found | HackMitra",
    };
  }

  const { district, discoveredEvents } = data;
  return {
    title: `${district.name} Hackathons (${district.kannadaName}) | HackMitra`,
    description: `Discover verified hackathons, VTU engineering circulars, and incubation sprints in ${district.name}, ${district.division} Division, Karnataka. ${discoveredEvents.length} events tracked.`,
    openGraph: {
      title: `${district.name} Hackathons (${district.kannadaName}) | HackMitra`,
      description: `Verified hackathon directory for ${district.name}, Karnataka. Monitoring ${district.monitoredCollegesCount} colleges and ${district.nainCentersCount} NAIN incubation hubs.`,
    },
  };
}

export default async function DistrictDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const result = getDistrictBySlug(slug);

  if (!result) {
    notFound();
  }

  const { district, discoveredEvents, openRegistrations, upcomingEvents, closedEvents } = result;

  // Sister districts in the same division (excluding current)
  const allSummaries = getAllDistrictSummaries();
  const sisterDistricts = allSummaries
    .filter((d) => d.division === district.division && d.slug !== district.slug)
    .map((d) => ({
      name: d.name,
      slug: d.slug,
      kannadaName: d.kannadaName,
      hackathonCount: d.hackathonCount,
    }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <DistrictDetailView
        district={district}
        discoveredEvents={discoveredEvents}
        openRegistrations={openRegistrations}
        upcomingEvents={upcomingEvents}
        closedEvents={closedEvents}
        sisterDistricts={sisterDistricts}
      />
    </div>
  );
}
