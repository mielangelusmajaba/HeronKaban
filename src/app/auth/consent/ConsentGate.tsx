"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { acceptConsent, signOut } from "../actions";
import { Button, Notice, cx } from "@/components/ui";

/**
 * Scroll-to-agree gate. "I agree" unlocks only when the bottom sentinel inside the
 * scroll box has been seen (IntersectionObserver rooted on the box). If the document
 * fits without scrolling, the sentinel is visible at once and the button unlocks.
 */
export function ConsentGate({ version, children }: { version: string; children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const box = boxRef.current;
    const end = endRef.current;
    if (!box || !end) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setReachedEnd(true);
      },
      { root: box, threshold: 1 },
    );
    io.observe(end);
    const onScroll = () => {
      const max = box.scrollHeight - box.clientHeight;
      setProgress(max <= 0 ? 1 : Math.min(1, box.scrollTop / max));
    };
    onScroll();
    box.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      box.removeEventListener("scroll", onScroll);
    };
  }, []);

  function agree() {
    setError(null);
    startTransition(async () => {
      const res = await acceptConsent(version);
      if (res?.error) setError(res.error);
    });
  }

  const pct = Math.round((reachedEnd ? 1 : progress) * 100);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="h-1 bg-gray-100" aria-hidden>
        <div className="h-full bg-blue-700 transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <div
        ref={boxRef}
        tabIndex={0}
        role="document"
        aria-label="Terms of Service and Privacy Notice"
        className="max-h-[55dvh] overflow-y-auto overscroll-contain px-4 py-5 text-sm leading-relaxed text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 sm:px-8 landscape:max-h-[45dvh] lg:landscape:max-h-[55dvh]"
      >
        {children}
        <div ref={endRef} className="h-px" aria-hidden />
      </div>
      <div className="space-y-3 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:px-8">
        <p className={cx("text-sm", reachedEnd ? "text-green-800" : "text-gray-600")} aria-live="polite">
          {reachedEnd ? "Thanks for reading. You can now agree." : `Scroll to the end to continue (${pct}% read).`}
        </p>
        {error && <Notice tone="red">{error}</Notice>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <form action={signOut} className="sm:flex-1">
            <Button type="submit" variant="secondary" className="w-full">
              Decline and sign out
            </Button>
          </form>
          <Button onClick={agree} disabled={!reachedEnd || pending} className="sm:flex-1" aria-disabled={!reachedEnd}>
            {pending ? "Saving…" : "I have read and agree"}
          </Button>
        </div>
      </div>
    </div>
  );
}
