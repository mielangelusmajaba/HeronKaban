import { Suspense } from "react";
import { CopyButton, DecideButtons, RemoveButton, ResetCodeButton } from "@/components/treasury/admin-widgets";
import { when } from "@/components/treasury/display";
import { PageHeader } from "@/components/treasury/PageHeader";
import { Badge, Card, EmptyState, PageLoading } from "@/components/ui";
import { requireOrgAccess } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/roles";
import { listRoster } from "@/lib/treasury/queries";

async function Members({ params }: PageProps<"/o/[org]/members">) {
  const { org: slug } = await params;
  const { org, membership } = await requireOrgAccess(slug, "officer");
  const roster = await listRoster(org.id);
  const requests = roster.filter((r) => r.m.status === "pending" && (r.m.requestedRole ?? "member") === "member");
  const active = roster.filter((r) => r.m.status === "active");
  const isPresident = membership.role === "president";

  return (
    <>
      <PageHeader title="Members" description="Approve join requests and share the join code." />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="space-y-3">
            <h2 className="font-semibold text-gray-900">Join requests</h2>
            {requests.length === 0 ? (
              <EmptyState title="No one is waiting." />
            ) : (
              <Card className="!p-0">
                <ul className="divide-y divide-gray-100">
                  {requests.map((r) => (
                    <li key={r.m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{r.name ?? r.email}</p>
                        <p className="truncate text-xs text-gray-500">
                          {r.email} · {r.college ?? "—"} · asked {when(r.m.createdAt)}
                        </p>
                      </div>
                      <DecideButtons membershipId={r.m.id} />
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-gray-900">Roster ({active.length})</h2>
            <Card className="!p-0">
              <ul className="divide-y divide-gray-100">
                {active.map((r) => (
                  <li key={r.m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{r.name ?? r.email}</p>
                      <p className="truncate text-xs text-gray-500">{r.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={r.m.role === "member" ? "gray" : "purple"}>
                        {ROLE_LABEL[r.m.role]}
                        {r.m.positionTitle ? ` · ${r.m.positionTitle}` : ""}
                      </Badge>
                      {r.m.isSigner && <Badge tone="green">Signer</Badge>}
                      {(r.m.role === "member" || (isPresident && r.m.role !== "president")) && <RemoveButton membershipId={r.m.id} />}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        </div>

        <section>
          <Card className="space-y-3">
            <h2 className="font-semibold text-gray-900">Join code</h2>
            <p className="text-sm text-gray-600">Anyone with this code joins instantly as a member. Share it only with your org.</p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded-lg bg-gray-100 px-3 py-2 font-mono text-lg tracking-widest">{org.joinCode}</code>
              <CopyButton text={org.joinCode} />
            </div>
            <ResetCodeButton orgId={org.id} />
          </Card>
        </section>
      </div>
    </>
  );
}

export default function MembersPage(props: PageProps<"/o/[org]/members">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Members {...props} />
    </Suspense>
  );
}
