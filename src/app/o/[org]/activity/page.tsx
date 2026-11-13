import { Suspense } from "react";
import { Timeline } from "@/components/treasury/display";
import { PageHeader } from "@/components/treasury/PageHeader";
import { Card, PageLoading } from "@/components/ui";
import { requireOrgAccess } from "@/lib/auth";
import { getTimeline } from "@/lib/treasury/queries";

async function Activity({ params }: PageProps<"/o/[org]/activity">) {
  const { org: slug } = await params;
  const { org } = await requireOrgAccess(slug, "committee");
  const items = await getTimeline(org);
  return (
    <>
      <PageHeader
        title="Activity log"
        description="Green items come from the blockchain and can't be edited. Gray items are recorded by the app."
      />
      <Card>
        <Timeline items={items} />
      </Card>
    </>
  );
}

export default function ActivityPage(props: PageProps<"/o/[org]/activity">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Activity {...props} />
    </Suspense>
  );
}
