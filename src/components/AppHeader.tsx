import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import type { Viewer } from "@/lib/auth";
import { ROLE_LABEL, roleAtLeast } from "@/lib/roles";
import { Badge, Logo, cx } from "./ui";

function initials(name: string | null, email: string) {
  const src = name?.trim() || email;
  return src
    .split(/[\s.@]+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

/** Top bar for signed-in pages: logo, org switcher, account menu. Uses <details> so it works without JS. */
export function AppHeader({ viewer, currentSlug, left }: { viewer: Viewer; currentSlug?: string; left?: React.ReactNode }) {
  const active = viewer.memberships.filter((m) => m.status === "active");
  const current = active.find((m) => m.org.slug === currentSlug);

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-2 px-3 sm:px-6">
        {left}
        <Logo href="/auth/continue" size="sm" />

        {active.length > 0 && (
          <details className="group relative ml-1 min-w-0 sm:ml-4">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-lg px-2 text-sm font-medium text-gray-800 hover:bg-gray-100 [&::-webkit-details-marker]:hidden">
              <span className="max-w-[9rem] truncate sm:max-w-[16rem]">{current?.org.name ?? "Your orgs"}</span>
              <svg className="size-4 shrink-0 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </summary>
            <div className="absolute left-0 mt-1 w-72 max-w-[calc(100vw-1.5rem)] rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
              {active.map((m) => {
                const officer = roleAtLeast(m.role, "committee");
                return (
                  <div key={m.id} className="rounded-lg px-3 py-2 hover:bg-gray-50">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-gray-900">{m.org.name}</span>
                      <Badge tone={officer ? "purple" : "gray"}>{ROLE_LABEL[m.role]}</Badge>
                    </div>
                    <div className="mt-1 flex gap-3 text-xs">
                      <Link className="text-blue-700 hover:underline" href={`/m/${m.org.slug}`}>
                        Member view
                      </Link>
                      {officer && (
                        <Link className="text-blue-700 hover:underline" href={`/o/${m.org.slug}`}>
                          Officer console
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
              <Link href="/welcome" className="mt-1 block rounded-lg border-t border-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                + Join or create an org
              </Link>
            </div>
          </details>
        )}

        <div className="ml-auto flex items-center gap-1">
          {viewer.isPlatformAdmin && (
            <Link href="/admin" className="hidden rounded-lg px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 sm:block">
              Admin
            </Link>
          )}
          <details className="relative">
            <summary
              className={cx(
                "grid size-10 cursor-pointer list-none place-items-center rounded-full bg-blue-700 text-sm font-semibold text-white",
                "[&::-webkit-details-marker]:hidden",
              )}
              aria-label="Account menu"
            >
              {initials(viewer.profile.fullName, viewer.email)}
            </summary>
            <div className="absolute right-0 mt-1 w-64 max-w-[calc(100vw-1.5rem)] rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
              <p className="truncate px-2 text-sm font-medium text-gray-900">{viewer.profile.fullName ?? "UMak student"}</p>
              <p className="truncate px-2 text-xs text-gray-500">{viewer.email}</p>
              {viewer.isPlatformAdmin && (
                <Link href="/admin" className="mt-2 block rounded-lg px-2 py-2 text-sm hover:bg-gray-50 sm:hidden">
                  Admin
                </Link>
              )}
              <form action={signOut} className="mt-2 border-t border-gray-100 pt-2">
                <button type="submit" className="w-full rounded-lg px-2 py-2 text-left text-sm text-red-700 hover:bg-red-50">
                  Sign out
                </button>
              </form>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
