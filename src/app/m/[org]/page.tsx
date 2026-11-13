import Link from "next/link";
import { Suspense } from "react";
import { BudgetBar } from "@/components/treasury/BudgetBar";
import { RequestList, Timeline } from "@/components/treasury/display";
import { Card, EmptyState, Notice, PageLoading, Stat } from "@/components/ui";
import { requireOrgAccess } from "@/lib/auth";
import { formatPeso } from "@/lib/chain/money";
import { getOrgOverview, getTimeline, walletNames } from "@/lib/treasury/queries";

async function Overview({ params }: PageProps<"/m/[org]">) {
  const { org: slug } = await params;
  const { org } = await requireOrgAccess(slug, "member");
  const o = await getOrgOverview(org);
  const timeline = await getTimeline(org, o.chainEvents);
  const signerNames = o.state ? await walletNames(o.state.signers) : new Map<string, string>();
  const base = `/m/${slug}`;
  const pending = o.requests.filter((x) => x.r.status === "pending");
  const released = o.requests.filter((x) => x.r.status === "released");
  const catTotal = o.categories.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-6">
      {!org.chainOrgId ? (
        <Notice tone="amber">
          This org&apos;s treasury isn&apos;t active yet. Once the President activates it, every peso in and out will be recorded on
          the blockchain and shown here.
        </Notice>
      ) : !o.state ? (
        <Notice tone="red">Can&apos;t reach the blockchain right now, so the balance can&apos;t be verified. Try again in a moment.</Notice>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Balance now" value={o.state ? formatPeso(o.state.balance) : "—"} sub={o.state ? "⛓ Verified on-chain" : "Not available"} />
        <Stat label="Money in" value={formatPeso(o.totals.moneyIn)} sub={`${o.totals.deposits} payment(s)`} />
        <Stat label="Money out" value={formatPeso(o.totals.moneyOut)} sub={`${released.length} released expense(s)`} />
        <Stat label="Waiting for approval" value={pending.length} sub={o.counts.flagged ? `${o.counts.flagged} need review` : "Nothing flagged"} />
      </div>

      {o.state && (
        <Card className="text-sm text-gray-700">
          <p>
            <span className="font-semibold text-gray-900">How money leaves:</span> an expense is released only when{" "}
            <strong>
              {o.state.threshold} of {o.state.signers.length}
            </strong>{" "}
            signer officers approve it on the blockchain. Signers:{" "}
            {o.state.signers.map((s) => signerNames.get(s.toLowerCase()) ?? `${s.slice(0, 6)}…`).join(", ")}.
          </p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="font-semibold text-gray-900">Where the money went</h2>
          {o.categories.length === 0 ? (
            <p className="text-sm text-gray-600">No released expenses yet.</p>
          ) : (
            <ul className="space-y-3">
              {o.categories.map((c) => (
                <li key={c.name}>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-800">{c.name}</span>
                    <span className="font-medium">
                      {formatPeso(c.amount)} <span className="text-xs text-gray-500">({Math.round((c.amount / catTotal) * 100)}%)</span>
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full bg-blue-700" style={{ width: `${(c.amount / catTotal) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-gray-500">Categories come from the AI-read receipt items of released expenses.</p>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold text-gray-900">Events: budget vs spent</h2>
          {o.events.length === 0 ? (
            <p className="text-sm text-gray-600">No events yet.</p>
          ) : (
            <ul className="space-y-4">
              {o.events.map((ev) => (
                <li key={ev.id}>
                  <p className="text-sm font-medium text-gray-900">{ev.name}</p>
                  <BudgetBar spent={ev.spent} pending={ev.pending} budget={ev.budget} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Waiting for approval</h2>
          <Link href={`${base}/requests`} className="text-sm text-blue-700 hover:underline">
            See all
          </Link>
        </div>
        <RequestList rows={pending.slice(0, 5)} base={`${base}/requests`} empty="No requests are waiting right now." />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Latest activity</h2>
          <Link href={`${base}/activity`} className="text-sm text-blue-700 hover:underline">
            See all
          </Link>
        </div>
        <Card>{timeline.length ? <Timeline items={timeline} limit={6} /> : <EmptyState title="No activity yet." />}</Card>
      </section>
    </div>
  );
}

export default function MemberOverviewPage(props: PageProps<"/m/[org]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Overview {...props} />
    </Suspense>
  );
}
