"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition, type ReactNode } from "react";
import type { Address, Hash } from "viem";
import { Button, Card, Field, inputCls, Notice } from "@/components/ui";
import { walletLinkMessage } from "@/lib/chain/link-message";
import { toUnits } from "@/lib/chain/money";
import { connectWallet, ensureChain, explain, hasWallet, short, signLinkMessage, writeTreasury } from "@/lib/chain/wallet";
import {
  activateTreasury,
  createEvent,
  deleteDraft,
  fileRequest,
  linkWallet,
  payDues,
  recheckReceipt,
  recordSubmission,
  syncOrg,
  unlinkWallet,
} from "@/lib/treasury/actions";

type Msg = { error?: string; ok?: string } | undefined;

function Status({ msg }: { msg: Msg }) {
  if (!msg) return null;
  return msg.error ? <Notice tone="red">{msg.error}</Notice> : msg.ok ? <Notice tone="green">{msg.ok}</Notice> : null;
}

/** Runs a wallet transaction, then asks the server to read it back from the chain. */
function useChainStep() {
  const router = useRouter();
  const [msg, setMsg] = useState<Msg>();
  const [busy, setBusy] = useState<string | null>(null);
  async function run(label: string, send: () => Promise<Hash>, after: (hash: Hash) => Promise<Msg>) {
    setMsg(undefined);
    setBusy(`${label}: confirm in your wallet…`);
    try {
      const hash = await send();
      setBusy(`${label}: waiting for the blockchain…`);
      const res = await after(hash);
      setMsg(res ?? { ok: "Done." });
      router.refresh();
    } catch (e) {
      setMsg({ error: explain(e) });
    } finally {
      setBusy(null);
    }
  }
  return { msg, busy, run, setMsg };
}

// ───────────────────────── Sync ─────────────────────────

export function SyncButton({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<Msg>();
  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setMsg(await syncOrg(orgId));
            router.refresh();
          })
        }
      >
        {pending ? "Checking…" : "↻ Refresh from blockchain"}
      </Button>
      {msg?.error && <Notice tone="red">{msg.error}</Notice>}
    </div>
  );
}

// ───────────────────────── Wallet link ─────────────────────────

