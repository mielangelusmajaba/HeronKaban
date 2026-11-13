"use server";

import { createHash } from "node:crypto";
import { and, eq, inArray, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAddress, isAddress, keccak256, toHex, verifyMessage, type Hash } from "viem";
import { z } from "zod";
import { getDb } from "@/db";
import { activity, aiChecks, deposits, events, memberships, orgs, profiles, requests } from "@/db/schema";
import { readReceipt } from "@/lib/ai/receipt";
import { assertOrgAccess, assertViewer } from "@/lib/auth";
import { computeFlags } from "@/lib/checks";
import { chainConfigured } from "@/lib/chain/config";
import { readOrgCreated, reconcileOrg, syncTx } from "@/lib/chain/ledger";
import { walletLinkMessage } from "@/lib/chain/link-message";
import { toUnits } from "@/lib/chain/money";
import { custodialDeposit } from "@/lib/chain/relayer";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionState = { error?: string; ok?: string } | undefined;
const fail = (e: unknown): ActionState => ({
  error: e instanceof z.ZodError ? e.issues[0].message : e instanceof Error ? e.message : "Something went wrong.",
});

async function log(orgId: string, actorId: string, kind: string, note?: string, refId?: string) {
  await getDb().insert(activity).values({ orgId, actorId, kind, note, refId });
}

// ───────────────────────── Officer wallet ─────────────────────────

/** Link a wallet after verifying a signed message (proves the officer controls it). */
export async function linkWallet(address: string, issuedAt: string, signature: `0x${string}`): Promise<ActionState> {
  try {
    const viewer = await assertViewer();
    if (!isAddress(address)) return { error: "That isn't a valid wallet address." };
    const age = Date.now() - Date.parse(issuedAt);
    if (!(age >= -60_000 && age < 10 * 60_000)) return { error: "The signature expired. Please try again." };
    const ok = await verifyMessage({ address: getAddress(address), message: walletLinkMessage(viewer.id, address, issuedAt), signature });
    if (!ok) return { error: "The signature didn't match that wallet." };
    const lower = address.toLowerCase();
    const db = getDb();
    const [taken] = await db.select({ id: profiles.id }).from(profiles).where(and(eq(profiles.walletAddress, lower), ne(profiles.id, viewer.id)));
    if (taken) return { error: "That wallet is already linked to another HeronKaban account." };
    await db.update(profiles).set({ walletAddress: lower, walletVerifiedAt: new Date() }).where(eq(profiles.id, viewer.id));
    revalidatePath("/", "layout");
    return { ok: "Wallet linked." };
  } catch (e) {
    return fail(e);
  }
}

export async function unlinkWallet(): Promise<ActionState> {
  try {
    const viewer = await assertViewer();
    await getDb().update(profiles).set({ walletAddress: null, walletVerifiedAt: null }).where(eq(profiles.id, viewer.id));
    revalidatePath("/", "layout");
    return { ok: "Wallet unlinked." };
  } catch (e) {
    return fail(e);
  }
}

// ───────────────────────── Treasury activation & sync ─────────────────────────

/**
 * After the President sent createOrg from their own wallet, record the on-chain org id.
 * We read the OrgCreated event ourselves and check the admin is the President's linked wallet.
 */
export async function activateTreasury(orgId: string, txHash: Hash): Promise<ActionState> {
  try {
    const { viewer, org } = await assertOrgAccess(orgId, "president");
    if (org.chainOrgId) return { error: "This org's treasury is already active." };
    const created = await readOrgCreated(txHash);
    if (!created) return { error: "No new treasury was found in that transaction." };
    if (created.admin.toLowerCase() !== viewer.profile.walletAddress) {
      return { error: "That treasury was created by a different wallet than your linked one." };
    }
    const db = getDb();
    const [updated] = await db
      .update(orgs)
      .set({
        chainOrgId: Number(created.orgId),
        chainThreshold: Number(created.threshold),
        chainSigners: created.signers.map((s) => s.toLowerCase()),
      })
      .where(eq(orgs.id, org.id))
      .returning();
    await log(org.id, viewer.id, "treasury_activated", `Treasury activated: ${created.threshold} of ${created.signers.length} approvals`);
    await reconcileOrg(updated);
    revalidatePath(`/o/${org.slug}`, "layout");
    revalidatePath(`/m/${org.slug}`, "layout");
    return { ok: "Treasury activated." };
  } catch (e) {
    return fail(e);
  }
}

