import { Suspense } from "react";
import { requireViewer } from "@/lib/auth";
import { RolePicker } from "./RolePicker";

export const metadata = { title: "Welcome · HeronKaban" };

/** Decorative app backdrop behind the modal (dimmed and blurred by the overlay). */
function Backdrop() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-8" aria-hidden>
      <div className="h-8 w-64 rounded bg-gray-200" />
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 rounded-xl border border-gray-200 bg-white" />
        ))}
      </div>
      <div className="mt-6 h-72 rounded-xl border border-gray-200 bg-white" />
    </div>
  );
}

async function Picker() {
  const viewer = await requireViewer();
  const firstActive = viewer.memberships.find((m) => m.status === "active");
  return <RolePicker canClose={Boolean(firstActive)} closeHref={firstActive ? "/auth/continue" : "/welcome"} />;
}

export default function WelcomePage() {
  return (
    <>
      <Backdrop />
      <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />}>
        <Picker />
      </Suspense>
    </>
  );
}
