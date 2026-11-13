import { and, eq, isNotNull } from "drizzle-orm";
import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Sidebar, type NavItem } from "@/components/treasury/Sidebar";
import { Badge, PageLoading } from "@/components/ui";
import { getDb } from "@/db";
import { memberships, requests } from "@/db/schema";
import { requireOrgAccess } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/roles";

async function OfficerShell({ params, children }: { params: Promise<{ org: string }>; children: React.ReactNode }) {
  const { org: slug } = await params;
  const { viewer, org, membership } = await requireOrgAccess(slug, "committee");
  const db = getDb();
  const [reqs, joinReqs] = await Promise.all([
    db.select({ status: requests.status }).from(requests).where(eq(requests.orgId, org.id)),
    db
      .select({ status: memberships.status, requestedRole: memberships.requestedRole })
      .from(memberships)
      .where(and(eq(memberships.orgId, org.id), isNotNull(memberships.requestedRole))),
  ]);
  const toReview = reqs.filter((r) => r.status === "pending" || r.status === "draft").length;
  const memberReqs = joinReqs.filter((j) => j.requestedRole === "member" && j.status === "pending").length;
  const seatReqs = joinReqs.filter((j) => j.requestedRole !== "member").length;

  const base = `/o/${slug}`;
  const isPresident = membership.role === "president";
  const isOfficer = membership.role === "officer" || isPresident;
  const items: NavItem[] = [
    { href: base, label: "Overview", icon: "🏠" },
    { href: `${base}/requests`, label: "Requests", icon: "🧾", badge: toReview, group: "Money" },
    { href: `${base}/requests/new`, label: "New request", icon: "➕", group: "Money" },
    { href: `${base}/collections`, label: "Collections", icon: "💰", group: "Money" },
    { href: `${base}/events`, label: "Events & budgets", icon: "📅", group: "Money" },
    ...(isOfficer ? [{ href: `${base}/members`, label: "Members", icon: "👥", badge: memberReqs, group: "People" }] : []),
    ...(isPresident
      ? [
          { href: `${base}/officers`, label: "Officers & roles", icon: "🛡️", badge: seatReqs, group: "People" },
          { href: `${base}/settings`, label: "Org settings", icon: "⚙️", group: "People" },
        ]
      : []),
    { href: `${base}/wallet`, label: "My wallet", icon: "👛", group: "Me" },
    { href: `${base}/activity`, label: "Activity log", icon: "🕘", group: "Me" },
    { href: `/m/${slug}`, label: "Switch to member view", icon: "👁️", group: "Me" },
  ];

  return (
    <>
      <AppHeader viewer={viewer} currentSlug={slug} />
      <div className="mx-auto flex w-full max-w-screen-2xl flex-1">
        <Sidebar items={items} title={org.name} subtitle={`${ROLE_LABEL[membership.role]}${membership.positionTitle ? ` · ${membership.positionTitle}` : ""}`} />
        <main className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-10">
          {org.status === "unverified" && (
            <div className="mb-4">
              <Badge tone="amber">Unverified org: waiting for a HeronKaban admin</Badge>
            </div>
          )}
          {children}
        </main>
      </div>
    </>
  );
}

export default function OfficerLayout({ params, children }: LayoutProps<"/o/[org]">) {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <Suspense fallback={<PageLoading label="Opening officer console…" />}>
        <OfficerShell params={params}>{children}</OfficerShell>
      </Suspense>
    </div>
  );
}