/** Re-read the chain and update the DB caches. Any member may trigger it (read-only on chain). */
export async function syncOrg(orgId: string, txHash?: Hash): Promise<ActionState> {
  try {
    const { org } = await assertOrgAccess(orgId, "member");
    if (txHash) await syncTx(org, txHash);
    else await reconcileOrg(org);
    revalidatePath(`/o/${org.slug}`, "layout");
    revalidatePath(`/m/${org.slug}`, "layout");
    return { ok: "Up to date with the blockchain." };
  } catch (e) {
    return fail(e);
  }
}

// ───────────────────────── Dues (custodial demo wallet) ─────────────────────────

const duesSchema = z.object({
  orgId: z.uuid(),
  amount: z.coerce.number().positive("Enter an amount above ₱0.").max(100_000, "That's more than the prototype allows."),
  note: z.string().trim().max(120).optional(),
});

/**
 * "Pay dues (test pesos)": the app relayer mints play money and deposits it into the org
 * for this member, tagged with a pseudonymous memberRef (keccak256 of the user id).
 * Custodial for the demo, and said so in the UI (Architecture §10).
 */
export async function payDues(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const data = duesSchema.parse({ orgId: form.get("orgId"), amount: form.get("amount"), note: form.get("note") || undefined });
    const { viewer, org } = await assertOrgAccess(data.orgId, "member");
    if (!org.chainOrgId) return { error: "This org's treasury isn't active yet. Ask your President to activate it." };
    if (!chainConfigured) return { error: "The blockchain isn't configured on this server." };
    const memberRef = keccak256(toHex(`heronkaban:${viewer.id}`));
    const tx = await custodialDeposit(BigInt(org.chainOrgId), toUnits(data.amount), memberRef);
    await getDb().insert(deposits).values({ orgId: org.id, userId: viewer.id, amount: data.amount, note: data.note, memberRef, txHash: tx });
    revalidatePath(`/m/${org.slug}`, "layout");
    revalidatePath(`/o/${org.slug}`, "layout");
    return { ok: `Paid ₱${data.amount.toLocaleString("en-PH")} into the treasury.` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/fetch failed|ECONNREFUSED|HTTP request failed/i.test(msg)) {
      return { error: "Can't reach the blockchain node. Is `npm run chain:node` running?" };
    }
    return fail(e);
  }
}

// ───────────────────────── Events ─────────────────────────

const eventSchema = z.object({
  orgId: z.uuid(),
  name: z.string().trim().min(2, "Event name is too short.").max(100),
  category: z.enum(["general", "food", "seminar", "sports", "outreach", "competition", "other"]),
  budget: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().positive().max(10_000_000).optional()),
  description: z.string().trim().max(500).optional(),
});

export async function createEvent(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const data = eventSchema.parse({
      orgId: form.get("orgId"),
      name: form.get("name"),
      category: form.get("category") ?? "general",
      budget: form.get("budget"),
      description: form.get("description") || undefined,
    });
    const { viewer, org } = await assertOrgAccess(data.orgId, "officer");
    const [ev] = await getDb()
      .insert(events)
      .values({ orgId: org.id, name: data.name, category: data.category, budget: data.budget ?? null, description: data.description, createdBy: viewer.id })
      .returning();
    await log(org.id, viewer.id, "event_created", `Created event "${ev.name}"${data.budget ? ` with a ₱${data.budget.toLocaleString("en-PH")} budget` : ""}`, ev.id);
    revalidatePath(`/o/${org.slug}`, "layout");
    revalidatePath(`/m/${org.slug}`, "layout");
    return { ok: "Event created." };
  } catch (e) {
    return fail(e);
  }
}

// ───────────────────────── Expense requests ─────────────────────────

const MAX_RECEIPT = 10 * 1024 * 1024;
const MIME_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

const requestSchema = z.object({
  orgId: z.uuid(),
  eventId: z.preprocess((v) => (v === "" ? undefined : v), z.uuid().optional()),
  purpose: z.string().trim().min(5, "Describe the expense in a few words.").max(300),
  amount: z.coerce.number().positive("Enter the amount spent.").max(10_000_000),
  payeeAddress: z.string().refine((v) => isAddress(v), "Enter the wallet that should be reimbursed (0x…)."),
});

