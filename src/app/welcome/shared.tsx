import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, Card } from "@/components/ui";
import type { Viewer } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/roles";
import { WithdrawButton } from "./forms";

export function WelcomeFrame({ title, intro, children }: { title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-10">
      <div>
        <Link href="/welcome" className="text-sm text-blue-700 hover:underline">
          ← Back
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{title}</h1>
        <div className="mt-1 text-gray-600">{intro}</div>
      </div>
      {children}
    </main>
  );
}

/** The viewer's open requests (pending joins, or active members waiting on a promotion). */
export function MyRequests({ viewer }: { viewer: Viewer }) {
  const open = viewer.memberships.filter((m) => m.status === "pending" || m.requestedRole);
  if (open.length === 0) return null;
  return (
    <Card>
      <h2 className="font-semibold text-gray-900">Your requests</h2>
      <ul className="mt-3 divide-y divide-gray-100">
        {open.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900">{m.org.name}</p>
              <p className="text-xs text-gray-500">
                Asked for: {ROLE_LABEL[m.requestedRole ?? "member"]}
                {m.positionTitle ? ` · ${m.positionTitle}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="amber">Waiting for approval</Badge>
              <WithdrawButton membershipId={m.id} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function OrgBadge({ status }: { status: "verified" | "unverified" }) {
  return status === "verified" ? <Badge tone="green">Verified</Badge> : <Badge tone="amber">Unverified</Badge>;
}
