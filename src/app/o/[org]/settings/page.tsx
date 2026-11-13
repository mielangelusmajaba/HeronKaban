import { Suspense } from "react";
import { OrgSettingsForm } from "@/components/treasury/admin-widgets";
import { PageHeader } from "@/components/treasury/PageHeader";
import { Badge, Card, PageLoading } from "@/components/ui";
import { requireOrgAccess } from "@/lib/auth";

async function Settings({ params }: PageProps<"/o/[org]/settings">) {
  const { org: slug } = await params;
  const { org } = await requireOrgAccess(slug, "president");
  return (
    <div className="max-w-2xl">
      <PageHeader title="Org settings" />
      <Card className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-gray-700">Verification</span>
        {org.status === "verified" ? (
          <Badge tone="green">Verified</Badge>
        ) : (
          <Badge tone="amber">Unverified: a HeronKaban admin will check this org</Badge>
        )}
      </Card>
      <Card>
        <OrgSettingsForm orgId={org.id} name={org.name} description={org.description} college={org.college} />
      </Card>
    </div>
  );
}

export default function SettingsPage(props: PageProps<"/o/[org]/settings">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Settings {...props} />
    </Suspense>
  );
}
