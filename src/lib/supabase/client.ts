import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env/public";

/** Supabase client for Client Components. Uses the signed-in user's session, so RLS applies. */
export function createClient() {
  const env = publicEnv();
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
