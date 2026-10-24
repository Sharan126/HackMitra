import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export interface AdminUser {
  email: string;
  role: "admin" | "superadmin";
  name: string;
  issuedAt: number;
}

const ADMIN_SECRET =
  process.env.ADMIN_SECRET_KEY || "hackmitra_karnataka_secure_admin_hmac_secret_2026_key";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@hackmitra.in";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "HackMitra@AdminKarnataka2026!";

export const ADMIN_COOKIE_NAME = "hackmitra_admin_session";

/**
 * Creates an HMAC-SHA256 signed admin session token
 */
export function createAdminToken(user: { email: string; name?: string; role?: "admin" | "superadmin" }): string {
  const header = { alg: "HS256", typ: "JWT" };
  const payload: AdminUser & { exp: number } = {
    email: user.email,
    name: user.name || "HackMitra Moderator",
    role: user.role || "admin",
    issuedAt: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac("sha256", ADMIN_SECRET)
    .update(dataToSign)
    .digest("base64url");

  return `${dataToSign}.${signature}`;
}

/**
 * Validates and decodes an HMAC-SHA256 admin token
 */
export function verifyAdminToken(token: string): AdminUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = crypto
      .createHmac("sha256", ADMIN_SECRET)
      .update(dataToSign)
      .digest("base64url");

    // Timing safe comparison to protect against timing attacks
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8"));

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      email: payload.email,
      name: payload.name,
      role: payload.role,
      issuedAt: payload.issuedAt,
    };
  } catch {
    return null;
  }
}

/**
 * Validates admin credentials (email & password)
 */
export function validateAdminCredentials(email: string, password: string): { isValid: boolean; user?: AdminUser } {
  const isEmailMatch = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isPasswordMatch = password.trim() === ADMIN_PASSWORD;

  if (isEmailMatch && isPasswordMatch) {
    return {
      isValid: true,
      user: {
        email: ADMIN_EMAIL,
        name: "Statewide Moderator",
        role: "admin",
        issuedAt: Math.floor(Date.now() / 1000),
      },
    };
  }

  return { isValid: false };
}

/**
 * Server-side authorization check for administrative requests
 * Inspects:
 *   1. Cookie ('hackmitra_admin_session')
 *   2. Header ('Authorization: Bearer <token>')
 *   3. Header ('x-admin-key: <ADMIN_SECRET_KEY>')
 */
export function getAdminSessionFromRequest(request: NextRequest): { authorized: boolean; user?: AdminUser; error?: string } {
  // 1. Direct Secret Key Header (for scripts or backend services)
  const directKey = request.headers.get("x-admin-key");
  if (directKey && directKey === ADMIN_SECRET) {
    return {
      authorized: true,
      user: {
        email: "system.service@hackmitra.in",
        name: "Service Admin Role",
        role: "superadmin",
        issuedAt: Math.floor(Date.now() / 1000),
      },
    };
  }

  // 2. Bearer Authorization Header
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const verified = verifyAdminToken(token);
    if (verified) {
      return { authorized: true, user: verified };
    }
  }

  // 3. HTTP Cookie
  const cookieToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (cookieToken) {
    const verified = verifyAdminToken(cookieToken);
    if (verified) {
      return { authorized: true, user: verified };
    }
  }

  return {
    authorized: false,
    error: "Unauthorized: Valid administrative session or key required",
  };
}

/**
 * Standard guard to enforce server-side admin authorization in API routes
 */
export function requireAdminAuth(request: NextRequest):
  | { authorized: true; user: AdminUser }
  | { authorized: false; response: NextResponse } {
  const session = getAdminSessionFromRequest(request);

  if (!session.authorized || !session.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: session.error || "Forbidden: Administrator authorization required",
          code: "UNAUTHORIZED_ADMIN",
        },
        { status: 401 }
      ),
    };
  }

  return { authorized: true, user: session.user };
}
