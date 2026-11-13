import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RequestDetailView } from "@/components/treasury/display";
import { PageLoading } from "@/components/ui";
import { requireOrgAccess } from "@/lib/auth";
import { roleAtLeast } from "@/lib/roles";
import { getRequestDetail } from "@/lib/treasury/queries";

async function Detail({ params }: PageProps<"/m/[org]/requests/[id]">) {
  const { org: slug, id } = await params;
  const { org, membership } = await requireOrgAccess(slug, "member");
  const d = await getRequestDetail(org, id).catch(() => null);
  if (!d) notFound();
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link href={`/m/${slug}/requests`} className="text-sm text-blue-700 hover:underline">
          ← All requests
        </Link>
        {roleAtLeast(membership.role, "committee") && (
          <Link href={`/o/${slug}/requests/${id}`} className="text-sm font-medium text-blue-700 hover:underline">
            Open in officer console →
          </Link>
        )}
      </div>
      <RequestDetailView d={d} />
    </>
  );
}

export default function MemberRequestDetailPage(props: PageProps<"/m/[org]/requests/[id]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Detail {...props} />
    </Suspense>
  );
}
