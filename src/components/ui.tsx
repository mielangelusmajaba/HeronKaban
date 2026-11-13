import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// Minimal, unstyled-ish primitives. The designer's skin replaces these later;
// pages should use them instead of repeating class strings so the reskin is one place.

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Logo({ href = "/", size = "md" }: { href?: string; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "size-14" : size === "sm" ? "size-8" : "size-10";
  const text = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-xl";
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 font-bold text-gray-900">
      <span className={cx(box, "grid place-items-center rounded-xl bg-blue-700 text-white")} aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-3/5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M5 10V7l7-4 7 4v3M6 10v8m4-8v8m4-8v8m4-8v8M4 21h16" />
        </svg>
      </span>
      <span className={text}>HeronKaban</span>
    </Link>
  );
}

export const btn = {
  base: "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
  primary: "bg-blue-700 text-white hover:bg-blue-800",
  secondary: "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-gray-700 hover:bg-gray-100",
};

type Variant = "primary" | "secondary" | "danger" | "ghost";

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cx(btn.base, btn[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cx(btn.base, btn[variant], className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6", className)} {...props} />;
}

const tones = {
  gray: "bg-gray-100 text-gray-700",
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  amber: "bg-amber-100 text-amber-900",
  red: "bg-red-100 text-red-800",
  purple: "bg-purple-100 text-purple-800",
};

export function Badge({ tone = "gray", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", tones[tone])}>
      {children}
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-gray-800">{label}</span>
      {children}
      {hint && <span className="block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "block w-full min-h-11 rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30 sm:text-sm";

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <Card className="!p-4">
      <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</p>
      <p className="mt-1 text-xl font-bold break-words text-gray-900 sm:text-2xl">{value}</p>
      {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
    </Card>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
      <p className="font-medium text-gray-900">{title}</p>
      {children && <div className="mt-1 text-sm text-gray-600">{children}</div>}
    </div>
  );
}

export function Notice({ tone = "blue", children }: { tone?: "blue" | "amber" | "red" | "green"; children: ReactNode }) {
  const t = {
    blue: "border-blue-200 bg-blue-50 text-blue-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    red: "border-red-200 bg-red-50 text-red-900",
    green: "border-green-200 bg-green-50 text-green-900",
  }[tone];
  return <div className={cx("rounded-lg border p-3 text-sm", t)}>{children}</div>;
}

export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="grid min-h-40 place-items-center p-8 text-sm text-gray-500" role="status" aria-live="polite">
      <span className="inline-flex items-center gap-2">
        <span className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-700" />
        {label}
      </span>
    </div>
  );
}

export function AuthShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-br from-blue-50 via-white to-sky-50">
      <header className="px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
        <Logo size="sm" />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center sm:px-6">
        <div className={cx("w-full", wide ? "max-w-3xl" : "max-w-md")}>{children}</div>
      </main>
      <footer className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs text-gray-500">
        University of Makati · BCC 2026 × Binance Academy Hackathon prototype · test network only
      </footer>
    </div>
  );
}
