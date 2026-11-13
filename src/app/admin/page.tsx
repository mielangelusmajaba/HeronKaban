import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { VerifyButton } from "@/components/treasury/admin-widgets";
import { when } from "@/components/treasury/display";
import { PageHeader } from "@/components/treasury/PageHeader";
import { Badge, Card, EmptyState, PageLoading } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { listOrgDirectory } from "@/lib/orgs/queries";
import { getDb } from "@/db";
import { orgs } from "@/db/schema";

export const metadata = { title: "Admin · HeronKaban" };

async function Admin() {
  const viewer = await requireViewer();
  if (!viewer.isPlatformAdmin) redirect("/auth/continue");
  const [dir, rows] = await Promise.all([listOrgDirectory(), getDb().select({ id: orgs.id, createdAt: orgs.createdAt }).from(orgs)]);
  const created = new Map(rows.map((r) => [r.id, r.createdAt]));
  return (
    <>
      <AppHeader viewer={viewer} />
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <PageHeader title="Verify organizations" description="Check that each org is a real UMak student organization before marking it verified." />
        {dir.length === 0 ? (
          <EmptyState title="No organizations yet." />
        ) : (
          <Card className="!p-0">
            <ul className="divide-y divide-gray-100">
              {dir.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{o.name}</p>
                    <p className="text-xs text-gray-500">
                      {o.college ?? "—"} · {o.members} member(s) · created {when(created.get(o.id)!)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {o.status === "verified" ? <Badge tone="green">Verified</Badge> : <Badge tone="amber">Unverified</Badge>}
                    <VerifyButton orgId={o.id} verified={o.status === "verified"} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </main>
    </>
  );
}

export default function AdminPage() {
  return (
    <div className="min-h-dvh bg-gray-50">
      <Suspense fallback={<PageLoading />}>
        <Admin />
      </Suspense>
    </div>
  );
}
