import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb } from "@/db";
import { memberships, orgs, profiles, type Membership, type Org, type OrgRole, type Profile } from "@/db/schema";
import { serverEnv } from "@/lib/env/server";
import { createClient } from "@/lib/supabase/server";
import { CONSENT_VERSION } from "@/lib/consent";
import { roleAtLeast } from "@/lib/roles";

/**
 * Data Access Layer: every server page, action and route handler gets the user from here.
 * Domain, profile, consent and org-role checks all happen on the server.
 */

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(`@${serverEnv().ALLOWED_EMAIL_DOMAIN.toLowerCase()}`);
}

export type MembershipWithOrg = Membership & { org: Org };

export type Viewer = {
  id: string;
  email: string;
  profile: Profile;
  memberships: MembershipWithOrg[];
  isPlatformAdmin: boolean;
};

/** Verified Supabase user (validated with the auth server), or null. Domain-checked. */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user || !isAllowedEmail(user.email)) return null;
  return { id: user.id, email: user.email!.toLowerCase(), meta: user.user_metadata as Record<string, unknown> };
});

/** The signed-in viewer with profile and org memberships, or null. Cached per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const user = await getAuthUser();
  if (!user) return null;
  const db = getDb();

  let [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id));
  if (!profile) {
    // The DB trigger normally creates this row; this is a fallback.
    [profile] = await db
      .insert(profiles)
      .values({ id: user.id, email: user.email, fullName: (user.meta.full_name ?? user.meta.name ?? null) as string | null })
      .onConflictDoNothing()
      .returning();
    [profile] = profile ? [profile] : await db.select().from(profiles).where(eq(profiles.id, user.id));
  }

  const rows = await db
    .select({ m: memberships, org: orgs })
    .from(memberships)
    .innerJoin(orgs, eq(orgs.id, memberships.orgId))
    .where(and(eq(memberships.userId, user.id), inArray(memberships.status, ["active", "pending"])));

  return {
    id: user.id,
    email: user.email,
    profile,
    memberships: rows.map((r) => ({ ...r.m, org: r.org })),
    isPlatformAdmin: serverEnv().PLATFORM_ADMIN_EMAILS.includes(user.email),
  };
});

export function hasConsented(profile: Profile) {
  return profile.consentVersion === CONSENT_VERSION && profile.consentAt !== null;
}

/** Where a signed-in user should go next (profile → consent → welcome → their org). */
export function nextStepFor(viewer: Viewer, wanted?: string | null): string {
  if (!viewer.profile.profileCompletedAt) return "/auth/sign-up";
  if (!hasConsented(viewer.profile)) return "/auth/consent";
  if (wanted && wanted.startsWith("/") && !wanted.startsWith("//") && !wanted.startsWith("/auth")) return wanted;
  const active = viewer.memberships.filter((m) => m.status === "active");
  if (active.length === 0) return "/welcome";
  const officerSeat = active.find((m) => roleAtLeast(m.role, "committee"));
  return officerSeat ? `/o/${officerSeat.org.slug}` : `/m/${active[0].org.slug}`;
}

/** Signed in + profile complete + consented, else redirect to the right step. */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/auth/sign-in");
  if (!viewer.profile.profileCompletedAt) redirect("/auth/sign-up");
  if (!hasConsented(viewer.profile)) redirect("/auth/consent");
  return viewer;
}

export type OrgAccess = { viewer: Viewer; org: Org; membership: Membership };

/** Active membership in the org with at least `minRole`, else redirect (pages) away. */
export async function requireOrgAccess(slug: string, minRole: OrgRole = "member"): Promise<OrgAccess> {
  const viewer = await requireViewer();
  const m = viewer.memberships.find((x) => x.org.slug === slug && x.status === "active");
  if (!m) redirect("/welcome");
  if (!roleAtLeast(m.role, minRole)) redirect(`/m/${slug}`);
  const { org, ...membership } = m;
  return { viewer, org, membership };
}

/** Same check for server actions: throws instead of redirecting. */
export async function assertOrgAccess(orgId: string, minRole: OrgRole = "member"): Promise<OrgAccess> {
  const viewer = await getViewer();
  if (!viewer || !viewer.profile.profileCompletedAt || !hasConsented(viewer.profile)) throw new Error("Not signed in");
  const m = viewer.memberships.find((x) => x.orgId === orgId && x.status === "active");
  if (!m || !roleAtLeast(m.role, minRole)) throw new Error("You don't have permission to do that in this organization.");
  const { org, ...membership } = m;
  return { viewer, org, membership };
}

export async function assertViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer || !viewer.profile.profileCompletedAt || !hasConsented(viewer.profile)) throw new Error("Not signed in");
  return viewer;
}
