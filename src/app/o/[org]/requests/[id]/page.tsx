import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RequestActions } from "@/components/treasury/chain-widgets";
import { RequestDetailView } from "@/components/treasury/display";
import { PageLoading } from "@/components/ui";
import { requireOrgAccess } from "@/lib/auth";
import { reconcileOrg } from "@/lib/chain/ledger";
import { roleAtLeast } from "@/lib/roles";
import { getRequestDetail } from "@/lib/treasury/queries";

async function Detail({ params }: PageProps<"/o/[org]/requests/[id]">) {
  const { org: slug, id } = await params;
  const { viewer, org, membership } = await requireOrgAccess(slug, "committee");
  await reconcileOrg(org);
  const d = await getRequestDetail(org, id).catch(() => null);
  if (!d) notFound();
  const r = d.request;
  const myWallet = viewer.profile.walletAddress;
  const iAmSigner = Boolean(myWallet && org.chainSigners?.includes(myWallet) && roleAtLeast(membership.role, "officer"));

  return (
    <>
      <Link href={`/o/${slug}/requests`} className="mb-4 inline-block text-sm text-blue-700 hover:underline">
        ← All requests
      </Link>
      <RequestDetailView
        d={d}
        actions={
          <RequestActions
            orgId={org.id}
            requestId={r.id}
            status={r.status}
            chainOrgId={org.chainOrgId}
            chainRequestId={r.chainRequestId}
            chainEventId={d.event?.chainEventId ?? null}
            amount={r.amount}
            payee={r.payeeAddress}
            receiptHash={r.receiptHash}
            myWallet={myWallet}
            iAmSigner={iAmSigner}
            iSubmitted={r.submittedBy === viewer.id}
            iApproved={Boolean(myWallet && d.approvers.some((a) => a.address === myWallet))}
            canWithdrawDraft={r.filedBy === viewer.id || roleAtLeast(membership.role, "officer")}
            canRecheck
          />
        }
      />
    </>
  );
}

export default function OfficerRequestPage(props: PageProps<"/o/[org]/requests/[id]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Detail {...props} />
    </Suspense>
  );
}
