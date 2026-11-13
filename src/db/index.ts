import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { serverEnv } from "@/lib/env/server";
import * as schema from "./schema";

/**
 * Drizzle connects as the Postgres owner role, so it BYPASSES Supabase RLS.
 * Use it only in server code after your own authorization check.
 * For user-scoped reads that should respect RLS, use the Supabase server client instead.
 */
let db: PostgresJsDatabase<typeof schema> | undefined;

export function getDb() {
  if (!db) {
    // prepare: false is required for Supabase's transaction pooler (port 6543).
    const client = postgres(serverEnv().DATABASE_URL, { prepare: false });
    db = drizzle(client, { schema });
  }
  return db;
}
