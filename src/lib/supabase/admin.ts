import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { getSupabaseConfig, assertServerOnly } from "./config";

/**
 * Service Role Supabase Admin Client
 * 
 * STRICT SERVER-ONLY USAGE.
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass Row Level Security (RLS)
 * for backend automated tasks:
 * - Scraper pipeline ingestion (discovery_runs, hackathon_source_records)
 * - Bot verification runs (verification_logs)
 * - District administrative metadata management
 * 
 * NEVER import this file into Client Components or expose the service role key.
 */
export function createAdminSupabaseClient() {
  assertServerOnly();

  const { url, serviceRoleKey } = getSupabaseConfig();

  if (!url || !serviceRoleKey || serviceRoleKey.includes("your-service-role-key")) {
    return null;
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
