import { Suspense } from "react";
import { Timeline } from "@/components/treasury/display";
import { Card, PageLoading } from "@/components/ui";
import { requireOrgAccess } from "@/lib/auth";
import { getTimeline } from "@/lib/treasury/queries";

async function Activity({ params }: PageProps<"/m/[org]/activity">) {
  const { org: slug } = await params;
  const { org } = await requireOrgAccess(slug, "member");
  const items = await getTimeline(org);
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Activity</h2>
        <p className="text-sm text-gray-600">
          <span className="text-green-800">⛓ Verified on-chain</span> items come straight from the blockchain and can&apos;t be edited.{" "}
          <span className="text-gray-500">🗒 Recorded by app</span> items are kept by HeronKaban.
        </p>
      </div>
      <Card>
        <Timeline items={items} />
      </Card>
    </section>
  );
}

export default function MemberActivityPage(props: PageProps<"/m/[org]/activity">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Activity {...props} />
    </Suspense>
  );
}