/**
 * File an expense request (reimbursement model): upload the receipt, hash it, run the
 * cached AI read, compute deterministic flags. The request is a DRAFT until a signer
 * submits it on-chain with createRequest (from their own wallet).
 */
export async function fileRequest(_: ActionState, form: FormData): Promise<ActionState> {
  let target: string;
  try {
    const data = requestSchema.parse({
      orgId: form.get("orgId"),
      eventId: form.get("eventId") ?? undefined,
      purpose: form.get("purpose"),
      amount: form.get("amount"),
      payeeAddress: form.get("payeeAddress"),
    });
    const { viewer, org } = await assertOrgAccess(data.orgId, "committee");
    const file = form.get("receipt");
    if (!(file instanceof File) || file.size === 0) return { error: "Attach a photo of the receipt." };
    if (file.size > MAX_RECEIPT) return { error: "The receipt photo must be 10 MB or smaller." };
    const ext = MIME_EXT[file.type];
    if (!ext) return { error: "Use a JPG, PNG or WebP photo." };

    const bytes = new Uint8Array(await file.arrayBuffer());
    const receiptHash = `0x${createHash("sha256").update(bytes).digest("hex")}`;
    const db = getDb();

    const [dup] = await db.select({ id: requests.id, purpose: requests.purpose }).from(requests).where(eq(requests.receiptHash, receiptHash));
    if (dup) return { error: `This exact receipt file was already filed ("${dup.purpose}"). Each receipt can be used once.` };

    const path = `${org.id}/${receiptHash.slice(2)}.${ext}`;
    const { error: upErr } = await createAdminClient().storage.from("receipts").upload(path, bytes, { contentType: file.type, upsert: true });
    if (upErr) return { error: `Couldn't store the receipt: ${upErr.message}` };

    const ai = await readReceipt(receiptHash, { bytes, mime: file.type });

    const ev = data.eventId
      ? (await db.select().from(events).where(and(eq(events.id, data.eventId), eq(events.orgId, org.id))))[0]
      : undefined;
    let committedOther = 0;
    if (ev) {
      const rows = await db
        .select({ amount: requests.amount })
        .from(requests)
        .where(and(eq(requests.eventId, ev.id), inArray(requests.status, ["draft", "pending", "released"])));
      committedOther = rows.reduce((s, r) => s + r.amount, 0);
    }
    let lookalikes: { purpose: string }[] = [];
    if (ai.extraction?.total != null && ai.extraction.date) {
      const rows = await db
        .select({ purpose: requests.purpose, x: aiChecks.extracted })
        .from(requests)
        .innerJoin(aiChecks, eq(aiChecks.receiptHash, requests.receiptHash))
        .where(and(eq(requests.orgId, org.id), ne(requests.status, "cancelled")));
      const merchant = ai.extraction.merchant?.trim().toLowerCase();
      lookalikes = rows.filter(
        (r) =>
          r.x?.total === ai.extraction!.total &&
          r.x?.date === ai.extraction!.date &&
          (!merchant || !r.x?.merchant || r.x.merchant.trim().toLowerCase() === merchant),
      );
    }

    const flags = computeFlags({
      requestedAmount: data.amount,
      extraction: ai.extraction,
      extractionError: ai.error,
      event: ev ? { name: ev.name, category: ev.category, budget: ev.budget } : null,
      eventCommittedOther: committedOther,
      lookalikes,
    });

    const [row] = await db
      .insert(requests)
      .values({
        orgId: org.id,
        eventId: ev?.id ?? null,
        purpose: data.purpose,
        amount: data.amount,
        payeeAddress: data.payeeAddress.toLowerCase(),
        receiptPath: path,
        receiptMime: file.type,
        receiptHash,
        flags,
        filedBy: viewer.id,
        threshold: org.chainThreshold,
      })
      .returning();
    await log(org.id, viewer.id, "request_filed", `Filed "${data.purpose}" with a receipt`, row.id);
    if (ai.extraction || ai.error) {
      await log(org.id, viewer.id, "ai_checked", flags.length ? `Receipt check: ${flags.length} item(s) need review` : "Receipt check: nothing to review", row.id);
    }
    target = `/o/${org.slug}/requests/${row.id}`;
  } catch (e) {
    return fail(e);
  }
  redirect(target);
}

