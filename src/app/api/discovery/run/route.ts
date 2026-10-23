import { NextRequest, NextResponse } from "next/server";
import { discoveryEngine } from "@/lib/discovery/engine";
import { KNOWN_SOURCES } from "@/lib/discovery/registry";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerSupabaseClient();
  let recentRuns: any[] = [];
  let sourcesList: any[] = Object.values(KNOWN_SOURCES);

  if (supabase) {
    const { data: runs } = await supabase
      .from("discovery_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(10);
    recentRuns = runs || [];

    const { data: dbSources } = await supabase
      .from("event_sources")
      .select("*")
      .order("reliability_score", { ascending: false });

    if (dbSources && dbSources.length > 0) {
      sourcesList = dbSources as any;
    }
  }

  return NextResponse.json({
    success: true,
    engine: {
      registeredAdapters: discoveryEngine.getRegisteredAdapters(),
      sources: sourcesList,
      recentRuns,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const sourceId = body.sourceId || "devfolio";
    const maxPages = Number(body.maxPages) || 1;

    const report = await discoveryEngine.runSourceDiscovery(sourceId, { maxPages });

    return NextResponse.json({
      success: report.status === "completed",
      report,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute discovery run" },
      { status: 500 }
    );
  }
}
