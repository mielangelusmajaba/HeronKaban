import { Suspense } from "react";
import { DecideButtons, PresidentSignerToggle, RoleForm } from "@/components/treasury/admin-widgets";
import { TreasurySetup } from "@/components/treasury/chain-widgets";
import { PageHeader } from "@/components/treasury/PageHeader";
import { Badge, Card, EmptyState, Notice, PageLoading } from "@/components/ui";
import { requireOrgAccess } from "@/lib/auth";
import { reconcileOrg } from "@/lib/chain/ledger";
import { ROLE_LABEL } from "@/lib/roles";
import { listRoster } from "@/lib/treasury/queries";

async function Officers({ params }: PageProps<"/o/[org]/officers">) {
  const { org: slug } = await params;
  const { viewer, org, membership } = await requireOrgAccess(slug, "president");
  await reconcileOrg(org);
  const roster = await listRoster(org.id);
  const seatRequests = roster.filter((r) => r.m.requestedRole && r.m.requestedRole !== "member");
  const team = roster.filter((r) => r.m.status === "active" && r.m.role !== "member" && r.m.role !== "president");
  const members = roster.filter((r) => r.m.status === "active" && r.m.role === "member");
  const signers = roster.filter((r) => r.m.status === "active" && r.m.isSigner).map((r) => ({ name: r.name, wallet: r.wallet }));

  return (
    <>
      <PageHeader
        title="Officers & roles"
        description="Approve officer seats, choose who signs on-chain, and set the approval rule. Only the President sees this page."
      />

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <section className="space-y-3">
            <h2 className="font-semibold text-gray-900">Seat requests</h2>
            {seatRequests.length === 0 ? (
              <EmptyState title="No officer or committee requests." />
            ) : (
              <Card className="!p-0">
                <ul className="divide-y divide-gray-100">
                  {seatRequests.map((r) => (
                    <li key={r.m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{r.name ?? r.email}</p>
                        <p className="text-xs text-gray-500">
                          Wants: {ROLE_LABEL[r.m.requestedRole!]}
                          {r.m.positionTitle ? ` · ${r.m.positionTitle}` : ""}
                          {r.m.status === "active" ? " · already a member" : ""}
                        </p>
                        {r.m.note && <p className="mt-1 text-xs text-gray-700">&ldquo;{r.m.note}&rdquo;</p>}
                      </div>
                      <DecideButtons membershipId={r.m.id} />
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-gray-900">Officers & committee</h2>
            <Card className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{viewer.profile.fullName} (you)</p>
                <Badge tone="purple">President{membership.positionTitle && membership.positionTitle !== "President" ? ` · ${membership.positionTitle}` : ""}</Badge>
              </div>
              <PresidentSignerToggle orgId={org.id} isSigner={membership.isSigner} />
            </Card>
            {team.length === 0 && <EmptyState title="No officers yet.">Approve seat requests above, or promote a member below.</EmptyState>}
            {team.map((r) => (
              <Card key={r.m.id} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{r.name ?? r.email}</p>
                    <p className="text-xs text-gray-500">{r.wallet ? `Wallet ${r.wallet.slice(0, 6)}…${r.wallet.slice(-4)}` : "No wallet linked"}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Badge tone="purple">{ROLE_LABEL[r.m.role]}</Badge>
                    {r.m.isSigner && <Badge tone="green">Signer</Badge>}
                  </div>
                </div>
                <RoleForm membershipId={r.m.id} role={r.m.role as "officer" | "committee"} positionTitle={r.m.positionTitle} isSigner={r.m.isSigner} hasWallet={Boolean(r.wallet)} />
              </Card>
            ))}
          </section>

          {members.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-semibold text-gray-900">Promote a member</h2>
              {members.map((r) => (
                <details key={r.m.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <summary className="cursor-pointer font-medium text-gray-900">{r.name ?? r.email}</summary>
                  <div className="mt-3">
                    <RoleForm membershipId={r.m.id} role="member" positionTitle={r.m.positionTitle} isSigner={false} hasWallet={Boolean(r.wallet)} />
                  </div>
                </details>
              ))}
            </section>
          )}
        </div>

        <section className="space-y-3 xl:col-span-2">
          <h2 className="font-semibold text-gray-900">Treasury on the blockchain</h2>
          <Card className="space-y-4">
            {org.chainOrgId ? (
              <Notice tone="green">
                Active (treasury #{org.chainOrgId}). Funds release only when {org.chainThreshold} different signers approve.
              </Notice>
            ) : (
              <Notice>
                Activating creates your org&apos;s treasury in the smart contract with the signers and rule below. You sign it with your
                own wallet; HeronKaban can&apos;t do it for you.
              </Notice>
            )}
            <TreasurySetup
              orgId={org.id}
              chainOrgId={org.chainOrgId}
              presidentWallet={viewer.profile.walletAddress}
              signers={signers}
              chainSigners={org.chainSigners}
              chainThreshold={org.chainThreshold}
            />
            <p className="text-xs text-gray-500">
              Changing signers is public: members see &quot;Signers changed&quot; in the activity log. Pending requests must be approved
              again by the new signers.
            </p>
          </Card>
        </section>
      </div>
    </>
  );
}

export default function OfficersPage(props: PageProps<"/o/[org]/officers">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Officers {...props} />
    </Suspense>
  );
}
