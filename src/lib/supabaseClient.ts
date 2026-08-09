import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.example)."
  );
}

// Client for use in the browser / server components — read-only via RLS.
export const supabase = createClient(
  supabaseUrl ?? "",
  supabaseAnonKey ?? ""
);

// Service-role client for server-only code (API routes, seed scripts) that
// needs to write data. Never import this into client components.
export function getServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for " +
        "service-role Supabase client."
    );
  }
  return createClient(supabaseUrl, serviceKey);
}
