"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui";

export type Tab = { href: string; label: string; icon: string; badge?: number };

/** Member portal navigation: a top tab row from `md` up, a bottom tab bar on phones. */
export function MemberTabs({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();
  const active = (href: string) => (href.split("/").length <= 3 ? pathname === href : pathname.startsWith(href));
  return (
    <>
      <nav className="hidden border-b border-gray-200 md:block" aria-label="Org sections">
        <ul className="-mb-px flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active(t.href) ? "page" : undefined}
                className={cx(
                  "flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm whitespace-nowrap",
                  active(t.href) ? "border-blue-700 font-semibold text-blue-800" : "border-transparent text-gray-600 hover:text-gray-900",
                )}
              >
                {t.label}
                {!!t.badge && <span className="rounded-full bg-amber-100 px-2 text-xs font-semibold text-amber-900">{t.badge}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Org sections"
      >
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map((t) => (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active(t.href) ? "page" : undefined}
                className={cx("relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px]", active(t.href) ? "font-semibold text-blue-800" : "text-gray-600")}
              >
                <span aria-hidden className="text-lg leading-none">
                  {t.icon}
                </span>
                {t.label}
                {!!t.badge && <span className="absolute top-1.5 right-[calc(50%-1.25rem)] size-2 rounded-full bg-amber-500" aria-label={`${t.badge} new`} />}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
