import "server-only";
import { createHash } from "node:crypto";
import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/db";
import { activity, aiChecks, deposits, events, memberships, profiles, requests, type Org } from "@/db/schema";
import { heronTreasuryAbi } from "@/lib/chain/abi";
import { getPublicClient } from "@/lib/chain/client";
import { TREASURY_ADDRESS } from "@/lib/chain/config";
import { readOrgEvents, readOrgState, reconcileOrg, summarize, type ChainEvent } from "@/lib/chain/ledger";
import { toPesos } from "@/lib/chain/money";
import { categorize } from "@/lib/checks";
import { createAdminClient } from "@/lib/supabase/admin";

const filer = alias(profiles, "filer");

/** Requests with event name and filer name, newest first. */
export async function listRequests(orgId: string) {
  return getDb()
    .select({
      r: requests,
      eventName: events.name,
      filerName: filer.fullName,
    })
    .from(requests)
    .leftJoin(events, eq(events.id, requests.eventId))
    .leftJoin(filer, eq(filer.id, requests.filedBy))
    .where(eq(requests.orgId, orgId))
    .orderBy(desc(requests.createdAt));
}

export type RequestRow = Awaited<ReturnType<typeof listRequests>>[number];

/** wallet (lowercase) → display name, for officers who linked a wallet. */
export async function walletNames(addresses: string[]) {
  const list = [...new Set(addresses.map((a) => a.toLowerCase()))];
  if (list.length === 0) return new Map<string, string>();
  const rows = await getDb()
    .select({ wallet: profiles.walletAddress, name: profiles.fullName })
    .from(profiles)
    .where(inArray(profiles.walletAddress, list));
  return new Map(rows.map((r) => [r.wallet!, r.name ?? "Officer"]));
}

/** Everything the member Overview and the officer Overview need. Chain wins for money. */
export async function getOrgOverview(org: Org) {
  const db = getDb();
  const chainEvents = org.chainOrgId ? await reconcileOrg(org) : [];
  const [state, reqs, evs] = await Promise.all([
    org.chainOrgId ? readOrgState(org.chainOrgId) : Promise.resolve(null),
    listRequests(org.id),
    db.select().from(events).where(eq(events.orgId, org.id)).orderBy(desc(events.createdAt)),
  ]);
  const totals = summarize(chainEvents);

  const eventStats = evs.map((ev) => {
    const mine = reqs.filter((x) => x.r.eventId === ev.id);
    return {
      ...ev,
      spent: mine.filter((x) => x.r.status === "released").reduce((s, x) => s + x.r.amount, 0),
      pending: mine.filter((x) => x.r.status === "pending" || x.r.status === "draft").reduce((s, x) => s + x.r.amount, 0),
    };
  });

  // Spending by category, from the AI-extracted line items of RELEASED expenses.
  const released = reqs.filter((x) => x.r.status === "released");
  const checks = released.length
    ? await db.select().from(aiChecks).where(inArray(aiChecks.receiptHash, released.map((x) => x.r.receiptHash)))
    : [];
  const byHash = new Map(checks.map((c) => [c.receiptHash, c.extracted]));
  const categories = new Map<string, number>();
  for (const x of released) {
    const items = byHash.get(x.r.receiptHash)?.items ?? [];
    const priced = items.filter((i) => typeof i.amount === "number" && i.amount > 0);
    if (priced.length === 0) {
      categories.set("Uncategorized", (categories.get("Uncategorized") ?? 0) + x.r.amount);
      continue;
    }
    const sum = priced.reduce((s, i) => s + (i.amount ?? 0), 0);
    for (const i of priced) {
      const share = (x.r.amount * (i.amount ?? 0)) / sum; // scale to the released amount
      const c = categorize(i);
      categories.set(c, (categories.get(c) ?? 0) + share);
    }
  }

  return {
    state,
    chainEvents,
    totals,
    requests: reqs,
    events: eventStats,
    categories: [...categories.entries()].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount),
    counts: {
      pending: reqs.filter((x) => x.r.status === "pending").length,
      drafts: reqs.filter((x) => x.r.status === "draft").length,
      flagged: reqs.filter((x) => (x.r.status === "pending" || x.r.status === "draft") && x.r.flags.length > 0).length,
    },
  };
}

