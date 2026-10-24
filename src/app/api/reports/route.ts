import { NextRequest, NextResponse } from "next/server";
import { submitErrorReport, ErrorReportType } from "@/lib/services/error-reports";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hackathonId, hackathonTitle, reporterEmail, reportType, details } = body;

    if (!reporterEmail || !details || !reportType) {
      return NextResponse.json(
        { success: false, error: "Reporter email, report type, and details are required" },
        { status: 400 }
      );
    }

    const report = await submitErrorReport({
      hackathonId,
      hackathonTitle,
      reporterEmail,
      reportType: reportType as ErrorReportType,
      details,
    });

    return NextResponse.json({
      success: true,
      message: "Inaccuracy report submitted successfully. Our moderation team will investigate.",
      reportId: report.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to submit error report" },
      { status: 500 }
    );
  }
}
