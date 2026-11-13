# HeronKaban: Project Summary

**Event:** BCC 2026 × Binance Academy Hackathon, University of Makati, Nov 13, 2026
**Track:** Consumer Apps (also touches Payments and AI Agents)
**Team:** Miel Angelus G. Majaba, Hannah Mae S. Intia, Aeron M. Malabana (lead developer, designer, beginner teammate)
**Status:** Final idea selected on Nov 12, 2026

---

## 1. The final idea in one line

A transparent treasury for UMak student organizations. Dues and event funds sit in a smart contract on BNB Smart Chain (BSC), spending needs multi-officer approval, and an AI checks every receipt so members can see where the money went.

## 2. The problem

- Org and class funds are hard to follow. Liquidation reports are mostly receipts, and members often cannot tell whether spending matched the event's purpose. One reported example is liquidations made up mostly of food purchases.
- Manual tracking causes human error.
- Transparency problems have come up before, and trust depends on a single treasurer.
- The UMak Student Handbook (2021) treats **misappropriation or embezzlement of organization/class funds (4.2.21)** and **unauthorized collection of money (4.2.26)** as major offenses. The hackathon brief also lists "collecting org dues and fees" as a campus problem to fix.
- The pitch tone must stay neutral. The app makes spending visible and checkable. It does not accuse anyone.

## 3. The solution

1. Members pay dues into the org's treasury smart contract (BSC testnet, verified).
2. An officer files an expense request with the amount, purpose, event and a receipt photo.
3. AI reads the receipt and checks it against the request and the approved event budget. It flags amount mismatches, duplicate receipts, overspending, and purchase mixes that do not fit the event. Flags are for review, not verdicts.
4. Two of three officers approve on-chain, and the contract releases the funds.
5. Every member can see the full history, with receipts and AI notes, on a read-only dashboard.

**Name:** HeronKaban (Heron = UMak mascot, Kaban = chest/treasury). Other names considered: Ambag, Resibo, Tapat, Liquid.

## 4. Core principles we agreed on (carried over from early brainstorming)

**What a blockchain is, in our context**
- A blockchain is a shared record book that no single person owns. Once something is written, nobody can quietly change it. BSC is one of these record books.
- A **smart contract** is a small program on the blockchain that can hold money and follow rules automatically. Ours acts as an **escrow**: it holds the funds and only releases them when the rules are met. Nobody can bend those rules, including the app builders.

**Why we need blockchain (our answer to "why not a normal database?")**
- If an app or a person holds the money, everyone must trust that holder. In a database, whoever controls it can edit it.
- A smart contract removes that single point of trust. The rules are public, and the history cannot be rewritten.

**Testnet stablecoin**
- A **stablecoin** is a token with a fixed value. Ours is 1 token = ₱1.
- A **testnet** is a practice copy of BSC where everything is free and play-money. The hackathon requires this: *no real funds, no token launches.*
- We do not launch our own crypto. We use a peso-pegged test token as a stand-in.
- **Honest limit:** real orgs collect cash or GCash. A real rollout needs a way to turn pesos into tokens. We say this openly in the pitch.
- Cash and GCash cannot be locked behind public rules, which is why the demo uses the test token.

**Design principles**
- **Crypto is invisible plumbing.** Users should feel like they are using a normal, safe app. Wallets are created for users behind the scenes (to be confirmed).
- **AI must do real work, not be a bolt-on.** A chatbot added on the side is weak. AI that reads receipts and checks them against rules is a real job tied to the money.
- **Ground AI in real rules.** Our moderation/checking idea works best when it cites real UMak rules from the Student Handbook, not generic ones.
- **Own the problem.** Judges want a problem the team has actually seen on campus. Tell it as a story.
- **Small and finishable beats big and polished.** One working end-to-end flow on testnet beats a beautiful but fake UI. UI polish comes after the core flow works.
- **Avoid jargon.** "DAO" and "governance tokens" are out. A simple "2 of 3 officers approve" rule (multisig) is easier to build and explain.

**Hackathon bar**
- At least one smart contract deployed and verified on BSC (testnet is fine), with its address listed in the submission.
- At least one AI capability doing real work in the demo.
- Significant code must be written Nov 12-13, and the commit history must show it.
- Build day is Nov 13, 9:00 AM, with the pitch the same afternoon.

## 5. Verification and privacy decisions

- **Verifying students:** The handbook says the ITC issues each enrolled student a UMak Gmail account. We use **Google Sign-In restricted to the UMak email domain**. The check is done on the server, not only in the interface. Exact domain to be confirmed.
- **Backend:** Supabase is acceptable for off-chain data.
  - Store only name, UMak email and wallet address.
  - Never store passwords (Google handles login).
  - Turn on Row Level Security.
