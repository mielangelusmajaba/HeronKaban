import Link from "next/link";
import { ButtonLink, Logo } from "@/components/ui";

// Static landing page (no session read, so it prerenders). Plain language, no crypto jargon.

const STEPS = [
  {
    title: "Members pay dues",
    body: "Dues go into the org's treasury, a shared account that no single officer controls.",
  },
  {
    title: "An officer files an expense",
    body: "They bought supplies for an event, so they upload the receipt and say what it was for.",
  },
  {
    title: "AI reads the receipt",
    body: "It reads the total, items and date. Simple rules compare them with the request and the event budget, and anything odd is marked “Needs review.”",
  },
  {
    title: "Officers approve, funds are released",
    body: "When enough different officers approve (for example 2 of 3), the treasury pays the officer back automatically.",
  },
];

const BENEFITS = [
  {
    who: "For members",
    points: [
      "See the balance, every peso in and out, and where it went",
      "Open any expense to see its receipt, the AI notes and who approved it",
      "See pending requests before money moves",
      "Your own payments stay private; others see totals only",
    ],
  },
  {
    who: "For officers & treasurers",
    points: [
      "Proof that you spent funds properly, with every step on record",
      "Less paperwork: receipts, approvals and liquidation in one place",
      "The AI catches typos, mismatched totals and duplicate receipts early",
      "No single person carries all the trust (or the blame)",
    ],
  },
  {
    who: "For the org & university",
    points: [
      "Records that can't be quietly edited after the fact",
      "Clear roles: President, officers, committee and members",
      "Supports the Student Handbook's rules on handling org funds",
      "Privacy first: names and emails never go on the blockchain",
    ],
  },
];

const FAQ = [
  {
    q: "Is this real money?",
    a: "Not yet. This prototype uses “test pesos” on a test network, with 1 test peso standing for ₱1. Real collections still go through your org's usual process. Connecting GCash or cash is future work.",
  },
  {
    q: "Does the AI decide what gets paid?",
    a: "No. The AI only reads receipts. Plain rules compare the numbers, and anything unusual is marked “Needs review.” People make every decision, and the AI can't approve, block or move money.",
  },
  {
    q: "Can officers still approve a bad expense?",
    a: "If enough officers agree, yes. What changes is that it can't be hidden: every approval is permanent, public to members and tied to the officer who made it.",
  },
  {
    q: "Who can sign in?",
    a: "Only University of Makati students with a UMak Google account (@umak.edu.ph). This is checked on our server, not just on the page.",
  },
  {
    q: "What is stored about me?",
    a: "Your name, UMak email, college, the orgs you join and your consent. Officers who approve also link a wallet. Your name and email never go on the blockchain.",
  },
];

