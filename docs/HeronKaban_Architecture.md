# HeronKaban: Web App Structure & Idea Review

**Status:** Draft for team review, Nov 12, 2026
**Companion to:** `HeronKaban_PRD.md`, `HeronKaban_Summary.md`
**Purpose:** Lock the app *structure* before any UI/UX. Includes an honest critique of the idea.

---

## 1. Verdict in short

The idea is sound and the pitch story is strong. The three-part vision (members / organization / trust layer) is a good mental model. Five things need fixing before we build:

1. **Blockchain + AI should not be one "part".** They do opposite jobs (see 3).
2. **The flow order is slightly wrong.** Approvals must happen *on-chain*, not before it (see 5).
3. **A separate "audit trail" is not needed.** The chain's event log *is* the audit trail (see 6).
4. **The blockchain proves "recorded and approved", not "true".** A fake receipt approved by 2 officers is still a fake receipt. The honest pitch is "can't be hidden or edited", not "can't be stolen" (see 8).
5. **Real liquidation happens *after* spending.** We need to decide: reimbursement model or pay-ahead model (see 9).

---

## 2. How this compares to the references

**Bam Aquino's Blockchain the Budget Bill (Senate Bill 1330)**
- It is a *filed proposal*, not a law. It would create a National Budget Blockchain System so budget transactions, from preparation to fund release and audit, are recorded on an immutable ledger that citizens can trace.
- Reporting says the senator has since moved toward a "tech-neutral" version after hearing feedback not to legislate a specific technology.
- Important nuance: the bill is about *recording and tracing* budget transactions. It does not put the money itself on a chain. **HeronKaban goes a step further at small scale: the contract actually holds the (test) funds and enforces release rules.** That is a stronger claim, and also a good "pilot" framing: a campus-sized version of the idea.
- Pitch caution: say "inspired by the idea of traceable public funds", not "same as the bill".

**BetterGov.ph**
- A volunteer-driven, open-source civic tech movement making government data accessible, understandable and actionable.
- Its lesson is the **read side**: plain language, searchable, understandable data. That maps to our **Members side**, not to the blockchain part.
- Idea worth borrowing: make the repo **open source** and say so. It fits the transparency story and costs nothing.

**What this means for us:** the blockchain makes records trustworthy; a BetterGov-style interface makes them *understandable*. Judges will care about both. Don't spend all the effort on the chain and leave the members' view thin.

---

## 3. Corrected structure: 2 surfaces + 1 trust layer

Your three parts, regrouped by *who uses them*:

```
 ┌──────────────────────┐     ┌───────────────────────┐
 │  A. MEMBER PORTAL    │     │  B. OFFICER CONSOLE   │
 │  read-only, rich     │     │  decisions + admin    │
 │  "where did it go?"  │     │  "request, approve"   │
 └──────────┬───────────┘     └───────────┬───────────┘
            │  (one Next.js app, two route groups)
            ▼                             ▼
 ┌──────────────────────────────────────────────────────┐
 │  C. TRUST LAYER (no screens of its own)              │
 │  ┌────────────────────┐   ┌────────────────────────┐ │
 │  │ C1. BSC contract   │   │ C2. AI receipt reader  │ │
 │  │ holds money, rules │   │ reads receipt → JSON   │ │
 │  │ approvals, release │   │ ADVISORY ONLY          │ │
 │  └────────────────────┘   └────────────────────────┘ │
 │  ┌─────────────────────────────────────────────────┐ │
 │  │ C3. Off-chain store (Supabase): names, receipt  │ │
 │  │ images, AI results, flags, consent, org setup   │ │
 │  └─────────────────────────────────────────────────┘ │
 └──────────────────────────────────────────────────────┘
```

**Why split C1 and C2 even though they sit together:**

