import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { getSupabaseConfig } from "./config";

/**
 * Public Supabase Client (Browser & Client Components)
 * 
 * Uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * All requests through this client are subject to Row Level Security (RLS).
 */
export function createBrowserSupabaseClient() {
  const { url, anonKey, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    return null;
  }

  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
