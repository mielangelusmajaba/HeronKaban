"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * The two-card role picker, shown as a modal over a dimmed + blurred app backdrop.
 * The choice is the student's intent for this step, not a permanent account type:
 * roles are per org, so the same student can be a member of one org and an officer of another.
 */
export function RolePicker({ canClose, closeHref }: { canClose: boolean; closeHref: string }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const first = dialogRef.current?.querySelector<HTMLElement>("a,button");
    first?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && canClose) router.push(closeHref);
      if (e.key !== "Tab" || !dialogRef.current) return;
      // Simple focus trap.
      const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("a,button"));
      const [firstEl, lastEl] = [items[0], items[items.length - 1]];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canClose, closeHref, router]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-title"
          className="relative w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl sm:p-8"
        >
          {canClose && (
            <Link
              href={closeHref}
              aria-label="Close"
              className="absolute top-3 right-3 grid size-10 place-items-center rounded-full text-gray-500 hover:bg-gray-100"
            >
              ✕
            </Link>
          )}
          <h1 id="role-title" className="pr-8 text-xl font-bold text-gray-900 sm:text-center sm:text-2xl">
            How will you use HeronKaban?
          </h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-center">
            You can be a member of one org and an officer of another. Pick what you want to do now.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Card
              href="/welcome/member"
              title="Student Member"
              tag="Read-only + pay dues"
              body="I joined an organization and want to see where our funds go."
              points={["See the balance, money in and money out", "See receipts, AI notes and who approved", "See officers' pending requests"]}
              icon="👥"
            />
            <Card
              href="/welcome/officer"
              title="Student Officer"
              tag="Officer console"
              body="I help run an organization's funds, or I'm starting a new org."
              points={["Create a new org (you become President)", "Or ask to join an org as officer / committee", "File, review and approve expenses"]}
              icon="🗂️"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Card(props: { href: string; title: string; tag: string; body: string; points: string[]; icon: string }) {
  return (
    <Link
      href={props.href}
      className="group flex flex-col rounded-xl border-2 border-gray-200 p-5 transition hover:border-blue-600 hover:bg-blue-50/40 focus-visible:border-blue-600 focus-visible:outline-none"
    >
      <span className="text-3xl" aria-hidden>
        {props.icon}
      </span>
      <span className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-lg font-semibold text-gray-900">{props.title}</span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{props.tag}</span>
      </span>
      <span className="mt-1 text-sm text-gray-700">{props.body}</span>
      <ul className="mt-3 space-y-1 text-sm text-gray-600">
        {props.points.map((p) => (
          <li key={p} className="flex gap-2">
            <span className="text-blue-700" aria-hidden>
              ✓
            </span>
            {p}
          </li>
        ))}
      </ul>
      <span className="mt-4 text-sm font-semibold text-blue-700 group-hover:underline">Continue →</span>
    </Link>
  );
}
