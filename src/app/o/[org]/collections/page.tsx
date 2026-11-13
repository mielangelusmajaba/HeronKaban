import { Suspense } from "react";
import { TxLink, when } from "@/components/treasury/display";
import { PageHeader } from "@/components/treasury/PageHeader";
import { Card, EmptyState, PageLoading, Stat } from "@/components/ui";
import { requireOrgAccess } from "@/lib/auth";
import { formatPeso } from "@/lib/chain/money";
import { listDeposits, listRoster } from "@/lib/treasury/queries";

async function Collections({ params }: PageProps<"/o/[org]/collections">) {
  const { org: slug } = await params;
  const { org } = await requireOrgAccess(slug, "committee");
  const [rows, roster] = await Promise.all([listDeposits(org.id), listRoster(org.id)]);
  const paidBy = new Map<string, number>();
  for (const { d } of rows) paidBy.set(d.userId, (paidBy.get(d.userId) ?? 0) + d.amount);
  const active = roster.filter((r) => r.m.status === "active");
  const unpaid = active.filter((r) => !paidBy.has(r.m.userId));
  const total = rows.reduce((s, { d }) => s + d.amount, 0);

  return (
    <>
      <PageHeader
        title="Collections"
        description="Who has paid dues. Members only see their own payments; this roster is for officers and committee."
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Collected (app records)" value={formatPeso(total)} />
        <Stat label="Paid" value={`${paidBy.size} of ${active.length}`} />
        <Stat label="Not yet paid" value={unpaid.length} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="space-y-3 xl:col-span-2">
          <h2 className="font-semibold text-gray-900">Payments</h2>
          {rows.length === 0 ? (
            <EmptyState title="No dues paid yet." />
          ) : (
            <Card className="!p-0">
              <ul className="divide-y divide-gray-100">
                {rows.map(({ d, name, email }) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{name ?? email}</p>
                      <p className="text-xs text-gray-500">
                        {when(d.createdAt)}
                        {d.note ? ` · ${d.note}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPeso(d.amount)}</p>
                      <TxLink hash={d.txHash} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
        <section className="space-y-3">
          <h2 className="font-semibold text-gray-900">Not yet paid</h2>
          {unpaid.length === 0 ? (
            <EmptyState title="Everyone has paid." />
          ) : (
            <Card>
              <ul className="space-y-1 text-sm">
                {unpaid.map((r) => (
                  <li key={r.m.id} className="truncate">
                    {r.name ?? r.email}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
      </div>
    </>
  );
}

export default function CollectionsPage(props: PageProps<"/o/[org]/collections">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Collections {...props} />
    </Suspense>
  );
}