- **On-chain:** Wallet addresses and amounts only. No names or emails, because blockchain records cannot be deleted.
- **Consent:** Terms and privacy checkbox with a saved timestamp. Mention the Data Privacy Act and UMak's Data Privacy and Records Management Service (DPRMS).
- **Limitation:** A former student who still has a UMak email might get in. Acceptable for a one-day prototype.

## 6. Scope for build day

**Must have**
- Treasury smart contract: deposit, expense request, officer approval (2 of 3), release, refund
- AI receipt check with flags
- UMak-restricted Google login
- Member dashboard (read-only history)

**Stretch**
- Per-event budget caps enforced by the contract
- Plain-language AI liquidation summary
- Roblox-inspired / Heron-themed skin

## 6b. Tech stack (agreed)

- **App:** Next.js, hosted free on Vercel
- **Backend and database:** Supabase (auth, Postgres, receipt storage)
- **Blockchain:** Solidity contract on BSC testnet, built and deployed with Hardhat
- **AI:** Google Gemma 4 26B A4B (free) through OpenRouter. It accepts images, so it can read receipt photos.
  - Free-model limit: 20 requests per minute and **50 per day** (no credits will be bought, since everything in this hackathon must be free). Building, testing and the demo share the 50, so plan about 30 for testing and keep at least 15 for the demo.
  - Save each sample receipt's AI result after the first run and reuse it, so repeat tests and the demo cost no new requests. Fallback: replay saved results or try another free vision model.
  - Design choice: the AI only reads the receipt. Comparing amounts, finding duplicates and checking budgets is done by normal code, so results are repeatable.
  - Use dummy receipts only in the demo. The free tier's data handling is unverified.

## 7. Team roles

- **Lead developer (using Claude Code):** contract, backend, AI, integration
- **Designer:** screens and UX; prepares designs ahead so they can be dropped in
- **Beginner teammate:** seed data, terms and privacy text, testing as a real student, pitch story

## 8. Risks and honest limits

- We could not interview a real treasurer before build day. The problem account comes from a teammate.
- Test-token money is not real. The peso on-ramp is future work.
- "Org dues" is on the hackathon's own list, so other teams may build something similar. We win on execution and clarity.
- Handbook rules were read from a scanned PDF using OCR. Verify wording before quoting.
- AI flags can be wrong. They go to humans for review and never block payment on their own.

## 9. Decisions made on build day (Nov 13)

- **Sign-in:** Google only, for both sign-in and sign-up (sign-up adds a name and college step). The UMak domain is checked on the server in three places (auth hook, OAuth callback, every request).
- **Consent:** the agree button unlocks only after scrolling to the end of the Terms and Privacy Notice.
- **Onboarding:** after consent, a two-card modal asks "Student Member" or "Student Officer". Roles are per org, so one student can be a member of one org and an officer of another.
- **Orgs:** any UMak student can create an org and becomes its President. New orgs show "Unverified" until a platform admin verifies them.
- **Joining:** a join code joins instantly; otherwise a request is approved by an officer (members) or the President (officer/committee seats).
- **Hierarchy:** President > Officer (exec board) > Committee (exec comms) > Member. The President marks which officers are on-chain signers.
- **Wallets:** signer officers use their own MetaMask (local Hardhat accounts for the demo). Members pay dues through an app-managed demo wallet (custodial, disclosed).
- **Blockchain:** a local Hardhat node for now (the BSC faucet needs a mainnet balance). Switching to BSC testnet is a config change.
- **Model:** reimbursement (spend first, file the receipt, get paid back).

## 10. Open items

- Exact UMak email domain (code uses `umak.edu.ph`)
- ~~Whether to use hidden app-generated test wallets for users~~ Decided: custodial demo wallet for members, MetaMask for signers
- Confirm with the organizers (in writing) whether a local-node deployment satisfies the "deployed and verified on BSC" requirement
- Google Cloud OAuth client + Supabase Google provider setup, and enabling the "Before User Created" hook in Supabase
- Number of officers who typically handle funds (waiting on our source; for now 2-3, threshold set per org)
- A set of 10 dummy sample receipts for testing (team is finding them), including 4 planted problem cases
- Decided: no paid credits. Everything stays free.
- Decided: the officer who files a request may also approve it, but a second distinct officer is always required
- Figma link from the designer
- Org advisers are future work unless the team decides otherwise
