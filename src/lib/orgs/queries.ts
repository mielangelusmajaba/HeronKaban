import "server-only";
import { and, count, eq, ilike, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { memberships, orgs } from "@/db/schema";

/** Org directory for the welcome pages. Never returns join codes. */
export async function listOrgDirectory(q?: string) {
  const db = getDb();
  const filter = q?.trim()
    ? or(ilike(orgs.name, `%${q.trim()}%`), ilike(orgs.college, `%${q.trim()}%`))
    : undefined;
  return db
    .select({
      id: orgs.id,
      slug: orgs.slug,
      name: orgs.name,
      description: orgs.description,
      college: orgs.college,
      status: orgs.status,
      members: count(memberships.id),
    })
    .from(orgs)
    .leftJoin(memberships, and(eq(memberships.orgId, orgs.id), eq(memberships.status, "active")))
    .where(filter)
    .groupBy(orgs.id)
    .orderBy(sql`${orgs.status} = 'verified' desc`, orgs.name)
    .limit(100);
}
