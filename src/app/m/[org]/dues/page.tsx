import { Suspense } from "react";
import { PayDuesForm } from "@/components/treasury/chain-widgets";
import { TxLink, when } from "@/components/treasury/display";
import { Card, EmptyState, PageLoading } from "@/components/ui";
import { requireOrgAccess } from "@/lib/auth";
import { formatPeso } from "@/lib/chain/money";
import { listDeposits } from "@/lib/treasury/queries";

async function Dues({ params }: PageProps<"/m/[org]/dues">) {
  const { org: slug } = await params;
  const { viewer, org } = await requireOrgAccess(slug, "member");
  const mine = await listDeposits(org.id, viewer.id);
  const total = mine.reduce((s, { d }) => s + d.amount, 0);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Pay dues</h2>
        <PayDuesForm orgId={org.id} active={Boolean(org.chainOrgId)} />
      </Card>
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">My payments</h2>
          <p className="text-sm text-gray-600">Only you (and your org&apos;s officers) can see these by name. Total: {formatPeso(total)}</p>
        </div>
        {mine.length === 0 ? (
          <EmptyState title="You haven't paid any dues yet." />
        ) : (
          <Card className="!p-0">
            <ul className="divide-y divide-gray-100">
              {mine.map(({ d }) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{formatPeso(d.amount)}</p>
                    <p className="text-xs text-gray-500">
                      {when(d.createdAt)}
                      {d.note ? ` · ${d.note}` : ""}
                    </p>
                  </div>
                  <div className="text-right text-xs text-green-800">
                    ⛓ On-chain
                    <div>
                      <TxLink hash={d.txHash} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}

export default function DuesPage(props: PageProps<"/m/[org]/dues">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Dues {...props} />
    </Suspense>
  );
}
