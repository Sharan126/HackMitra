/**
 * Supabase Environment Configuration and Validation
 * 
 * Verifies the presence of required Supabase credentials
 * and provides runtime safety guards to prevent leaking service keys to the browser.
 */

export const getSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  const isConfigured = Boolean(
    url &&
    anonKey &&
    url.startsWith("http") &&
    !url.includes("your-project-ref")
  );

  return {
    url,
    anonKey,
    serviceRoleKey,
    isConfigured,
  };
};

export const assertServerOnly = () => {
  if (typeof window !== "undefined") {
    throw new Error(
      "SECURITY VIOLATION: Service role Supabase operations cannot be executed from client-side bundles."
    );
  }
};