| | C1 Blockchain | C2 AI |
|---|---|---|
| Job | Enforce rules, hold money, keep permanent record | Read receipts, help humans notice problems |
| Trust type | Deterministic, cannot be bent | Probabilistic, can be wrong |
| Can move money? | **Yes** (only via rules) | **Never** |
| Can be edited later? | No | Result can be re-run |
| Failure mode | Bug = lost funds (testnet: harmless) | Wrong flag = human reviews it |

Rule: **AI output is advice stored off-chain. Only humans (officers) trigger on-chain actions.** This is already in the PRD (FR-05); keep it as a hard architectural rule.

**Build as ONE Next.js app**, not three. Two route groups share the same data layer:
- `/m/...` member portal
- `/o/...` officer console
- Role decides what you can open. Same login.

---

## 4. Sitemap (structure only, no visual design)

### A. Member Portal (`/m`), information-rich, read-only
| Page | Shows | Source |
|---|---|---|
| Org home | Balance, total collected, total spent, % of budget used, latest activity | chain + DB |
| Money in | Deposits: totals; the member sees *their own* payments | chain + DB |
| Money out | Every released expense: amount, purpose, event, receipt image, AI notes, who approved, tx link | chain + DB |
| Events | Per-event budget vs spent, list of expenses under it | DB (+chain) |
| Request detail | Full story of one expense: filed → AI check → approvals → released | chain + DB |
| Flags | All "needs review" items, neutral wording | DB |
| Verify | "View on block explorer" link per record. This is the trust proof. | chain |
| My account | Name, consent, wallet (hidden by default) | DB |

### B. Officer Console (`/o`), decisions + admin
| Page | Does | Source |
|---|---|---|
| Dashboard | Pending approvals, balance, flagged items, recent activity | chain + DB |
| New expense request | Amount, purpose, event, payee, receipt upload | writes chain + DB |
| Request review | Receipt, AI result, flags, approve / reject buttons, approval count (e.g. 1 of 2) | chain + DB |
| Events & budgets | Create event, set budget cap | DB (+chain if stretch) |
| Officers & rules | List of officers, threshold (2 of 3) | chain |
| Members | Roster / who has joined | DB |
| Activity log | Full timeline (see 6) | chain + DB |

### C. Trust layer, no pages
Contract, AI route (`/api/ai/check-receipt`), database. A single "About / How it works" public page can explain it in plain words for judges.

---

## 5. Corrected flow (the important fix)

Your version: *request → 2 officers approve → audit trail → goes to BSC to release.*

Problem: if approvals are collected in the app/database and *then* sent to the chain, the app server is the one deciding. A compromised or dishonest server could fake "2 approvals" and the contract would just obey. **The contract would be a rubber stamp and we'd be back to trusting a single party.**

Correct version: **each officer's approval is a transaction signed by that officer, sent to the contract. The contract counts them and releases automatically on the 2nd.**

```
1. Officer files request
   ├─ upload receipt → Supabase storage
   ├─ AI reads receipt (C2) → JSON {total, items, date}
   ├─ normal code compares to request/budget → flags
   └─ createRequest(amount, payee, eventId, receiptHash) → CHAIN
2. Officers review (see receipt + flags in console)
3. Officer 1 → approve(requestId)  → CHAIN (signed by officer 1)
4. Officer 2 → approve(requestId)  → CHAIN (signed by officer 2)
   └─ contract sees 2 distinct approvals → transfers funds itself
5. Contract emits events (Requested, Approved, Released)
6. App listens/reads events → updates DB → Member portal shows it
```

**New idea that adds real blockchain value: store a hash of the receipt on-chain.**
- A hash is a short fingerprint of the file. Store only the fingerprint on-chain (`receiptHash`), keep the image in Supabase.
- Result: if someone later swaps or edits the receipt image, the fingerprint no longer matches, and the member portal can show "✔ receipt matches the on-chain record".
- Cheap to build (one line of code in the contract + one hash in the app), strong for the pitch, and it answers "why blockchain?" better than "it's a ledger".
- Same trick can anchor the AI result (hash of the AI JSON) as a stretch.

---

