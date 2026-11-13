import { Suspense } from "react";
import { CreateEventForm, EventCapButton } from "@/components/treasury/chain-widgets";
import { PageHeader } from "@/components/treasury/PageHeader";
import { Badge, Card, EmptyState, PageLoading } from "@/components/ui";
import { requireOrgAccess } from "@/lib/auth";
import { formatPeso } from "@/lib/chain/money";
import { roleAtLeast } from "@/lib/roles";
import { getOrgOverview } from "@/lib/treasury/queries";
import { BudgetBar } from "@/components/treasury/BudgetBar";

async function Events({ params }: PageProps<"/o/[org]/events">) {
  const { org: slug } = await params;
  const { viewer, org, membership } = await requireOrgAccess(slug, "committee");
  const o = await getOrgOverview(org);
  const canEdit = roleAtLeast(membership.role, "officer");
  const wallet = viewer.profile.walletAddress;
  const isSigner = Boolean(wallet && org.chainSigners?.includes(wallet));

  return (
    <>
      <PageHeader title="Events & budgets" description="Group expenses by event so members can compare budget and spending." />
      <div className="grid gap-6 xl:grid-cols-5">
        <section className="space-y-3 xl:col-span-3">
          {o.events.length === 0 ? (
            <EmptyState title="No events yet." />
          ) : (
            o.events.map((ev) => (
              <Card key={ev.id} className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{ev.name}</p>
                    <p className="text-xs text-gray-500">#{ev.chainEventId} · {ev.category}</p>
                  </div>
                  {ev.budget != null ? <Badge tone="blue">Budget {formatPeso(ev.budget)}</Badge> : <Badge>No budget</Badge>}
                </div>
                <BudgetBar spent={ev.spent} pending={ev.pending} budget={ev.budget} />
                {canEdit && isSigner && org.chainOrgId && ev.budget != null && (
                  <EventCapButton orgId={org.id} wallet={wallet!} chainOrgId={org.chainOrgId} chainEventId={ev.chainEventId} budget={ev.budget} />
                )}
              </Card>
            ))
          )}
        </section>
        {canEdit && (
          <section className="xl:col-span-2">
            <Card>
              <h2 className="mb-4 font-semibold text-gray-900">New event</h2>
              <CreateEventForm orgId={org.id} />
            </Card>
          </section>
        )}
      </div>
    </>
  );
}

export default function EventsPage(props: PageProps<"/o/[org]/events">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Events {...props} />
    </Suspense>
  );
}
