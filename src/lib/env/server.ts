import "server-only";
import { z } from "zod";

const schema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  ALLOWED_EMAIL_DOMAIN: z.string().min(1).default("umak.edu.ph"),
  /** Comma-separated emails that may verify new orgs (/admin). */
  PLATFORM_ADMIN_EMAILS: z
    .string()
    .default("")
    .transform((s) =>
      s
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
  /**
   * App relayer key: owns the Test Peso token (mints play money) and makes custodial
   * member deposits. It is NEVER used to create, approve or reject requests.
   * Locally this is Hardhat account #0 (a public test key).
   */
  RELAYER_PRIVATE_KEY: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/)
    .optional(),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  OPENROUTER_MODEL: z.string().min(1).default("google/gemma-4-26b-a4b-it:free"),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | undefined;

/** Validated server-only env. Importing this from a Client Component is a build error. */
export function serverEnv(): ServerEnv {
  cached ??= schema.parse({
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    ALLOWED_EMAIL_DOMAIN: process.env.ALLOWED_EMAIL_DOMAIN || undefined,
    PLATFORM_ADMIN_EMAILS: process.env.PLATFORM_ADMIN_EMAILS || undefined,
    RELAYER_PRIVATE_KEY: process.env.RELAYER_PRIVATE_KEY || undefined,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || undefined,
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || undefined,
  });
  return cached;
}