export function WalletLink({ userId, linked }: { userId: string; linked: string | null }) {
  const router = useRouter();
  const [msg, setMsg] = useState<Msg>();
  const [busy, setBusy] = useState(false);

  async function link() {
    setMsg(undefined);
    setBusy(true);
    try {
      await ensureChain();
      const address = await connectWallet();
      const issuedAt = new Date().toISOString();
      const signature = await signLinkMessage(address, walletLinkMessage(userId, address, issuedAt));
      setMsg(await linkWallet(address, issuedAt, signature));
      router.refresh();
    } catch (e) {
      setMsg({ error: explain(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {linked ? (
        <p className="text-sm">
          Linked wallet: <span className="font-mono">{short(linked)}</span>
        </p>
      ) : (
        <p className="text-sm text-gray-600">No wallet linked yet.</p>
      )}
      {!hasWalletSafe() && (
        <Notice tone="amber">
          No browser wallet found. Install MetaMask, then reload this page. Members don&apos;t need a wallet: only signer officers do.
        </Notice>
      )}
      <div className="flex flex-wrap gap-2">
        <Button onClick={link} disabled={busy}>
          {busy ? "Check your wallet…" : linked ? "Link a different wallet" : "Connect & link wallet"}
        </Button>
        {linked && (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={async () => {
              setMsg(await unlinkWallet());
              router.refresh();
            }}
          >
            Unlink
          </Button>
        )}
      </div>
      <Status msg={msg} />
    </div>
  );
}

function hasWalletSafe() {
  try {
    return typeof window === "undefined" ? true : hasWallet();
  } catch {
    return false;
  }
}

// ───────────────────────── Treasury activation / signers ─────────────────────────

export function TreasurySetup(props: {
  orgId: string;
  chainOrgId: number | null;
  presidentWallet: string | null;
  signers: { name: string | null; wallet: string | null }[];
  chainSigners: string[] | null;
  chainThreshold: number | null;
}) {
  const { msg, busy, run } = useChainStep();
  const ready = props.signers.filter((s) => s.wallet) as { name: string | null; wallet: string }[];
  const missing = props.signers.filter((s) => !s.wallet);
  const [threshold, setThreshold] = useState(Math.max(2, Math.min(props.chainThreshold ?? 2, ready.length || 2)));
  const wallets = ready.map((s) => s.wallet.toLowerCase());
  const same =
    props.chainSigners != null &&
    props.chainThreshold === threshold &&
    props.chainSigners.length === wallets.length &&
    wallets.every((w) => props.chainSigners!.includes(w));

  const canSend = props.presidentWallet && ready.length >= 2 && threshold >= 2 && threshold <= ready.length;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-900">Signers (officers who approve on-chain)</p>
        <ul className="mt-2 space-y-1 text-sm">
          {ready.map((s) => (
            <li key={s.wallet} className="flex justify-between gap-2">
              <span>{s.name ?? "Officer"}</span>
              <span className="font-mono text-xs text-gray-600">{short(s.wallet)}</span>
            </li>
          ))}
          {missing.map((s, i) => (
            <li key={i} className="text-amber-800">
              {s.name ?? "An officer"} hasn&apos;t linked a wallet yet, so they can&apos;t be a signer.
            </li>
          ))}
          {props.signers.length === 0 && <li className="text-gray-600">Mark at least 2 officers as signers below.</li>}
        </ul>
      </div>
      <Field label="Approvals needed to release funds" hint="At least 2, so no single officer can move money.">
        <select className={inputCls} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))}>
          {Array.from({ length: Math.max(1, ready.length - 1) }, (_, i) => i + 2).map((n) => (
            <option key={n} value={n}>
              {n} of {Math.max(ready.length, n)}
            </option>
          ))}
        </select>
      </Field>
      {!props.presidentWallet && <Notice tone="amber">Link your own wallet first (My wallet). It becomes the org&apos;s admin wallet on-chain.</Notice>}
      {ready.length < 2 && <Notice tone="amber">You need at least 2 signer officers with linked wallets.</Notice>}

      {props.chainOrgId == null ? (
        <Button
          disabled={!canSend || !!busy}
          onClick={() =>
            run(
              "Activate treasury",
              () => writeTreasury(props.presidentWallet as Address, { functionName: "createOrg", args: [wallets as Address[], threshold] }),
              (hash) => activateTreasury(props.orgId, hash),
            )
          }
        >
          Activate treasury on-chain
        </Button>
      ) : same ? (
        <Notice tone="green">On-chain signers match this list ({props.chainThreshold} approvals needed).</Notice>
      ) : (
        <Button
          disabled={!canSend || !!busy}
          onClick={() =>
            run(
              "Update signers",
              () =>
                writeTreasury(props.presidentWallet as Address, {
                  functionName: "setSigners",
                  args: [BigInt(props.chainOrgId!), wallets as Address[], threshold],
                }),
              (hash) => syncOrg(props.orgId, hash),
            )
          }
        >
          Update signers on-chain
        </Button>
      )}
      {busy && <Notice>{busy}</Notice>}
      <Status msg={msg} />
    </div>
  );
}

// ───────────────────────── Request actions ─────────────────────────

