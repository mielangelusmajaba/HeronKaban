"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cx } from "@/components/ui";

export type NavItem = { href: string; label: string; icon: string; badge?: number; group?: string };

/**
 * Notion-style left sidebar for the officer console. Fixed column from `lg` up; an
 * off-canvas drawer (with a dimmed backdrop) on phones and tablets.
 */
export function Sidebar({ items, title, subtitle }: { items: NavItem[]; title: string; subtitle: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer on navigation and on Escape.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const groups = [...new Set(items.map((i) => i.group ?? ""))];
  const isActive = (href: string) => (href.split("/").length <= 3 ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  const nav = (
    <nav className="flex h-full flex-col gap-4 overflow-y-auto p-3" aria-label="Officer console">
      <div className="px-2 pt-1">
        <p className="truncate font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
      {groups.map((g) => (
        <div key={g}>
          {g && <p className="px-2 pb-1 text-xs font-medium text-gray-500">{g}</p>}
          <ul className="space-y-0.5">
            {items
              .filter((i) => (i.group ?? "") === g)
              .map((i) => (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    aria-current={isActive(i.href) ? "page" : undefined}
                    className={cx(
                      "flex min-h-10 items-center gap-2.5 rounded-lg px-2 text-sm",
                      isActive(i.href) ? "bg-blue-50 font-semibold text-blue-800" : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    <span aria-hidden className="w-5 text-center">
                      {i.icon}
                    </span>
                    <span className="flex-1 truncate">{i.label}</span>
                    {!!i.badge && <span className="rounded-full bg-amber-100 px-2 text-xs font-semibold text-amber-900">{i.badge}</span>}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-30 inline-flex min-h-12 items-center gap-2 rounded-full bg-gray-900 px-4 text-sm font-semibold text-white shadow-lg lg:hidden"
        aria-expanded={open}
        aria-controls="officer-drawer"
      >
        ☰ Menu
      </button>

      <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 border-r border-gray-200 bg-gray-50/80 lg:block">{nav}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" id="officer-drawer">
          <button className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[min(18rem,85vw)] bg-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] shadow-xl">
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