## 6. Do we need a separate "audit trail"? No.

The contract's event log already is one: who requested, who approved, when, how much, and it can't be edited. A separate audit table would just duplicate it (and be editable, which is worse).

What we *do* want is an **Activity timeline** screen that merges two sources:
- **On-chain events:** requested, approved (by whom), released, rejected, deposit.
- **Off-chain events:** receipt uploaded, AI check ran, flags raised, officer added a note.

Label them clearly: "Verified on-chain" vs "Recorded by app". Being honest about which is which is a trust feature.

---

## 7. Data ownership: what lives where

| Data | Chain (BSC) | Database (Supabase) | Why |
|---|---|---|---|
| Treasury balance | ✔ | cached copy | Money = chain is truth |
| Deposits (wallet, amount) | ✔ | name mapping | Names off-chain for privacy |
| Request (amount, payee, eventId, receiptHash, status) | ✔ | purpose text, notes | Rules need the numbers |
| Approvals (officer address, time) | ✔ | |
| Receipt image | hash only | ✔ file | Images are big; hash proves integrity |
| AI result + flags | optional hash | ✔ | Advisory, can be re-run |
| Names, UMak emails, consent | ✘ never | ✔ | Chain data cannot be deleted (Data Privacy Act) |
| Officer list + threshold | ✔ | label/name | Contract enforces who may approve |

**Rule of thumb:** *chain = money and decisions; database = people and files.* If the database and chain disagree about money, the chain wins.

---

## 8. Honest limits (put these in the pitch; judges trust teams that say them)

1. **Garbage in, garbage out.** The chain guarantees a record can't be changed after it's written. It cannot know whether a receipt is genuine. This is the same open question critics raise about putting government budgets on-chain.
2. **Collusion.** 2 of 3 officers agreeing can still approve a bad expense. What changes: it's permanent, public, tied to named approvals, and AI-flagged. Pitch line: *"We can't stop every bad decision, but we make sure none can be hidden or quietly edited."*
3. **Real money.** Orgs use cash/GCash; the test token is a stand-in (already in the Summary).
4. **AI errors.** Flags are advisory (already in the PRD).
5. **Privacy vs transparency.** "Information-rich" must not mean exposing every member's payments to everyone (see 10).

---

## 9. Decision needed: reimbursement or pay-ahead?

In real orgs, officers usually *spend first, then liquidate with receipts*. Our flow has the receipt attached *before* release. Two coherent options:

| | **A. Reimbursement (recommended)** | B. Pay-ahead |
|---|---|---|
| Story | Officer bought supplies, uploads the real receipt, officers approve, treasury reimburses the officer | Officer requests funds with a quotation/receipt, funds released to a payee, final receipt later |
| Fits AI receipt check | **Perfectly**: real receipt exists | Weaker: quotation, then second check |
| Demo complexity | Simple, one step | Two steps (request, then liquidation) |
| Fits real campus practice | Close to how it works today | Closer to cash advance |

**Recommendation: build A for the demo; mention B as future work.** Confirm with your source which one orgs actually use. The `payee` in the contract is simply the officer's (or vendor's) wallet.

---

## 10. Wallets, keys and privacy (the part you said you're unsure about)

**Key question: who holds the private key that signs an officer's approval?** (A private key is the secret that proves "this really is me".)
- If the *app server* holds the officers' keys, the server can approve on their behalf, which defeats the whole point.
- **Recommendation for the prototype:**
  - **Officers sign with their own wallet** (e.g. MetaMask or Rabby on BSC testnet). It's 2-3 people, they can set it up in the morning, and it makes "2 of 3 officers" genuinely true.
  - **Members never need a wallet to *view*.** The Member Portal reads public chain data and the database.
  - **Members' deposits in the demo:** use an app-managed "demo wallet" with a "Top up test pesos" button, and say openly that it's custodial for the demo. (This resolves the open item "hidden app-generated wallets".)
- Real rollout: custody would be redesigned alongside the peso on-ramp.

