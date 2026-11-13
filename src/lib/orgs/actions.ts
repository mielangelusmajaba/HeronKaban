"use server";

import { randomBytes } from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { activity, memberships, orgs, type OrgRole } from "@/db/schema";
import { assertOrgAccess, assertViewer } from "@/lib/auth";
import { roleAtLeast } from "@/lib/roles";

export type ActionState = { error?: string; ok?: string } | undefined;

const fail = (e: unknown): ActionState => ({ error: e instanceof Error ? e.message : "Something went wrong." });

// ───────────────────────── helpers ─────────────────────────

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
function newJoinCode() {
  const bytes = randomBytes(8);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "org"
  );
}

async function uniqueSlug(name: string) {
  const db = getDb();
  const base = slugify(name);
  for (let i = 0; i < 20; i++) {
    const slug = i === 0 ? base : `${base}-${i + 1}`;
    const [hit] = await db.select({ id: orgs.id }).from(orgs).where(eq(orgs.slug, slug));
    if (!hit) return slug;
  }
  return `${base}-${randomBytes(3).toString("hex")}`;
}

async function log(orgId: string, actorId: string, kind: string, note?: string, refId?: string) {
  await getDb().insert(activity).values({ orgId, actorId, kind, note, refId });
}

// ───────────────────────── student side ─────────────────────────

const createSchema = z.object({
  name: z.string().trim().min(3, "Org name is too short.").max(100),
  description: z.string().trim().max(500).optional(),
  college: z.string().trim().max(120).optional(),
  positionTitle: z.string().trim().max(60).optional(),
});

/** Any UMak student can create an org; they become its President. Org starts "unverified". */
export async function createOrg(_: ActionState, form: FormData): Promise<ActionState> {
  let slug: string;
  try {
    const viewer = await assertViewer();
    const data = createSchema.parse({
      name: form.get("name"),
      description: form.get("description") || undefined,
      college: form.get("college") || undefined,
      positionTitle: form.get("positionTitle") || undefined,
    });
    const db = getDb();
    slug = await uniqueSlug(data.name);
    const [org] = await db
      .insert(orgs)
      .values({
        slug,
        name: data.name,
        description: data.description,
        college: data.college ?? viewer.profile.college,
        joinCode: newJoinCode(),
        createdBy: viewer.id,
      })
      .returning();
    await db.insert(memberships).values({
      orgId: org.id,
      userId: viewer.id,
      role: "president",
      positionTitle: data.positionTitle || "President",
      status: "active",
      decidedAt: new Date(),
    });
    await log(org.id, viewer.id, "org_created", `Created ${org.name}`);
  } catch (e) {
    return fail(e instanceof z.ZodError ? new Error(e.issues[0].message) : e);
  }
  redirect(`/o/${slug}`);
}

/** Joining with the org's code makes you an active member immediately. */
export async function joinWithCode(_: ActionState, form: FormData): Promise<ActionState> {
  let slug: string;
  try {
    const viewer = await assertViewer();
    const code = String(form.get("code") ?? "")
      .trim()
      .toUpperCase();
    if (!code) return { error: "Enter the join code from your officers." };
    const db = getDb();
    const [org] = await db.select().from(orgs).where(eq(orgs.joinCode, code));
    if (!org) return { error: "That code didn't match any organization. Check it with your officers." };
    slug = org.slug;
    const [existing] = await db
      .select()
      .from(memberships)
      .where(and(eq(memberships.orgId, org.id), eq(memberships.userId, viewer.id)));
    if (existing?.status === "active") redirect(`/m/${slug}`);
    if (existing) {
      // A pending request (any role) becomes an active membership; a requested officer
      // seat stays requested so the President can still promote them.
      await db
        .update(memberships)
        .set({ status: "active", role: "member", decidedAt: new Date(), note: existing.note })
        .where(eq(memberships.id, existing.id));
    } else {
      await db.insert(memberships).values({ orgId: org.id, userId: viewer.id, role: "member", status: "active", decidedAt: new Date() });
    }
    await log(org.id, viewer.id, "member_joined", "Joined with the org code");
  } catch (e) {
    if (isRedirect(e)) throw e;
    return fail(e);
  }
  redirect(`/m/${slug}`);
}

const requestSchema = z.object({
  orgId: z.uuid(),
  requestedRole: z.enum(["member", "committee", "officer"]),
  positionTitle: z.string().trim().max(60).optional(),
  note: z.string().trim().max(300).optional(),
});

