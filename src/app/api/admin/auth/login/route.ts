import { NextRequest, NextResponse } from "next/server";
import {
  validateAdminCredentials,
  createAdminToken,
  ADMIN_COOKIE_NAME,
} from "@/lib/auth/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const validation = validateAdminCredentials(email, password);

    if (!validation.isValid || !validation.user) {
      return NextResponse.json(
        { success: false, error: "Invalid administrative credentials" },
        { status: 401 }
      );
    }

    const token = createAdminToken(validation.user);

    const response = NextResponse.json({
      success: true,
      message: "Administrator authenticated successfully",
      user: validation.user,
      token,
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 86400 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Authentication failed" },
      { status: 500 }
    );
  }
}
