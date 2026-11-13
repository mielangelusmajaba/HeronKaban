import "server-only";
import { eq } from "drizzle-orm";
import { decodeEventLog, type Address, type Hash, type Log } from "viem";
import { getDb } from "@/db";
import { orgs, requests, type Org } from "@/db/schema";
import { heronTreasuryAbi } from "./abi";
import { getPublicClient } from "./client";
import { chainConfigured, TREASURY_ADDRESS } from "./config";
import { toPesos } from "./money";

/** Treasury event decoded for one org, with its block time. This is the audit trail. */
export type ChainEvent = {
  name: "OrgCreated" | "SignersSet" | "Deposited" | "RequestCreated" | "Approved" | "Released" | "Rejected" | "Cancelled" | "EventBudgetSet";
  args: Record<string, unknown>;
  txHash: Hash;
  blockNumber: bigint;
  logIndex: number;
  at: Date;
};

export type OrgChainState = {
  admin: Address;
  threshold: number;
  balance: number;
  signers: Address[];
};

/** Live on-chain state of an org (the source of truth for money). */
export async function readOrgState(chainOrgId: number): Promise<OrgChainState | null> {
  if (!chainConfigured) return null;
  try {
    const [admin, threshold, balance, signers] = await getPublicClient().readContract({
      address: TREASURY_ADDRESS!,
      abi: heronTreasuryAbi,
      functionName: "getOrg",
      args: [BigInt(chainOrgId)],
    });
    return { admin, threshold: Number(threshold), balance: toPesos(balance), signers: [...signers] };
  } catch {
    return null; // node down or org unknown (e.g. local node restarted)
  }
}

function decode(log: Log) {
  try {
    return decodeEventLog({ abi: heronTreasuryAbi, data: log.data, topics: log.topics });
  } catch {
    return null;
  }
}

/**
 * All treasury events for one org, oldest first. Reads from block 0, which is fine on the
 * local node; on BSC testnet set a deploy block (TODO when switching networks).
 */
export async function readOrgEvents(chainOrgId: number): Promise<ChainEvent[]> {
  if (!chainConfigured) return [];
  const client = getPublicClient();
  let logs: Log[];
  try {
    logs = await client.getLogs({ address: TREASURY_ADDRESS!, fromBlock: BigInt(0), toBlock: "latest" });
  } catch {
    return [];
  }
  const orgId = BigInt(chainOrgId);

  // requestId -> orgId, so request-only events can be attributed.
  const requestOrg = new Map<bigint, bigint>();
  const decoded = logs
    .map((log) => ({ log, ev: decode(log) }))
    .filter((x): x is { log: Log; ev: NonNullable<ReturnType<typeof decode>> } => x.ev !== null);
  for (const { ev } of decoded) {
    if (ev.eventName === "RequestCreated") requestOrg.set(ev.args.requestId, ev.args.orgId);
  }

  const mine = decoded.filter(({ ev }) => {
    const args = ev.args as Record<string, unknown>;
    if (typeof args.orgId === "bigint") return args.orgId === orgId;
    if (typeof args.requestId === "bigint") return requestOrg.get(args.requestId) === orgId;
    return false;
  });

  const blocks = new Map<bigint, Date>();
  await Promise.all(
    [...new Set(mine.map(({ log }) => log.blockNumber!))].map(async (n) => {
      const b = await client.getBlock({ blockNumber: n });
      blocks.set(n, new Date(Number(b.timestamp) * 1000));
    }),
  );

  return mine.map(({ log, ev }) => ({
    name: ev.eventName as ChainEvent["name"],
    args: ev.args as Record<string, unknown>,
    txHash: log.transactionHash!,
    blockNumber: log.blockNumber!,
    logIndex: log.logIndex!,
    at: blocks.get(log.blockNumber!)!,
  }));
}

/** Totals derived from the event log. */
export function summarize(events: ChainEvent[]) {
  let moneyIn = 0;
  let moneyOut = 0;
  let deposits = 0;
  for (const e of events) {
    if (e.name === "Deposited") {
      moneyIn += toPesos(e.args.amount as bigint);
      deposits++;
    }
    if (e.name === "Released") moneyOut += toPesos(e.args.amount as bigint);
  }
  return { moneyIn, moneyOut, deposits };
}

/**
 * Bring the DB caches in line with the chain for one org: request ids, statuses and
 * approval counts, plus the cached signer list. Safe to run any time (idempotent).
 */
export async function reconcileOrg(org: Org): Promise<ChainEvent[]> {
  if (!org.chainOrgId) return [];
  const events = await readOrgEvents(org.chainOrgId);
  const db = getDb();

  const signerEvent = [...events].reverse().find((e) => e.name === "SignersSet" || e.name === "OrgCreated");
  if (signerEvent) {
    const signers = (signerEvent.args.signers as Address[]).map((a) => a.toLowerCase());
    const threshold = Number(signerEvent.args.threshold);
    if (JSON.stringify(org.chainSigners) !== JSON.stringify(signers) || org.chainThreshold !== threshold) {
      await db.update(orgs).set({ chainSigners: signers, chainThreshold: threshold }).where(eq(orgs.id, org.id));
    }
  }

  type Upd = Partial<typeof requests.$inferInsert>;
  const byId = new Map<bigint, Upd & { receiptHash?: string }>();
  for (const e of events) {
    const id = e.args.requestId as bigint | undefined;
    if (id === undefined) continue;
    const u = byId.get(id) ?? {};
    switch (e.name) {
      case "RequestCreated":
        Object.assign(u, {
          chainRequestId: Number(id),
          receiptHash: (e.args.receiptHash as string).toLowerCase(),
          status: "pending",
          approvals: 0,
          createdTxHash: e.txHash,
        });
        break;
      case "Approved":
        u.approvals = Number(e.args.approvals);
        u.threshold = Number(e.args.threshold);
        break;
      case "Released":
        u.status = "released";
        u.closedTxHash = e.txHash;
        break;
      case "Rejected":
        u.status = "rejected";
        u.closedTxHash = e.txHash;
        break;
      case "Cancelled":
        u.status = "cancelled";
        u.closedTxHash = e.txHash;
        break;
    }
    byId.set(id, u);
  }

  for (const { receiptHash, ...u } of byId.values()) {
    if (!receiptHash) continue;
    await db
      .update(requests)
      .set({ ...u, threshold: u.threshold ?? org.chainThreshold ?? undefined, updatedAt: new Date() })
      .where(eq(requests.receiptHash, receiptHash));
  }
  return events;
}

/** Wait for a tx the app or an officer sent, check it hit our treasury, then reconcile. */
export async function syncTx(org: Org, txHash: Hash) {
  const receipt = await getPublicClient().waitForTransactionReceipt({ hash: txHash, timeout: 60_000 });
  if (receipt.to?.toLowerCase() !== TREASURY_ADDRESS?.toLowerCase()) throw new Error("That transaction wasn't sent to the treasury.");
  if (receipt.status !== "success") throw new Error("The transaction failed on-chain.");
  await reconcileOrg(org);
  return receipt;
}

/** Find the OrgCreated event in a tx (used when the President activates the treasury). */
export async function readOrgCreated(txHash: Hash) {
  const receipt = await getPublicClient().waitForTransactionReceipt({ hash: txHash, timeout: 60_000 });
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== TREASURY_ADDRESS?.toLowerCase()) continue;
    const ev = decode(log);
    if (ev?.eventName === "OrgCreated") return ev.args;
  }
  return null;
}
