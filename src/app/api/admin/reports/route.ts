import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/admin-auth";
import { getAllErrorReports, resolveErrorReport, ReportStatus } from "@/lib/services/error-reports";

export const dynamic = "force-dynamic";

/**
 * Administrative Inaccuracy & Error Reports Management API
 */
export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as ReportStatus | "all" | null;

  try {
    const reports = await getAllErrorReports({ status: status || "all" });
    return NextResponse.json({ success: true, reports });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const { reportId, status, notes } = body;

    if (!reportId || !status) {
      return NextResponse.json(
        { success: false, error: "reportId and status ('resolved' | 'dismissed') are required" },
        { status: 400 }
      );
    }

    const updated = await resolveErrorReport(reportId, {
      status,
      notes: notes || `Moderator marked as ${status}`,
      resolvedBy: auth.user.email,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Error report not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Report ${reportId} marked as ${status}`,
      report: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
