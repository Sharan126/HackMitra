import { NextRequest, NextResponse } from "next/server";
import { getDistrictBySlug, updateDistrictAdministrativeData } from "@/lib/services/districts";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const result = getDistrictBySlug(slug);

  if (!result) {
    return NextResponse.json(
      { error: `District with slug '${slug}' not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: result,
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;

  try {
    const body = await request.json();

    // Basic administrative validation
    const allowedKeys = [
      "monitoredCollegesCount",
      "nainCentersCount",
      "coverageStatus",
      "lastAudited",
      "auditFrequencyHours",
      "keyInstitutions",
      "headquarters",
    ];

    const updates: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid administrative fields provided for update" },
        { status: 400 }
      );
    }

    const updated = await updateDistrictAdministrativeData(slug, updates);

    if (!updated) {
      return NextResponse.json(
        { error: `District with slug '${slug}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `District ${updated.name} administrative directory updated successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request payload or malformed JSON" },
      { status: 400 }
    );
  }
}
