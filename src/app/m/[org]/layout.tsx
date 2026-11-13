import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { MemberTabs } from "@/components/treasury/MemberTabs";
import { Badge, PageLoading } from "@/components/ui";
import { getDb } from "@/db";
import { requests } from "@/db/schema";
import { requireOrgAccess } from "@/lib/auth";
import { ROLE_LABEL, roleAtLeast } from "@/lib/roles";

async function MemberShell({ params, children }: { params: Promise<{ org: string }>; children: React.ReactNode }) {
  const { org: slug } = await params;
  const { viewer, org, membership } = await requireOrgAccess(slug, "member");
  const pending = await getDb()
    .select({ id: requests.id })
    .from(requests)
    .where(and(eq(requests.orgId, org.id), eq(requests.status, "pending")));
  const base = `/m/${slug}`;

  return (
    <>
      <AppHeader viewer={viewer} currentSlug={slug} />
      <div className="mx-auto w-full max-w-screen-xl flex-1 px-4 pt-5 pb-24 sm:px-6 md:pb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-gray-900">{org.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
              {org.status === "verified" ? <Badge tone="green">Verified org</Badge> : <Badge tone="amber">Unverified org</Badge>}
              <span>You&apos;re a {ROLE_LABEL[membership.role].toLowerCase()}</span>
            </div>
          </div>
          {roleAtLeast(membership.role, "committee") && (
            <Link href={`/o/${slug}`} className="text-sm font-medium text-blue-700 hover:underline">
              Open officer console →
            </Link>
          )}
        </div>
        <MemberTabs
          tabs={[
            { href: base, label: "Overview", icon: "📊" },
            { href: `${base}/requests`, label: "Requests", icon: "⏳", badge: pending.length },
            { href: `${base}/expenses`, label: "Expenses", icon: "🧾" },
            { href: `${base}/dues`, label: "My dues", icon: "💳" },
            { href: `${base}/activity`, label: "Activity", icon: "🕘" },
          ]}
        />
        <div className="pt-6">{children}</div>
      </div>
    </>
  );
}

export default function MemberLayout({ params, children }: LayoutProps<"/m/[org]">) {
  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <Suspense fallback={<PageLoading label="Opening your org…" />}>
        <MemberShell params={params}>{children}</MemberShell>
      </Suspense>
    </div>
  );
}
