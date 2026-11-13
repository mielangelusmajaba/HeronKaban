import { z } from "zod";

// NEXT_PUBLIC_* vars must be referenced literally so Next.js can inline them into client bundles.
const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_BSC_RPC_URL: z.url().default("https://data-seed-prebsc-1-s1.bnbchain.org:8545"),
  NEXT_PUBLIC_TREASURY_ADDRESS: z.string().optional(),
  NEXT_PUBLIC_TOKEN_ADDRESS: z.string().optional(),
});

export type PublicEnv = z.infer<typeof schema>;

let cached: PublicEnv | undefined;

/** Validated public env. Parsed lazily so `next build` doesn't fail before env vars are set. */
export function publicEnv(): PublicEnv {
  cached ??= schema.parse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_BSC_RPC_URL: process.env.NEXT_PUBLIC_BSC_RPC_URL || undefined,
    NEXT_PUBLIC_TREASURY_ADDRESS: process.env.NEXT_PUBLIC_TREASURY_ADDRESS || undefined,
    NEXT_PUBLIC_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_TOKEN_ADDRESS || undefined,
  });
  return cached;
}