function Check() {
  return (
    <svg className="mt-0.5 size-5 shrink-0 text-blue-700" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo size="sm" />
          <nav className="hidden items-center gap-6 text-sm text-gray-700 md:flex" aria-label="Sections">
            <a href="#how" className="hover:text-gray-900">How it works</a>
            <a href="#benefits" className="hover:text-gray-900">Benefits</a>
            <a href="#trust" className="hover:text-gray-900">Why trust it</a>
            <a href="#faq" className="hover:text-gray-900">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/auth/sign-in" className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-gray-800 hover:bg-gray-100 sm:inline-flex">
              Sign in
            </Link>
            <ButtonLink href="/auth/sign-up" className="!px-3 sm:!px-4">
              Get started
            </ButtonLink>
            <details className="relative md:hidden">
              <summary className="grid size-11 cursor-pointer list-none place-items-center rounded-lg hover:bg-gray-100 [&::-webkit-details-marker]:hidden" aria-label="Menu">
                ☰
              </summary>
              <div className="absolute right-0 mt-1 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                {[
                  ["#how", "How it works"],
                  ["#benefits", "Benefits"],
                  ["#trust", "Why trust it"],
                  ["#faq", "FAQ"],
                ].map(([href, label]) => (
                  <a key={href} href={href} className="block rounded-lg px-3 py-2.5 text-sm hover:bg-gray-50">
                    {label}
                  </a>
                ))}
                <Link href="/auth/sign-in" className="block rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-gray-50">
                  Sign in
                </Link>
              </div>
            </details>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-blue-50 to-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-blue-700">For University of Makati student organizations</p>
              <h1 className="mt-3 text-4xl leading-tight font-bold tracking-tight text-gray-900 sm:text-5xl">
                Know where your org&apos;s dues go.
              </h1>
              <p className="mt-4 max-w-xl text-lg text-gray-700">
                HeronKaban keeps org funds in a shared treasury that releases money only when several officers approve. Every
                receipt is checked by AI, and every member can see the full history.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/auth/sign-up" className="px-6 py-3 text-base">
                  Create your account
                </ButtonLink>
                <ButtonLink href="/auth/sign-in" variant="secondary" className="px-6 py-3 text-base">
                  Sign in with UMak Google
                </ButtonLink>
              </div>
              <p className="mt-3 text-xs text-gray-500">UMak Google accounts only · Prototype on a test network, no real money</p>
            </div>

            {/* Illustrative preview (static) */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xl sm:p-6" aria-label="Example of what members see">
              <p className="text-xs font-medium text-gray-500 uppercase">Example org treasury</p>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-3xl font-bold text-gray-900">₱18,450.00</p>
                <span className="text-xs font-medium text-green-800">⛓ Verified on-chain</span>
              </div>
              <ul className="mt-5 space-y-3 text-sm">
                <li className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3">
                  <span>
                    <span className="block font-medium">Tarpaulin for Org Week</span>
                    <span className="text-xs text-gray-500">Approved by 2 of 3 officers</span>
                  </span>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">Released</span>
                </li>
                <li className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3">
                  <span>
                    <span className="block font-medium">Seminar snacks</span>
                    <span className="text-xs text-gray-500">Receipt total differs from request</span>
                  </span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">Needs review</span>
                </li>
                <li className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3">
                  <span>
                    <span className="block font-medium">Membership dues</span>
                    <span className="text-xs text-gray-500">42 payments this sem</span>
                  </span>
                  <span className="font-semibold text-green-800">+₱8,400</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">The problem we&apos;re solving</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["Hard to follow", "Liquidation reports are mostly piles of receipts. Members can't easily tell if spending matched the event's purpose."],
              ["One person holds the trust", "Everyone has to trust the treasurer's records, which can be edited or misread, even by honest mistake."],
              ["Manual tracking", "Spreadsheets and paper slow officers down, and any error can look like misuse."],
            ].map(([t, b]) => (
              <div key={t} className="rounded-xl border border-gray-200 p-5">
                <p className="font-semibold text-gray-900">{t}</p>
                <p className="mt-1 text-sm text-gray-700">{b}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-600">
            HeronKaban makes spending visible and checkable. It doesn&apos;t accuse anyone: it gives honest officers an easy way to show
            their work.
          </p>
        </section>

        {/* How it works */}
        <section id="how" className="bg-gray-50">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">How it works</h2>
            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={s.title} className="rounded-xl border border-gray-200 bg-white p-5">
                  <span className="grid size-8 place-items-center rounded-full bg-blue-700 text-sm font-bold text-white">{i + 1}</span>
                  <p className="mt-3 font-semibold text-gray-900">{s.title}</p>
                  <p className="mt-1 text-sm text-gray-700">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Benefits */}
        <section id="benefits" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Benefits</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.who} className="rounded-xl border border-gray-200 p-6">
                <p className="text-lg font-semibold text-gray-900">{b.who}</p>
                <ul className="mt-4 space-y-3 text-sm text-gray-700">
                  {b.points.map((p) => (
                    <li key={p} className="flex gap-2">
                      <Check />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Trust */}
        <section id="trust" className="bg-blue-950 text-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Why use a blockchain?</h2>
              <p className="mt-3 text-blue-100">
                A normal database can be edited by whoever runs it. HeronKaban keeps the money in a small program on BNB Smart Chain
                (a shared record book nobody owns). Its rules are public and nobody can bend them, including us.
              </p>
              <ul className="mt-5 space-y-3 text-sm text-blue-50">
                <li className="flex gap-2">
                  <span aria-hidden>⛓</span> Money leaves only when enough different officers approve. One officer can never move funds alone.
                </li>
                <li className="flex gap-2">
                  <span aria-hidden>🔏</span> Each receipt&apos;s digital fingerprint is recorded, so a swapped or edited receipt shows as
                  &quot;doesn&apos;t match.&quot;
                </li>
                <li className="flex gap-2">
                  <span aria-hidden>📜</span> Payments, approvals and releases form a history that can&apos;t be rewritten.
                </li>
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">What the AI does, and doesn&apos;t</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="font-semibold">Does</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-blue-50">
                    <li>Reads the receipt&apos;s total, items and date</li>
                    <li>Helps spot mismatched totals, duplicate receipts, over-budget spending and unusual purchase mixes</li>
                  </ul>
                </div>
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="font-semibold">Doesn&apos;t</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-blue-50">
                    <li>Approve, block or move money</li>
                    <li>Accuse anyone: notes say &quot;Needs review&quot;</li>
                    <li>Replace the officers&apos; judgment</li>
                  </ul>
                </div>
              </div>
              <p className="mt-4 text-sm text-blue-200">
                Honest limits: the record proves who approved what and when, not that a receipt is genuine. Officers who agree can
                still approve a bad expense, but it can&apos;t be hidden.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Questions</h2>
          <div className="mt-6 divide-y divide-gray-200 rounded-xl border border-gray-200">
            {FAQ.map((f) => (
              <details key={f.q} className="group p-4 sm:p-5">
                <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-3 font-medium text-gray-900 [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="text-gray-400 transition group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm text-gray-700">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gray-50">
          <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Ready to open your org&apos;s books?</h2>
            <p className="mt-2 text-gray-700">Join your org as a member, or create one as an officer.</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/auth/sign-up" className="px-6 py-3 text-base">
                Create your account
              </ButtonLink>
              <ButtonLink href="/auth/sign-in" variant="secondary" className="px-6 py-3 text-base">
                Sign in
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 px-4 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))] text-center text-sm text-gray-600 sm:px-6">
        <p>HeronKaban · Heron for the UMak mascot, kaban for treasury chest</p>
        <p className="mt-1 text-xs">University of Makati · BCC 2026 × Binance Academy Hackathon prototype · test network, no real funds</p>
      </footer>
    </div>
  );
}