export function RequestActions(props: {
  orgId: string;
  requestId: string;
  status: "draft" | "pending" | "released" | "rejected" | "cancelled";
  chainOrgId: number | null;
  chainRequestId: number | null;
  chainEventId: number | null;
  amount: number;
  payee: string;
  receiptHash: string;
  myWallet: string | null;
  iAmSigner: boolean;
  iSubmitted: boolean;
  iApproved: boolean;
  canWithdrawDraft: boolean;
  canRecheck: boolean;
}) {
  const { msg, busy, run, setMsg } = useChainStep();
  const [pending, start] = useTransition();
  const wallet = props.myWallet as Address | null;
  const signerReady = props.iAmSigner && wallet && props.chainOrgId != null;

  const body: ReactNode[] = [];

  if (props.status === "draft") {
    if (signerReady) {
      body.push(
        <Button
          key="submit"
          className="w-full"
          disabled={!!busy}
          onClick={() =>
            run(
              "Submit",
              () =>
                writeTreasury(wallet!, {
                  functionName: "createRequest",
                  args: [
                    BigInt(props.chainOrgId!),
                    toUnits(props.amount),
                    props.payee as Address,
                    BigInt(props.chainEventId ?? 0),
                    props.receiptHash as `0x${string}`,
                  ],
                }),
              (hash) => recordSubmission(props.requestId, hash),
            )
          }
        >
          Submit to blockchain
        </Button>,
      );
    } else {
      body.push(
        <p key="why" className="text-sm text-gray-600">
          {props.chainOrgId == null
            ? "The treasury isn't active yet. The President activates it from Officers & roles."
            : "A signer officer with a linked wallet must submit this draft on-chain."}
        </p>,
      );
    }
    if (props.canWithdrawDraft) {
      body.push(
        <Button key="withdraw" variant="secondary" className="w-full" disabled={pending} onClick={() => start(async () => setMsg(await deleteDraft(props.requestId)))}>
          Withdraw draft
        </Button>,
      );
    }
  }

  if (props.status === "pending") {
    if (signerReady) {
      const id = BigInt(props.chainRequestId!);
      body.push(
        <Button
          key="approve"
          className="w-full"
          disabled={!!busy || props.iApproved}
          onClick={() => run("Approve", () => writeTreasury(wallet!, { functionName: "approve", args: [id] }), (hash) => syncOrg(props.orgId, hash))}
        >
          {props.iApproved ? "✓ You approved this" : "Approve"}
        </Button>,
        <Button
          key="reject"
          variant="danger"
          className="w-full"
          disabled={!!busy}
          onClick={() => {
            if (!confirm("Reject this request? It will be closed and no funds will move. This can't be undone.")) return;
            run("Reject", () => writeTreasury(wallet!, { functionName: "reject", args: [id] }), (hash) => syncOrg(props.orgId, hash));
          }}
        >
          Reject
        </Button>,
      );
      if (props.iSubmitted) {
        body.push(
          <Button
            key="cancel"
            variant="secondary"
            className="w-full"
            disabled={!!busy}
            onClick={() => run("Cancel", () => writeTreasury(wallet!, { functionName: "cancel", args: [id] }), (hash) => syncOrg(props.orgId, hash))}
          >
            Cancel my request
          </Button>,
        );
      }
    } else {
      body.push(
        <p key="why" className="text-sm text-gray-600">
          Only signer officers with a linked wallet can approve or reject.
        </p>,
      );
    }
  }

  if (props.canRecheck && (props.status === "draft" || props.status === "pending")) {
    body.push(
      <Button key="recheck" variant="ghost" className="w-full" disabled={pending} onClick={() => start(async () => setMsg(await recheckReceipt(props.requestId)))}>
        {pending ? "Checking…" : "Re-run receipt check"}
      </Button>,
    );
  }

  if (body.length === 0) return null;
  return (
    <Card className="space-y-3">
      <h2 className="font-semibold text-gray-900">Officer actions</h2>
      {body}
      {busy && <Notice>{busy}</Notice>}
      <Status msg={msg} />
    </Card>
  );
}

// ───────────────────────── Forms ─────────────────────────

