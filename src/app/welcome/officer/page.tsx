import Link from "next/link";
import { Suspense } from "react";
import { Card, EmptyState, inputCls, PageLoading, btn, cx } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { listOrgDirectory } from "@/lib/orgs/queries";
import { ROLE_ABILITIES, roleAtLeast } from "@/lib/roles";
import { CreateOrgForm, RequestJoinForm } from "../forms";
import { MyRequests, OrgBadge, WelcomeFrame } from "../shared";

export const metadata = { title: "Officer setup · HeronKaban" };

async function CreateSection() {
  const viewer = await requireViewer();
  return (
    <>
      <MyRequests viewer={viewer} />
      <Card className="space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Create a new organization</h2>
          <p className="text-sm text-gray-600">You&apos;ll become its President and can then invite officers and members.</p>
        </div>
        <CreateOrgForm defaultCollege={viewer.profile.college} />
      </Card>
    </>
  );
}

async function JoinExisting({ searchParams }: PageProps<"/welcome/officer">) {
  const viewer = await requireViewer();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const list = await listOrgDirectory(q);
  const mine = new Map(viewer.memberships.map((m) => [m.orgId, m]));

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">Join an existing org as officer or committee</h2>
        <p className="text-sm text-gray-600">The org&apos;s President approves officer and committee seats.</p>
      </div>
      <form className="flex flex-col gap-2 sm:flex-row" role="search">
        <label htmlFor="q" className="sr-only">
          Search organizations
        </label>
        <input id="q" name="q" defaultValue={q} className={inputCls} placeholder="Search by name or college" />
        <button className={cx(btn.base, btn.secondary, "sm:w-32")}>Search</button>
      </form>
      {list.length === 0 ? (
        <EmptyState title={q ? "No organizations match that search." : "No organizations yet."}>Create one above.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {list.map((o) => {
            const m = mine.get(o.id);
            const seated = m?.status === "active" && roleAtLeast(m.role, "committee");
            return (
              <li key={o.id} className="rounded-lg border border-gray-200 p-4">
                <details>
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-gray-900">{o.name}</span>
                      <span className="block text-xs text-gray-500">{o.college ?? "UMak"}</span>
                    </span>
                    <OrgBadge status={o.status} />
                  </summary>
                  <div className="mt-3">
                    {seated ? (
                      <Link href={`/o/${o.slug}`} className={cx(btn.base, btn.secondary)}>
                        Open officer console
                      </Link>
                    ) : m?.requestedRole && m.requestedRole !== "member" ? (
                      <p className="text-sm text-amber-800">Request sent. Waiting for the President.</p>
                    ) : (
                      <RequestJoinForm orgId={o.id} officerSeat />
                    )}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export default function OfficerSetupPage(props: PageProps<"/welcome/officer">) {
  return (
    <WelcomeFrame
      title="Set up as an officer"
      intro={
        <>
          Officers file and approve expenses. Releasing money always needs approvals from at least two different officers.
        </>
      }
    >
      <Card>
        <h2 className="font-semibold text-gray-900">Who can do what</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {(["president", "officer", "committee", "member"] as const).map((r) => (
            <div key={r} className="rounded-lg bg-gray-50 p-3">
              <dt className="font-semibold text-gray-900 capitalize">{r === "committee" ? "Committee (exec comms)" : r}</dt>
              <dd className="mt-1">
                <ul className="list-disc space-y-0.5 pl-4 text-gray-700">
                  {ROLE_ABILITIES[r].map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      </Card>
      <Suspense fallback={<PageLoading />}>
        <CreateSection />
      </Suspense>
      <Suspense fallback={<PageLoading label="Loading organizations…" />}>
        <JoinExisting {...props} />
      </Suspense>
    </WelcomeFrame>
  );
}