/** Ask to join an org. Member requests are approved by officers; officer/committee seats by the President. */
export async function requestToJoin(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const viewer = await assertViewer();
    const data = requestSchema.parse({
      orgId: form.get("orgId"),
      requestedRole: form.get("requestedRole") ?? "member",
      positionTitle: form.get("positionTitle") || undefined,
      note: form.get("note") || undefined,
    });
    const db = getDb();
    const [existing] = await db
      .select()
      .from(memberships)
      .where(and(eq(memberships.orgId, data.orgId), eq(memberships.userId, viewer.id)));

    if (existing?.status === "active") {
      if (data.requestedRole === "member" || roleAtLeast(existing.role, data.requestedRole)) {
        return { error: "You're already in this organization." };
      }
      // Active member asking for a promotion: keep access, record the request.
      await db
        .update(memberships)
        .set({ requestedRole: data.requestedRole, positionTitle: data.positionTitle ?? existing.positionTitle, note: data.note })
        .where(eq(memberships.id, existing.id));
    } else if (existing) {
      await db
        .update(memberships)
        .set({
          status: "pending",
          role: "member",
          requestedRole: data.requestedRole,
          positionTitle: data.positionTitle,
          note: data.note,
          decidedAt: null,
          decidedBy: null,
        })
        .where(eq(memberships.id, existing.id));
    } else {
      await db.insert(memberships).values({
        orgId: data.orgId,
        userId: viewer.id,
        role: "member",
        status: "pending",
        requestedRole: data.requestedRole,
        positionTitle: data.positionTitle,
        note: data.note,
      });
    }
    await log(data.orgId, viewer.id, "join_requested", `Asked to join as ${data.requestedRole}`);
    revalidatePath("/welcome", "layout");
    return { ok: "Request sent. You'll get access once it's approved." };
  } catch (e) {
    return fail(e instanceof z.ZodError ? new Error(e.issues[0].message) : e);
  }
}

export async function withdrawRequest(membershipId: string) {
  const viewer = await assertViewer();
  const db = getDb();
  const [m] = await db.select().from(memberships).where(and(eq(memberships.id, membershipId), eq(memberships.userId, viewer.id)));
  if (!m) return;
  if (m.status === "pending") await db.delete(memberships).where(eq(memberships.id, m.id));
  else await db.update(memberships).set({ requestedRole: null }).where(eq(memberships.id, m.id));
  revalidatePath("/", "layout");
}

// ───────────────────────── officer side ─────────────────────────

/**
 * Approve or decline a join/promotion request.
 * - Member requests: officers and the President.
 * - Committee/officer seats: the President only.
 */
export async function decideMembership(membershipId: string, approve: boolean): Promise<ActionState> {
  try {
    const db = getDb();
    const [m] = await db.select().from(memberships).where(eq(memberships.id, membershipId));
    if (!m) return { error: "Request not found." };
    const wanted: OrgRole = m.requestedRole ?? "member";
    const { viewer, org } = await assertOrgAccess(m.orgId, wanted === "member" ? "officer" : "president");

    if (approve) {
      await db
        .update(memberships)
        .set({ status: "active", role: wanted, requestedRole: null, decidedBy: viewer.id, decidedAt: new Date() })
        .where(eq(memberships.id, m.id));
    } else if (m.status === "active") {
      await db.update(memberships).set({ requestedRole: null, decidedBy: viewer.id, decidedAt: new Date() }).where(eq(memberships.id, m.id));
    } else {
      await db
        .update(memberships)
        .set({ status: "rejected", requestedRole: null, decidedBy: viewer.id, decidedAt: new Date() })
        .where(eq(memberships.id, m.id));
    }
    await log(org.id, viewer.id, approve ? "request_approved" : "request_declined", `${approve ? "Approved" : "Declined"} a ${wanted} request`, m.userId);
    revalidatePath(`/o/${org.slug}`, "layout");
    return { ok: approve ? "Approved." : "Declined." };
  } catch (e) {
    return fail(e);
  }
}

const roleSchema = z.object({
  membershipId: z.uuid(),
  role: z.enum(["officer", "committee", "member"]),
  positionTitle: z.string().trim().max(60).optional(),
  isSigner: z.boolean(),
});