export function NewRequestForm({
  orgId,
  events,
  defaultPayee,
}: {
  orgId: string;
  events: { id: string; name: string }[];
  defaultPayee: string | null;
}) {
  const [state, action, pending] = useActionState(fileRequest, undefined);
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="orgId" value={orgId} />
      <Field label="What was it for?">
        <input name="purpose" className={inputCls} required minLength={5} maxLength={300} placeholder="e.g. Tarpaulin and markers for Org Week booth" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount spent (₱)">
          <input name="amount" type="number" inputMode="decimal" step="0.01" min="0.01" className={inputCls} required />
        </Field>
        <Field label="Event">
          <select name="eventId" className={inputCls} defaultValue="">
            <option value="">No event</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Reimburse to (wallet)" hint="Reimbursement model: usually the wallet of the officer who paid. Defaults to yours.">
        <input name="payeeAddress" className={`${inputCls} font-mono`} defaultValue={defaultPayee ?? ""} required placeholder="0x…" />
      </Field>
      <Field label="Receipt photo" hint="JPG, PNG or WebP, up to 10 MB. Use sample receipts only for the prototype.">
        <input
          name="receipt"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          required
          className="block w-full text-sm file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:font-semibold file:text-blue-800"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
        />
      </Field>
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
        <img src={preview} alt="Receipt preview" className="max-h-72 rounded-lg border border-gray-200 object-contain" />
      )}
      <Notice>
        After you file, the AI reads the receipt and simple rules compare it with your request and the event budget. The request
        starts as a draft; a signer officer then submits it to the blockchain, and it needs approvals from different officers.
      </Notice>
      <Status msg={state} />
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Uploading & checking receipt…" : "File expense request"}
      </Button>
    </form>
  );
}

export function CreateEventForm({ orgId }: { orgId: string }) {
  const [state, action, pending] = useActionState(createEvent, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="orgId" value={orgId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Event name">
          <input name="name" className={inputCls} required minLength={2} maxLength={100} placeholder="e.g. Org Week 2026" />
        </Field>
        <Field label="Type" hint="Used by the purchase-mix check (food on a non-food event needs review).">
          <select name="category" className={inputCls} defaultValue="general">
            <option value="general">General / meeting</option>
            <option value="food">Food / celebration</option>
            <option value="seminar">Seminar / workshop</option>
            <option value="sports">Sports</option>
            <option value="outreach">Outreach</option>
            <option value="competition">Competition</option>
            <option value="other">Other</option>
          </select>
        </Field>
      </div>
      <Field label="Budget (₱, optional)">
        <input name="budget" type="number" inputMode="decimal" step="0.01" min="0" className={inputCls} />
      </Field>
      <Field label="Description (optional)">
        <input name="description" className={inputCls} maxLength={500} />
      </Field>
      <Status msg={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Create event"}
      </Button>
    </form>
  );
}

/** Stretch (FR-10): lock an event's budget into the contract so over-budget requests revert. */
export function EventCapButton({ orgId, wallet, chainOrgId, chainEventId, budget }: { orgId: string; wallet: string; chainOrgId: number; chainEventId: number; budget: number }) {
  const { msg, busy, run } = useChainStep();
  return (
    <div className="space-y-2">
      <Button
        variant="secondary"
        className="!min-h-9 text-xs"
        disabled={!!busy}
        onClick={() =>
          run(
            "Lock budget",
            () => writeTreasury(wallet as Address, { functionName: "setEventBudget", args: [BigInt(chainOrgId), BigInt(chainEventId), toUnits(budget)] }),
            (hash) => syncOrg(orgId, hash),
          )
        }
      >
        Lock budget on-chain
      </Button>
      {busy && <p className="text-xs text-gray-600">{busy}</p>}
      <Status msg={msg} />
    </div>
  );
}

export function PayDuesForm({ orgId, active }: { orgId: string; active: boolean }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(async (prev: Msg, form: FormData) => {
    const res = await payDues(prev, form);
    router.refresh();
    return res;
  }, undefined);
  if (!active) return <Notice tone="amber">Paying dues opens once the President activates the org&apos;s treasury.</Notice>;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="orgId" value={orgId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount (₱, test pesos)">
          <input name="amount" type="number" inputMode="decimal" step="0.01" min="1" defaultValue="100" className={inputCls} required />
        </Field>
        <Field label="For (optional)">
          <input name="note" className={inputCls} maxLength={120} placeholder="e.g. 1st sem membership fee" />
        </Field>
      </div>
      <Notice tone="amber">
        Prototype: this pays with play-money &quot;test pesos&quot; from an app-managed demo wallet. No real money moves. The
        blockchain records the payment with a coded reference, not your name.
      </Notice>
      <Status msg={state} />
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Recording on the blockchain…" : "Pay dues"}
      </Button>
    </form>
  );
}
