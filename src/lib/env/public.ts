import { z } from "zod";

// NEXT_PUBLIC_* vars must be referenced literally so Next.js can inline them into client bundles.
const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export type PublicEnv = z.infer<typeof schema>;

let cached: PublicEnv | undefined;

/**
 * Validated public env. Parsed lazily so `next build` doesn't fail before env vars are set.
 * Chain settings (NEXT_PUBLIC_CHAIN_ID, NEXT_PUBLIC_RPC_URL, contract addresses) live in
 * src/lib/chain/config.ts.
 */
export function publicEnv(): PublicEnv {
  cached ??= schema.parse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  return cached;
}