**Privacy for the information-rich Member Portal:**
- Everyone in the org sees: totals, every expense, receipts, AI notes, approvals.
- A member sees their *own* payments by name. Others see totals only. Officers see a roster of who paid for collection purposes.
- On-chain addresses are pseudonymous, but the app links names to addresses, so the app must control who sees that mapping.

---

## 11. Roles and permissions

| Role | Sees | Can do |
|---|---|---|
| Visitor (non-UMak) | Nothing | Denied at login (server-checked) |
| Member | Org Member Portal | Deposit, view everything for their org |
| Officer | Member Portal + Officer Console | Create request, approve, reject, manage events |
| Org adviser | (future) | Read-only review view |

On-chain, only addresses in the officer list can call `approve` / `createRequest`. In the database, Row Level Security mirrors this.

---

## 12. Smart contract surface (small on purpose)

**Functions:** `deposit(amount)`, `createRequest(amount, payee, eventId, receiptHash)`, `approve(requestId)`, `reject(requestId)` / `cancel(requestId)`, `setOfficers(list, threshold)` (admin, once), optional `setEventBudget(eventId, cap)` (stretch).
**Automatic behavior:** when distinct approvals ≥ threshold, transfer funds once. A request can't be approved twice by one officer or released twice.
**Events (the audit trail):** `Deposited`, `RequestCreated`, `Approved`, `Released`, `Rejected`.
**Token:** a simple peso-pegged test ERC-20 (1 token = ₱1). Use a standard library (OpenZeppelin) instead of writing token logic ourselves.

---

## 13. Database tables (minimum)

`users` (id, name, umak_email, wallet, consent_at) · `orgs` · `memberships` (user, org, role) · `events` (org, name, budget) · `requests` (chain_id, org, event, purpose, receipt_url, receipt_hash, status, tx_hash) · `ai_checks` (request, extracted_json, flags_json, model, created_at; **cached so reruns cost no requests**) · `activity` (off-chain timeline items).

---

## 14. Build order for tomorrow (structure → function → polish)

1. Contract + test token on testnet, verified (the hackathon bar).
2. Officer flow end-to-end with no UI polish: create request → 2 approvals → release.
3. AI route + code checks + cached results.
4. Member Portal read pages (Org home, Money out, Request detail).
5. UMak login + consent.
6. Activity timeline, receipt-hash "matches" badge, then stretch items.
7. Designer's skin dropped in last.

---

## 15. Suggested edits to the PRD / Summary (not yet applied)

- Replace "Blockchain" and "AI" as one part with the **2 surfaces + trust layer** structure (3).
- Add FR: *Approvals are signed on-chain by each officer; the app server cannot approve.*
- Add FR: *Receipt hash stored on-chain; portal shows integrity check.*
- Add FR: *Activity timeline distinguishing on-chain vs app-recorded events.*
- Add the "Honest limits" in 8 to PRD Section 5.
- Resolve open items: wallets (10), reimbursement vs pay-ahead (9).
- Replace "audit trail" wording with "on-chain event log + activity timeline".

## 16. Open questions for the team

1. Reimbursement or pay-ahead? (ask your source)
2. Are officers OK using their own wallet in the demo?
3. How much of a member's payment history should other members see?
4. Open-source the repo?

## Sources
- [The Block, Aug 2025](https://www.theblock.co/news/regulation/2025-08-28-philippine-senator-plans-bill-putting-national-budget-on-blockchain-368556) · [Decrypt](https://decrypt.co/337140/philippine-senator-suggests-putting-national-budget-on-chain)
- [Manila Bulletin, Oct 2025](https://mb.com.ph/2025/10/02/what-is-that-bam-aquino-pushes-for-blockchain-technology-in-the-national-budget) · [BitPinas, tech-neutral update](https://bitpinas.com/regulation/aquino-feedback-blockchain/)
- [BetterGov.ph about page](https://bettergov-about.pages.dev)
