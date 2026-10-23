import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { getSupabaseConfig, assertServerOnly } from "./config";

/**
 * Server-Side Supabase Client (Server Components & Route Handlers)
 * 
 * Uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * for standard queries scoped by RLS.
 */
export function createServerSupabaseClient() {
  assertServerOnly();

  const { url, anonKey, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    return null;
  }

  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
    },
  });
}
