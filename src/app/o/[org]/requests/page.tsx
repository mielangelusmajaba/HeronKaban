import { Suspense } from "react";
import { RequestList } from "@/components/treasury/display";
import { PageHeader } from "@/components/treasury/PageHeader";
import { ButtonLink, PageLoading } from "@/components/ui";
import { requireOrgAccess } from "@/lib/auth";
import { reconcileOrg } from "@/lib/chain/ledger";
import { listRequests } from "@/lib/treasury/queries";

async function Requests({ params }: PageProps<"/o/[org]/requests">) {
  const { org: slug } = await params;
  const { org } = await requireOrgAccess(slug, "committee");
  await reconcileOrg(org);
  const rows = await listRequests(org.id);
  const base = `/o/${slug}/requests`;
  return (
    <>
      <PageHeader
        title="Expense requests"
        description="Drafts are filed in the app; a signer submits them on-chain, then different officers approve."
        actions={<ButtonLink href={`${base}/new`}>+ New request</ButtonLink>}
      />
      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="font-semibold text-gray-900">Drafts (not yet on-chain)</h2>
          <RequestList rows={rows.filter((x) => x.r.status === "draft")} base={base} empty="No drafts." />
        </section>
        <section className="space-y-3">
          <h2 className="font-semibold text-gray-900">Waiting for approvals</h2>
          <RequestList rows={rows.filter((x) => x.r.status === "pending")} base={base} empty="No pending requests." />
        </section>
        <section className="space-y-3">
          <h2 className="font-semibold text-gray-900">History</h2>
          <RequestList
            rows={rows.filter((x) => ["released", "rejected", "cancelled"].includes(x.r.status))}
            base={base}
            empty="No closed requests yet."
          />
        </section>
      </div>
    </>
  );
}

export default function OfficerRequestsPage(props: PageProps<"/o/[org]/requests">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Requests {...props} />
    </Suspense>
  );
}
