import Link from "next/link";
import type { ReactNode } from "react";
import type { ExpenseRequest, Flag } from "@/db/schema";
import { explorerTxUrl, isLocalChain, networkLabel } from "@/lib/chain/config";
import { formatPeso } from "@/lib/chain/money";
import { FLAG_LABEL } from "@/lib/checks";
import type { RequestDetail, RequestRow, TimelineItem } from "@/lib/treasury/queries";
import { Badge, Card, EmptyState, cx } from "@/components/ui";

const dateFmt = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });
export const when = (d: Date | string) => dateFmt.format(new Date(d));

export function StatusBadge({ status }: { status: ExpenseRequest["status"] }) {
  switch (status) {
    case "draft":
      return <Badge tone="gray">Draft · not yet on-chain</Badge>;
    case "pending":
      return <Badge tone="amber">Pending approval</Badge>;
    case "released":
      return <Badge tone="green">Released</Badge>;
    case "rejected":
      return <Badge tone="red">Rejected</Badge>;
    case "cancelled":
      return <Badge tone="gray">Cancelled</Badge>;
  }
}

export function FlagBadges({ flags }: { flags: Flag[] }) {
  if (flags.length === 0) return null;
  return <Badge tone="amber">⚑ Needs review ({flags.length})</Badge>;
}

export function FlagList({ flags }: { flags: Flag[] }) {
  if (flags.length === 0) {
    return <p className="text-sm text-green-800">✓ The receipt check found nothing that needs review.</p>;
  }
  return (
    <ul className="space-y-2">
      {flags.map((f, i) => (
        <li key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <p className="font-medium text-amber-900">Needs review · {FLAG_LABEL[f.type]}</p>
          <p className="mt-0.5 text-amber-900/90">{f.note}</p>
        </li>
      ))}
    </ul>
  );
}

export function ChainLabel({ source }: { source: "chain" | "app" }) {
  return source === "chain" ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-800">
      <span aria-hidden>⛓</span> Verified on-chain
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
      <span aria-hidden>🗒</span> Recorded by app
    </span>
  );
}

export function TxLink({ hash }: { hash?: string | null }) {
  if (!hash) return null;
  const url = explorerTxUrl(hash);
  const short = `${hash.slice(0, 10)}…${hash.slice(-6)}`;
  return url ? (
    <a href={url} target="_blank" rel="noreferrer" className="font-mono text-xs text-blue-700 hover:underline">
      {short} ↗
    </a>
  ) : (
    <span className="font-mono text-xs text-gray-500" title={`${hash} (${networkLabel}: no public explorer)`}>
      {short}
    </span>
  );
}