export type TimelineItem = {
  key: string;
  at: Date;
  title: string;
  detail?: string;
  source: "chain" | "app";
  txHash?: string;
};

const fmt = (n: bigint) => `₱${toPesos(n).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

/** Activity timeline merging on-chain events ("Verified on-chain") with app records ("Recorded by app"). */
export async function getTimeline(org: Org, chainEvents?: ChainEvent[]): Promise<TimelineItem[]> {
  const db = getDb();
  const evs = chainEvents ?? (org.chainOrgId ? await readOrgEvents(org.chainOrgId) : []);
  const names = await walletNames(
    evs.flatMap((e) => [e.args.officer, e.args.requester, e.args.admin].filter((x): x is string => typeof x === "string")),
  );
  const reqRows = await db.select({ id: requests.chainRequestId, purpose: requests.purpose }).from(requests).where(and(eq(requests.orgId, org.id), isNotNull(requests.chainRequestId)));
  const purpose = new Map(reqRows.map((r) => [BigInt(r.id!), r.purpose]));
  const who = (a: unknown) => (typeof a === "string" ? (names.get(a.toLowerCase()) ?? `${a.slice(0, 6)}…${a.slice(-4)}`) : "");
  const what = (id: unknown) => (typeof id === "bigint" ? `"${purpose.get(id) ?? `Request #${id}`}"` : "");

  const chainItems: TimelineItem[] = evs.map((e) => {
    const a = e.args;
    const base = { key: `${e.txHash}-${e.logIndex}`, at: e.at, source: "chain" as const, txHash: e.txHash };
    switch (e.name) {
      case "OrgCreated":
        return { ...base, title: "Treasury activated", detail: `${a.threshold} of ${(a.signers as string[]).length} officer approvals needed to release funds` };
      case "SignersSet":
        return { ...base, title: "Signers changed", detail: `Now ${a.threshold} of ${(a.signers as string[]).length} approvals` };
      case "Deposited":
        return { ...base, title: `Dues received: ${fmt(a.amount as bigint)}` };
      case "RequestCreated":
        return { ...base, title: `Expense request ${what(a.requestId)} submitted: ${fmt(a.amount as bigint)}`, detail: `By ${who(a.requester)}` };
      case "Approved":
        return { ...base, title: `Approved ${what(a.requestId)}`, detail: `By ${who(a.officer)} (${a.approvals} of ${a.threshold})` };
      case "Released":
        return { ...base, title: `Funds released for ${what(a.requestId)}: ${fmt(a.amount as bigint)}` };
      case "Rejected":
        return { ...base, title: `Rejected ${what(a.requestId)}`, detail: `By ${who(a.officer)}` };
      case "Cancelled":
        return { ...base, title: `Cancelled ${what(a.requestId)}`, detail: `By ${who(a.requester)}` };
      case "EventBudgetSet":
        return { ...base, title: `Event budget cap set: ${fmt(a.cap as bigint)}` };
    }
  });

  const appRows = await db
    .select({ a: activity, name: profiles.fullName })
    .from(activity)
    .leftJoin(profiles, eq(profiles.id, activity.actorId))
    .where(eq(activity.orgId, org.id))
    .orderBy(desc(activity.createdAt))
    .limit(200);
  const appItems: TimelineItem[] = appRows.map(({ a, name }) => ({
    key: a.id,
    at: a.createdAt,
    title: a.note ?? a.kind.replaceAll("_", " "),
    detail: name ? `By ${name}` : undefined,
    source: "app",
  }));

  return [...chainItems, ...appItems].sort((x, y) => y.at.getTime() - x.at.getTime());
}

/** Full story of one request, including the receipt-hash integrity check. */
export async function getRequestDetail(org: Org, requestId: string) {
  const db = getDb();
  const submitter = alias(profiles, "submitter");
  const [row] = await db
    .select({ r: requests, ev: events, filerName: filer.fullName, submitterName: submitter.fullName })
    .from(requests)
    .leftJoin(events, eq(events.id, requests.eventId))
    .leftJoin(filer, eq(filer.id, requests.filedBy))
    .leftJoin(submitter, eq(submitter.id, requests.submittedBy))
    .where(and(eq(requests.id, requestId), eq(requests.orgId, org.id)));
  if (!row) return null;
  const { r } = row;

  const [check] = await db.select().from(aiChecks).where(eq(aiChecks.receiptHash, r.receiptHash));

  const storage = createAdminClient().storage.from("receipts");
  const [{ data: signed }, { data: file }] = await Promise.all([storage.createSignedUrl(r.receiptPath, 60 * 10), storage.download(r.receiptPath)]);
  const fileHash = file ? `0x${createHash("sha256").update(new Uint8Array(await file.arrayBuffer())).digest("hex")}` : null;

  // On-chain view of the request (the truth for status and approvals).
  let chain: { status: number; approvals: number; receiptHash: string; amount: number; payee: string } | null = null;
  let approvers: { address: string; name: string | null; at: Date; txHash: string }[] = [];
  if (r.chainRequestId && TREASURY_ADDRESS) {
    try {
      const c = await getPublicClient().readContract({
        address: TREASURY_ADDRESS,
        abi: heronTreasuryAbi,
        functionName: "getRequest",
        args: [BigInt(r.chainRequestId)],
      });
      chain = { status: c.status, approvals: c.approvals, receiptHash: c.receiptHash.toLowerCase(), amount: toPesos(c.amount), payee: c.payee.toLowerCase() };
      const evs = org.chainOrgId ? await readOrgEvents(org.chainOrgId) : [];
      const mine = evs.filter((e) => e.name === "Approved" && e.args.requestId === BigInt(r.chainRequestId!));
      const names = await walletNames(mine.map((e) => e.args.officer as string));
      approvers = mine.map((e) => {
        const addr = (e.args.officer as string).toLowerCase();
        return { address: addr, name: names.get(addr) ?? null, at: e.at, txHash: e.txHash };
      });
    } catch {
      chain = null;
    }
  }

  const integrity: "match" | "mismatch" | "not_on_chain" | "unknown" = !r.chainRequestId
    ? "not_on_chain"
    : !chain || !fileHash
      ? "unknown"
      : chain.receiptHash === fileHash.toLowerCase() && fileHash.toLowerCase() === r.receiptHash
        ? "match"
        : "mismatch";

  return {
    request: r,
    event: row.ev,
    filerName: row.filerName,
    submitterName: row.submitterName,
    check: check ?? null,
    receiptUrl: signed?.signedUrl ?? null,
    chain,
    approvers,
    integrity,
  };
}

export type RequestDetail = NonNullable<Awaited<ReturnType<typeof getRequestDetail>>>;

/** Roster for officers: members with profile info. */
export async function listRoster(orgId: string) {
  return getDb()
    .select({
      m: memberships,
      name: profiles.fullName,
      email: profiles.email,
      college: profiles.college,
      wallet: profiles.walletAddress,
    })
    .from(memberships)
    .innerJoin(profiles, eq(profiles.id, memberships.userId))
    .where(and(eq(memberships.orgId, orgId), inArray(memberships.status, ["active", "pending"])))
    .orderBy(memberships.createdAt);
}

export type RosterRow = Awaited<ReturnType<typeof listRoster>>[number];

/** Deposits with payer names (committee and above only) or the viewer's own. */
export async function listDeposits(orgId: string, onlyUserId?: string) {
  return getDb()
    .select({ d: deposits, name: profiles.fullName, email: profiles.email })
    .from(deposits)
    .innerJoin(profiles, eq(profiles.id, deposits.userId))
    .where(onlyUserId ? and(eq(deposits.orgId, orgId), eq(deposits.userId, onlyUserId)) : eq(deposits.orgId, orgId))
    .orderBy(desc(deposits.createdAt));
}

export async function listEvents(orgId: string) {
  return getDb().select().from(events).where(eq(events.orgId, orgId)).orderBy(desc(events.createdAt));
}
