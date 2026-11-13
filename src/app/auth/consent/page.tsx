import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell, PageLoading } from "@/components/ui";
import { getViewer, hasConsented } from "@/lib/auth";
import { CONSENT_VERSION } from "@/lib/consent";
import { ConsentGate } from "./ConsentGate";

export const metadata = { title: "Terms & Privacy · HeronKaban" };

// Draft text for the prototype (beginner teammate owns the final wording, PRD §7).
// Handbook section numbers come from an OCR'd PDF; verify before quoting outside the app.
function ConsentDocument() {
  const h = "mt-6 mb-2 text-base font-semibold text-gray-900 first:mt-0";
  return (
    <article>
      <p className="text-xs text-gray-500">Version {CONSENT_VERSION}</p>

      <h2 className={h}>Terms of Service</h2>
      <p>
        HeronKaban is a prototype built for the BCC 2026 × Binance Academy Hackathon. It helps University of Makati (UMak)
        student organizations keep their funds transparent. By using it, you agree to:
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Use HeronKaban only for legitimate UMak student organization funds.</li>
        <li>Give accurate information in expense requests and upload genuine receipts for real expenses.</li>
        <li>
          Follow the UMak Student Handbook on organization funds, including the rules against misappropriation of
          organization or class funds (4.2.21) and unauthorized collection of money (4.2.26).
        </li>
        <li>Not try to get around the approval rules or the receipt checks.</li>
      </ul>

      <h3 className={h}>Prototype notice: no real money</h3>
      <p>
        HeronKaban runs on a test network. Balances are &quot;test pesos&quot; (1 test peso stands for ₱1) with no real value.
        Do not send real money through the app. Real collections still follow your org&apos;s normal process.
      </p>

      <h3 className={h}>Roles and responsibilities</h3>
      <ul className="list-disc space-y-1 pl-5">
        <li>The person who creates an org becomes its President and is responsible for adding the right officers.</li>
        <li>Expenses are released only when the required number of different officers approve (for example 2 of 3).</li>
        <li>Officers who approve must look at the receipt and any &quot;Needs review&quot; notes before approving.</li>
        <li>New orgs show as &quot;Unverified&quot; until a HeronKaban administrator verifies them.</li>
      </ul>

      <h3 className={h}>About the AI receipt check</h3>
      <p>
        An AI model reads each receipt (total, items and date). Simple rules then compare it with the request and the event
        budget. The result is a note for people to review. It is never a verdict, and it never approves, blocks or moves money.
        It can be wrong.
      </p>

      <h3 className={h}>What the records can and cannot prove</h3>
      <p>
        Approvals and payments are written to a shared record that cannot be quietly edited afterwards. This proves who approved
        what and when. It cannot prove that a receipt is genuine, and officers who agree with each other can still approve a bad
        expense. What changes is that it cannot be hidden.
      </p>

      <h2 className={h}>Privacy Notice</h2>
      <p>
        We follow the principles of the Philippine Data Privacy Act of 2012 (Republic Act No. 10173): we collect only what the app
        needs, use it only for the purposes below, and protect it.
      </p>

      <h3 className={h}>What we collect</h3>
      <ul className="list-disc space-y-1 pl-5">
        <li>Your name and UMak Google email (from Google sign-in), and the college you enter.</li>
        <li>The orgs you join and your role in each (member, committee, officer, president).</li>
        <li>Your consent and when you gave it.</li>
        <li>For officers: the wallet address you link to approve expenses.</li>
        <li>Deposits you make, expense requests you file and receipt images you upload.</li>
      </ul>

      <h3 className={h}>What goes on the blockchain (public and permanent)</h3>
      <p>
        Only wallet addresses, amounts, ID numbers and a fingerprint (hash) of each receipt. Your name and email never go on
        the blockchain, because records there cannot be deleted. Your dues are recorded with a coded reference that does not
        reveal who you are.
      </p>

      <h3 className={h}>Who can see what</h3>
      <ul className="list-disc space-y-1 pl-5">
        <li>Members of an org see its balance, totals, every expense, receipts, AI notes and who approved.</li>
        <li>You see your own payments by name. Other members see totals only.</li>
        <li>Committee members, officers and the President also see who has paid, for collection purposes.</li>
      </ul>

      <h3 className={h}>Third parties</h3>
      <ul className="list-disc space-y-1 pl-5">
        <li>Google (sign-in) and Supabase (database and file storage).</li>
        <li>
          OpenRouter and the AI model provider read receipt images to extract amounts. Their free-tier data handling has not
          been verified, so the prototype should be used with sample receipts only.
        </li>
      </ul>

      <h3 className={h}>Your rights</h3>
      <p>
        You may ask to access, correct or delete your personal data (except blockchain records, which contain no personal
        data). Contact the HeronKaban team or UMak&apos;s Data Privacy and Records Management Service (DPRMS).
      </p>

      <p className="mt-6 font-medium text-gray-900">End of document. Thank you for reading.</p>
    </article>
  );
}

async function ConsentBody() {
  const viewer = await getViewer();
  if (!viewer) redirect("/auth/sign-in");
  if (!viewer.profile.profileCompletedAt) redirect("/auth/sign-up");
  if (hasConsented(viewer.profile)) redirect("/auth/continue");
  return (
    <ConsentGate version={CONSENT_VERSION}>
      <ConsentDocument />
    </ConsentGate>
  );
}

export default function ConsentPage() {
  return (
    <AuthShell wide>
      <div className="mb-4 text-center">
        <p className="text-sm font-medium text-blue-700">Step 3 of 4</p>
        <h1 className="text-2xl font-bold text-gray-900">Terms &amp; Privacy</h1>
        <p className="mt-1 text-gray-600">Please read to the end. The agree button unlocks when you reach the bottom.</p>
      </div>
      <Suspense fallback={<PageLoading />}>
        <ConsentBody />
      </Suspense>
    </AuthShell>
  );
}