/** President only: change someone's role, title and signer flag. */
export async function updateMemberRole(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const data = roleSchema.parse({
      membershipId: form.get("membershipId"),
      role: form.get("role"),
      positionTitle: form.get("positionTitle") || undefined,
      isSigner: form.get("isSigner") === "on",
    });
    const db = getDb();
    const [m] = await db.select().from(memberships).where(eq(memberships.id, data.membershipId));
    if (!m) return { error: "Member not found." };
    const { viewer, org } = await assertOrgAccess(m.orgId, "president");
    if (m.role === "president") return { error: "Use the President's own row for that." };
    if (data.isSigner && data.role !== "officer") return { error: "Only officers can be signers." };
    await db
      .update(memberships)
      .set({ role: data.role, positionTitle: data.positionTitle ?? null, isSigner: data.isSigner })
      .where(eq(memberships.id, m.id));
    await log(org.id, viewer.id, "role_changed", `Set role to ${data.role}${data.isSigner ? " (signer)" : ""}`, m.userId);
    revalidatePath(`/o/${org.slug}`, "layout");
    return { ok: "Saved. If you changed signers, update them on-chain from Officers & roles." };
  } catch (e) {
    return fail(e);
  }
}

/** President may also be a signer (and is the on-chain org admin). */
export async function setPresidentSigner(orgId: string, isSigner: boolean): Promise<ActionState> {
  try {
    const { viewer, org, membership } = await assertOrgAccess(orgId, "president");
    await getDb().update(memberships).set({ isSigner }).where(eq(memberships.id, membership.id));
    await log(org.id, viewer.id, "role_changed", isSigner ? "President became a signer" : "President is no longer a signer");
    revalidatePath(`/o/${org.slug}`, "layout");
    return { ok: "Saved." };
  } catch (e) {
    return fail(e);
  }
}

export async function removeMember(membershipId: string): Promise<ActionState> {
  try {
    const db = getDb();
    const [m] = await db.select().from(memberships).where(eq(memberships.id, membershipId));
    if (!m) return { error: "Member not found." };
    // Officers can remove members; only the President can remove committee/officers.
    const { viewer, org } = await assertOrgAccess(m.orgId, m.role === "member" ? "officer" : "president");
    if (m.role === "president") return { error: "The President can't be removed." };
    await db.update(memberships).set({ status: "removed", isSigner: false, decidedBy: viewer.id, decidedAt: new Date() }).where(eq(memberships.id, m.id));
    await log(org.id, viewer.id, "member_removed", undefined, m.userId);
    revalidatePath(`/o/${org.slug}`, "layout");
    return { ok: "Removed." };
  } catch (e) {
    return fail(e);
  }
}

export async function regenerateJoinCode(orgId: string): Promise<ActionState> {
  try {
    const { viewer, org } = await assertOrgAccess(orgId, "officer");
    await getDb().update(orgs).set({ joinCode: newJoinCode() }).where(eq(orgs.id, org.id));
    await log(org.id, viewer.id, "join_code_reset", "Generated a new join code");
    revalidatePath(`/o/${org.slug}`, "layout");
    return { ok: "New code generated. The old one no longer works." };
  } catch (e) {
    return fail(e);
  }
}

const settingsSchema = z.object({
  orgId: z.uuid(),
  name: z.string().trim().min(3).max(100),
  description: z.string().trim().max(500).optional(),
  college: z.string().trim().max(120).optional(),
});

export async function updateOrgSettings(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const data = settingsSchema.parse({
      orgId: form.get("orgId"),
      name: form.get("name"),
      description: form.get("description") || undefined,
      college: form.get("college") || undefined,
    });
    const { viewer, org } = await assertOrgAccess(data.orgId, "president");
    const db = getDb();
    const [clash] = await db.select({ id: orgs.id }).from(orgs).where(and(eq(orgs.name, data.name), ne(orgs.id, org.id)));
    if (clash) return { error: "Another org already uses that name." };
    await db.update(orgs).set({ name: data.name, description: data.description ?? null, college: data.college ?? null }).where(eq(orgs.id, org.id));
    await log(org.id, viewer.id, "settings_changed", "Updated org details");
    revalidatePath(`/o/${org.slug}`, "layout");
    return { ok: "Saved." };
  } catch (e) {
    return fail(e instanceof z.ZodError ? new Error(e.issues[0].message) : e);
  }
}

// ───────────────────────── platform admin ─────────────────────────

export async function setOrgVerified(orgId: string, verified: boolean): Promise<ActionState> {
  try {
    const viewer = await assertViewer();
    if (!viewer.isPlatformAdmin) return { error: "Only platform admins can verify orgs." };
    await getDb()
      .update(orgs)
      .set(verified ? { status: "verified", verifiedAt: new Date(), verifiedBy: viewer.id } : { status: "unverified", verifiedAt: null, verifiedBy: null })
      .where(eq(orgs.id, orgId));
    await log(orgId, viewer.id, verified ? "org_verified" : "org_unverified");
    revalidatePath("/admin");
    return { ok: verified ? "Verified." : "Marked unverified." };
  } catch (e) {
    return fail(e);
  }
}

function isRedirect(e: unknown) {
  return typeof e === "object" && e !== null && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT");
}