/** Requests as cards on phones and a table from md up. */
export function RequestList({ rows, base, empty }: { rows: RequestRow[]; base: string; empty: string }) {
  if (rows.length === 0) return <EmptyState title={empty} />;
  return (
    <>
      <ul className="space-y-3 md:hidden">
        {rows.map(({ r, eventName, filerName }) => (
          <li key={r.id}>
            <Link href={`${base}/${r.id}`} className="block rounded-xl border border-gray-200 bg-white p-4 active:bg-gray-50">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-gray-900">{r.purpose}</p>
                <p className="shrink-0 font-semibold text-gray-900">{formatPeso(r.amount)}</p>
              </div>
              <p className="mt-0.5 text-xs text-gray-500">
                {eventName ?? "No event"} · {filerName ?? "Officer"} · {when(r.createdAt)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <StatusBadge status={r.status} />
                {r.status === "pending" && (
                  <Badge tone="blue">
                    {r.approvals} of {r.threshold ?? "?"} approvals
                  </Badge>
                )}
                <FlagBadges flags={r.flags} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Expense</th>
              <th className="px-4 py-3 font-medium">Event</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Filed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(({ r, eventName, filerName }) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`${base}/${r.id}`} className="font-medium text-gray-900 hover:text-blue-700 hover:underline">
                    {r.purpose}
                  </Link>
                  <div className="text-xs text-gray-500">by {filerName ?? "Officer"}</div>
                </td>
                <td className="px-4 py-3 text-gray-700">{eventName ?? "—"}</td>
                <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">{formatPeso(r.amount)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <StatusBadge status={r.status} />
                    {r.status === "pending" && (
                      <Badge tone="blue">
                        {r.approvals}/{r.threshold ?? "?"}
                      </Badge>
                    )}
                    <FlagBadges flags={r.flags} />
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-500">{when(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function Timeline({ items, limit }: { items: TimelineItem[]; limit?: number }) {
  const list = limit ? items.slice(0, limit) : items;
  if (list.length === 0) return <EmptyState title="No activity yet." />;
  return (
    <ol className="relative space-y-4 border-l border-gray-200 pl-5">
      {list.map((it) => (
        <li key={it.key} className="relative">
          <span
            className={cx("absolute top-1.5 -left-[26px] size-3 rounded-full ring-4 ring-white", it.source === "chain" ? "bg-green-600" : "bg-gray-400")}
            aria-hidden
          />
          <p className="text-sm font-medium text-gray-900">{it.title}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            <span>{when(it.at)}</span>
            {it.detail && <span>{it.detail}</span>}
            <ChainLabel source={it.source} />
            {it.txHash && <TxLink hash={it.txHash} />}
          </div>
        </li>
      ))}
    </ol>
  );
}

function IntegrityBadge({ integrity }: { integrity: RequestDetail["integrity"] }) {
  switch (integrity) {
    case "match":
      return <Badge tone="green">✓ Receipt matches the on-chain record</Badge>;
    case "mismatch":
      return <Badge tone="red">✕ Receipt does NOT match the on-chain record</Badge>;
    case "not_on_chain":
      return <Badge tone="gray">Not on-chain yet</Badge>;
    default:
      return <Badge tone="gray">Couldn&apos;t check the on-chain record</Badge>;
  }
}

/** The full story of one expense: filed → AI check → approvals → released. */
export function RequestDetailView({ d, actions }: { d: RequestDetail; actions?: ReactNode }) {
  const r = d.request;
  const x = d.check?.extracted;
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold break-words text-gray-900">{r.purpose}</h1>
              <p className="text-sm text-gray-500">
                {d.event ? `Event: ${d.event.name}` : "No event"} · Filed by {d.filerName ?? "an officer"} on {when(r.createdAt)}
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatPeso(r.amount)}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={r.status} />
            <IntegrityBadge integrity={d.integrity} />
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-gray-500">Reimbursed to (wallet)</dt>
              <dd className="font-mono text-xs break-all text-gray-900">{r.payeeAddress}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Receipt fingerprint (SHA-256)</dt>
              <dd className="font-mono text-xs break-all text-gray-900">{r.receiptHash}</dd>
            </div>
            {r.createdTxHash && (
              <div>
                <dt className="text-gray-500">Submitted on-chain</dt>
                <dd>
                  <TxLink hash={r.createdTxHash} /> {d.submitterName && <span className="text-xs text-gray-500">by {d.submitterName}</span>}
                </dd>
              </div>
            )}
            {r.closedTxHash && (
              <div>
                <dt className="text-gray-500">{r.status === "released" ? "Funds released" : "Closed"}</dt>
                <dd>
                  <TxLink hash={r.closedTxHash} />
                </dd>
              </div>
            )}
          </dl>
        </Card>

        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-gray-900">AI receipt check</h2>
            <span className="text-xs text-gray-500">Advisory only · never approves or blocks payment</span>
          </div>
          <FlagList flags={r.flags} />
          {x ? (
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <p className="font-medium text-gray-900">What the AI read from the receipt</p>
              <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-gray-500">Store</dt>
                  <dd>{x.merchant ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Date</dt>
                  <dd>{x.date ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Total</dt>
                  <dd>{x.total != null ? formatPeso(x.total) : "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Items</dt>
                  <dd>{x.items.length}</dd>
                </div>
              </dl>
              {x.items.length > 0 && (
                <ul className="mt-3 divide-y divide-gray-200 border-t border-gray-200">
                  {x.items.map((it, i) => (
                    <li key={i} className="flex justify-between gap-3 py-1.5">
                      <span className="min-w-0 break-words">
                        {it.qty ? `${it.qty} × ` : ""}
                        {it.name}
                        {it.category && <span className="ml-2 text-xs text-gray-500">{it.category}</span>}
                      </span>
                      <span className="shrink-0">{it.amount != null ? formatPeso(it.amount) : ""}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Model: {d.check?.model}. Comparisons are done by plain code, not the AI.
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-600">{d.check?.error ?? "The receipt hasn't been read yet."}</p>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold text-gray-900">Receipt</h2>
          {d.receiptUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL from private storage
            <img src={d.receiptUrl} alt={`Receipt for ${r.purpose}`} className="mt-3 max-h-[70dvh] w-full rounded-lg border border-gray-200 object-contain" />
          ) : (
            <p className="mt-2 text-sm text-gray-600">The receipt image couldn&apos;t be loaded.</p>
          )}
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <h2 className="font-semibold text-gray-900">Approvals</h2>
          {r.status === "draft" ? (
            <p className="mt-2 text-sm text-gray-600">Waiting for a signer officer to submit this to the blockchain.</p>
          ) : (
            <>
              <div className="mt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Distinct officer approvals</span>
                  <span className="font-semibold">
                    {d.chain?.approvals ?? r.approvals} of {r.threshold ?? "?"}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-green-600"
                    style={{ width: `${Math.min(100, ((d.chain?.approvals ?? r.approvals) / Math.max(1, r.threshold ?? 2)) * 100)}%` }}
                  />
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {d.approvers.length === 0 && <li className="text-gray-500">No approvals yet.</li>}
                {d.approvers.map((a) => (
                  <li key={a.txHash} className="rounded-lg bg-green-50 p-2">
                    <p className="font-medium text-green-900">✓ {a.name ?? `${a.address.slice(0, 6)}…${a.address.slice(-4)}`}</p>
                    <p className="text-xs text-green-900/80">
                      {when(a.at)} · <TxLink hash={a.txHash} />
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-gray-500">
                The contract releases the funds by itself when enough different officers approve. Nobody can approve twice.
              </p>
            </>
          )}
        </Card>
        {actions}
        <p className="px-1 text-xs text-gray-500">
          {isLocalChain ? `Running on a ${networkLabel.toLowerCase()} for the demo.` : `Recorded on ${networkLabel}.`}
        </p>
      </div>
    </div>
  );
}