/** Retry the AI read for a request whose check was rate-limited or not configured earlier. */
export async function recheckReceipt(requestId: string): Promise<ActionState> {
  try {
    const db = getDb();
    const [r] = await db.select().from(requests).where(eq(requests.id, requestId));
    if (!r) return { error: "Request not found." };
    const { viewer, org } = await assertOrgAccess(r.orgId, "committee");
    const { data, error } = await createAdminClient().storage.from("receipts").download(r.receiptPath);
    if (error || !data) return { error: "Couldn't load the receipt file." };
    const ai = await readReceipt(r.receiptHash, { bytes: new Uint8Array(await data.arrayBuffer()), mime: r.receiptMime ?? "image/jpeg" });
    const ev = r.eventId ? (await db.select().from(events).where(eq(events.id, r.eventId)))[0] : undefined;
    let committedOther = 0;
    if (ev) {
      const rows = await db
        .select({ id: requests.id, amount: requests.amount })
        .from(requests)
        .where(and(eq(requests.eventId, ev.id), inArray(requests.status, ["draft", "pending", "released"])));
      committedOther = rows.filter((x) => x.id !== r.id).reduce((s, x) => s + x.amount, 0);
    }
    const flags = computeFlags({
      requestedAmount: r.amount,
      extraction: ai.extraction,
      extractionError: ai.error,
      event: ev ? { name: ev.name, category: ev.category, budget: ev.budget } : null,
      eventCommittedOther: committedOther,
    });
    await db.update(requests).set({ flags, updatedAt: new Date() }).where(eq(requests.id, r.id));
    await log(org.id, viewer.id, "ai_checked", ai.cached ? "Receipt check reused (cached)" : "Receipt check re-run", r.id);
    revalidatePath(`/o/${org.slug}`, "layout");
    revalidatePath(`/m/${org.slug}`, "layout");
    return ai.error && !ai.extraction ? { error: ai.error } : { ok: "Receipt checked." };
  } catch (e) {
    return fail(e);
  }
}

/** Drafts (not yet on-chain) can be withdrawn by the filer or an officer. */
export async function deleteDraft(requestId: string): Promise<ActionState> {
  let slug: string;
  try {
    const db = getDb();
    const [r] = await db.select().from(requests).where(eq(requests.id, requestId));
    if (!r) return { error: "Request not found." };
    const { viewer, org, membership } = await assertOrgAccess(r.orgId, "committee");
    if (r.status !== "draft") return { error: "Only drafts can be withdrawn. On-chain requests must be cancelled or rejected." };
    if (r.filedBy !== viewer.id && membership.role === "committee") return { error: "Only the filer or an officer can withdraw this draft." };
    await db.update(requests).set({ status: "cancelled", updatedAt: new Date() }).where(eq(requests.id, r.id));
    await log(org.id, viewer.id, "draft_withdrawn", `Withdrew draft "${r.purpose}"`, r.id);
    slug = org.slug;
  } catch (e) {
    return fail(e);
  }
  redirect(`/o/${slug}/requests`);
}

/** Record which officer submitted a draft on-chain, then reconcile from the tx. */
export async function recordSubmission(requestId: string, txHash: Hash): Promise<ActionState> {
  try {
    const db = getDb();
    const [r] = await db.select().from(requests).where(eq(requests.id, requestId));
    if (!r) return { error: "Request not found." };
    const { viewer, org } = await assertOrgAccess(r.orgId, "officer");
    await syncTx(org, txHash);
    await db.update(requests).set({ submittedBy: viewer.id }).where(eq(requests.id, r.id));
    await log(org.id, viewer.id, "request_submitted", `Submitted "${r.purpose}" to the blockchain`, r.id);
    revalidatePath(`/o/${org.slug}`, "layout");
    revalidatePath(`/m/${org.slug}`, "layout");
    return { ok: "Submitted. Waiting for approvals." };
  } catch (e) {
    return fail(e);
  }
}

/** Members of the signer list as profiles (for the President's activation screen). */
export async function signerWallets(orgId: string) {
  const { org } = await assertOrgAccess(orgId, "president");
  return getDb()
    .select({ userId: memberships.userId, wallet: profiles.walletAddress, name: profiles.fullName })
    .from(memberships)
    .innerJoin(profiles, eq(profiles.id, memberships.userId))
    .where(and(eq(memberships.orgId, org.id), eq(memberships.status, "active"), eq(memberships.isSigner, true)));
}
