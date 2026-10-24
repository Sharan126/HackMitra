import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig, assertServerOnly } from "../supabase/config";
import { Database } from "@/types/database.types";

/**
 * Server-Side User Authentication & Authorization Guard
 * 
 * STRICT SERVER-ONLY USAGE.
 * Verifies Supabase Auth JWT tokens cryptographically.
 * Rejects unauthorized or forged tokens with HTTP 401.
 */

export interface AuthenticatedUser {
  id: string;
  email: string;
  rawUser: any;
}

export async function getUserFromRequest(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  assertServerOnly();

  // 1. Extract Bearer Token from Authorization Header
  let token: string | null = null;
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.substring(7).trim();
  }

  // 2. If no Bearer header, check standard Supabase cookie tokens
  if (!token) {
    const cookies = request.cookies;
    const projectRef = process.env.SUPABASE_PROJECT_REF || "nciqqkrnrdtuzwskjyqn";
    const cookieToken =
      cookies.get(`sb-${projectRef}-auth-token`)?.value ||
      cookies.get("sb-access-token")?.value ||
      cookies.get("hackmitra_user_token")?.value;

    if (cookieToken) {
      try {
        // Supabase stores cookie value as JSON string array [access_token, refresh_token] or raw string
        if (cookieToken.startsWith("[")) {
          const parsed = JSON.parse(cookieToken);
          token = parsed[0];
        } else if (cookieToken.startsWith("{")) {
          const parsed = JSON.parse(cookieToken);
          token = parsed.access_token;
        } else {
          token = cookieToken;
        }
      } catch {
        token = cookieToken;
      }
    }
  }

  if (!token) {
    return null;
  }

  // 3. Verify token with Supabase Auth
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;

  try {
    const supabase = createClient<Database>(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || "",
      rawUser: user,
    };
  } catch (err) {
    console.warn("[UserAuth] Token validation error:", err);
    return null;
  }
}

/**
 * Route guard that terminates unauthenticated requests with HTTP 401
 */
export async function requireUserAuth(
  request: NextRequest
): Promise<{ user: AuthenticatedUser } | { response: NextResponse }> {
  const user = await getUserFromRequest(request);

  if (!user) {
    return {
      response: NextResponse.json(
        {
          error: "Unauthorized",
          message: "Authentication required to access saved events or user preferences.",
        },
        { status: 401 }
      ),
    };
  }

  return { user };
}
