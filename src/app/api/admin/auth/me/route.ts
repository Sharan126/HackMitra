import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  return NextResponse.json({
    success: true,
    user: auth.user,
  });
}
