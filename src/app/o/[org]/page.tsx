import Link from "next/link";
import { Suspense } from "react";
import { RequestList, Timeline } from "@/components/treasury/display";
import { SyncButton } from "@/components/treasury/chain-widgets";
import { PageHeader } from "@/components/treasury/PageHeader";
import { ButtonLink, Card, Notice, PageLoading, Stat } from "@/components/ui";
import { requireOrgAccess } from "@/lib/auth";
import { chainConfigured } from "@/lib/chain/config";
import { formatPeso } from "@/lib/chain/money";
import { getOrgOverview, getTimeline, listRoster } from "@/lib/treasury/queries";

async function Overview({ params }: PageProps<"/o/[org]">) {
  const { org: slug } = await params;
  const { viewer, org, membership } = await requireOrgAccess(slug, "committee");
  const [o, roster] = await Promise.all([getOrgOverview(org), listRoster(org.id)]);
  const timeline = await getTimeline(org, o.chainEvents);
  const base = `/o/${slug}`;
  const signers = roster.filter((r) => r.m.status === "active" && r.m.isSigner);
  const myWallet = viewer.profile.walletAddress;
  const iAmChainSigner = Boolean(myWallet && org.chainSigners?.includes(myWallet));
  const toReview = o.requests.filter((x) => x.r.status === "draft" || x.r.status === "pending");

  const setup = [
    { done: Boolean(myWallet), label: "Link your wallet", href: `${base}/wallet`, who: "Everyone who approves" },
    { done: signers.length >= 2, label: "Choose at least 2 signer officers", href: `${base}/officers`, who: "President" },
    { done: Boolean(org.chainOrgId), label: "Activate the treasury on-chain", href: `${base}/officers`, who: "President" },
    { done: o.events.length > 0, label: "Create an event with a budget", href: `${base}/events`, who: "Officers" },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        description={`Signed in as ${membership.role}${iAmChainSigner ? " · on-chain signer" : ""}`}
        actions={
          <>
            {org.chainOrgId && <SyncButton orgId={org.id} />}
            <ButtonLink href={`${base}/requests/new`}>+ New request</ButtonLink>
          </>
        }
      />

      {!chainConfigured && (
        <div className="mb-4">
          <Notice tone="red">The blockchain isn&apos;t configured (contract addresses missing). Run the local node and deploy script.</Notice>
        </div>
      )}
      {org.chainOrgId && !o.state && (
        <div className="mb-4">
          <Notice tone="red">
            Can&apos;t read this org&apos;s treasury from the blockchain. If the local node was restarted, its data was reset: redeploy and
            re-activate the treasury.
          </Notice>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Balance" value={o.state ? formatPeso(o.state.balance) : "—"} sub={o.state ? "Verified on-chain" : "Treasury not active"} />
        <Stat label="To review" value={toReview.length} sub={`${o.counts.drafts} draft · ${o.counts.pending} pending`} />
        <Stat label="Needs review flags" value={o.counts.flagged} sub="On open requests" />
        <Stat label="Members" value={roster.filter((r) => r.m.status === "active").length} sub={`${signers.length} signer(s)`} />
      </div>

      {setup.some((s) => !s.done) && (
        <Card className="mt-6">
          <h2 className="font-semibold text-gray-900">Set-up checklist</h2>
          <ol className="mt-3 space-y-2">
            {setup.map((s, i) => (
              <li key={s.label} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className={s.done ? "text-gray-500 line-through" : "text-gray-900"}>
                  {i + 1}. {s.label} <span className="text-xs text-gray-500">({s.who})</span>
                </span>
                {!s.done && (
                  <Link href={s.href} className="font-medium text-blue-700 hover:underline">
                    Go →
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </Card>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <section className="space-y-3 xl:col-span-3">
          <h2 className="font-semibold text-gray-900">Open requests</h2>
          <RequestList rows={toReview} base={`${base}/requests`} empty="Nothing waiting. New requests show up here." />
        </section>
        <section className="space-y-3 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent activity</h2>
            <Link href={`${base}/activity`} className="text-sm text-blue-700 hover:underline">
              See all
            </Link>
          </div>
          <Card>
            <Timeline items={timeline} limit={8} />
          </Card>
        </section>
      </div>
    </>
  );
}

export default function OfficerOverviewPage(props: PageProps<"/o/[org]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Overview {...props} />
    </Suspense>
  );
}
