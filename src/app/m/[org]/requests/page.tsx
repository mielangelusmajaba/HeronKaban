import { Suspense } from "react";
import { RequestList } from "@/components/treasury/display";
import { PageLoading } from "@/components/ui";
import { requireOrgAccess } from "@/lib/auth";
import { reconcileOrg } from "@/lib/chain/ledger";
import { listRequests } from "@/lib/treasury/queries";

async function Requests({ params }: PageProps<"/m/[org]/requests">) {
  const { org: slug } = await params;
  const { org } = await requireOrgAccess(slug, "member");
  await reconcileOrg(org);
  const rows = await listRequests(org.id);
  const base = `/m/${slug}/requests`;
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Pending requests</h2>
          <p className="text-sm text-gray-600">
            Expenses officers have asked to be paid back for. Each needs approvals from different officers before money moves.
          </p>
        </div>
        <RequestList rows={rows.filter((x) => x.r.status === "pending")} base={base} empty="No requests are waiting for approval." />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Being prepared</h2>
        <p className="text-sm text-gray-600">Filed with a receipt, not yet submitted to the blockchain.</p>
        <RequestList rows={rows.filter((x) => x.r.status === "draft")} base={base} empty="Nothing being prepared." />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Closed</h2>
        <RequestList
          rows={rows.filter((x) => ["released", "rejected", "cancelled"].includes(x.r.status))}
          base={base}
          empty="No closed requests yet."
        />
      </section>
    </div>
  );
}

export default function MemberRequestsPage(props: PageProps<"/m/[org]/requests">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Requests {...props} />
    </Suspense>
  );
}
