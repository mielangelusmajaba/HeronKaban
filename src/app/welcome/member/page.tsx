import Link from "next/link";
import { Suspense } from "react";
import { Card, EmptyState, inputCls, PageLoading, btn, cx } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { listOrgDirectory } from "@/lib/orgs/queries";
import { JoinCodeForm, RequestJoinForm } from "../forms";
import { MyRequests, OrgBadge, WelcomeFrame } from "../shared";

export const metadata = { title: "Join an organization · HeronKaban" };

async function Directory({ searchParams }: PageProps<"/welcome/member">) {
  const viewer = await requireViewer();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const list = await listOrgDirectory(q);
  const mine = new Map(viewer.memberships.map((m) => [m.orgId, m]));

  return (
    <>
      <MyRequests viewer={viewer} />
      <Card className="space-y-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold text-gray-900">Find your organization</h2>
          <p className="text-sm text-gray-600">No code? Send a request and an officer will approve it.</p>
        </div>
        <form className="flex flex-col gap-2 sm:flex-row" role="search">
          <label htmlFor="q" className="sr-only">
            Search organizations
          </label>
          <input id="q" name="q" defaultValue={q} className={inputCls} placeholder="Search by name or college" />
          <button className={cx(btn.base, btn.secondary, "sm:w-32")}>Search</button>
        </form>
        {list.length === 0 ? (
          <EmptyState title={q ? "No organizations match that search." : "No organizations yet."}>
            If your org isn&apos;t here yet, ask an officer to create it from the{" "}
            <Link href="/welcome/officer" className="text-blue-700 underline">
              officer option
            </Link>
            .
          </EmptyState>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {list.map((o) => {
              const m = mine.get(o.id);
              return (
                <li key={o.id} className="flex flex-col rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-gray-900">{o.name}</p>
                    <OrgBadge status={o.status} />
                  </div>
                  <p className="text-xs text-gray-500">
                    {o.college ?? "UMak"} · {o.members} member{o.members === 1 ? "" : "s"}
                  </p>
                  {o.description && <p className="mt-2 line-clamp-3 text-sm text-gray-700">{o.description}</p>}
                  <div className="mt-auto pt-3">
                    {m?.status === "active" ? (
                      <Link href={`/m/${o.slug}`} className={cx(btn.base, btn.secondary, "w-full sm:w-auto")}>
                        Open
                      </Link>
                    ) : m?.status === "pending" ? (
                      <p className="text-sm text-amber-800">Request sent. Waiting for approval.</p>
                    ) : (
                      <RequestJoinForm orgId={o.id} />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}

export default function JoinAsMemberPage(props: PageProps<"/welcome/member">) {
  return (
    <WelcomeFrame
      title="Join your organization"
      intro="As a member you can see your org's balance, every expense with its receipt and AI notes, and the officers' pending requests."
    >
      <Card className="space-y-3">
        <h2 className="font-semibold text-gray-900">Have a join code?</h2>
        <p className="text-sm text-gray-600">Officers share an 8-character code. Entering it joins you right away.</p>
        <JoinCodeForm />
      </Card>
      <Suspense fallback={<PageLoading label="Loading organizations…" />}>
        <Directory {...props} />
      </Suspense>
    </WelcomeFrame>
  );
}
