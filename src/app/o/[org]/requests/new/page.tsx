import { Suspense } from "react";
import { NewRequestForm } from "@/components/treasury/chain-widgets";
import { PageHeader } from "@/components/treasury/PageHeader";
import { Card, PageLoading } from "@/components/ui";
import { requireOrgAccess } from "@/lib/auth";
import { listEvents } from "@/lib/treasury/queries";

async function NewRequest({ params }: PageProps<"/o/[org]/requests/new">) {
  const { org: slug } = await params;
  const { viewer, org } = await requireOrgAccess(slug, "committee");
  const events = await listEvents(org.id);
  return (
    <div className="max-w-3xl">
      <PageHeader title="New expense request" description="Reimbursement: you already paid, now attach the receipt to get the funds back." />
      <Card>
        <NewRequestForm orgId={org.id} events={events.map((e) => ({ id: e.id, name: e.name }))} defaultPayee={viewer.profile.walletAddress} />
      </Card>
    </div>
  );
}

export default function NewRequestPage(props: PageProps<"/o/[org]/requests/new">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <NewRequest {...props} />
    </Suspense>
  );
}
