# **Product Requirements Document (PRD): HeronKaban**

Transparent, AI-checked treasury for UMak student organizations, built on BNB Smart Chain.

# **1\. Meta Information**

| Attribute | Details |
| :---- | :---- |
| **Document Title** | HeronKaban |
| **Author** | Miel Angelus G. Majaba, Hannah Mae S. Intia, Aeron M. Malabana (University of Makati) |
| **Status** | Draft |
| **Date** | November 12, 2026 |
| **Target Release** | BCC 2026 × Binance Academy Hackathon prototype, Build Day November 13, 2026 (BSC testnet) |

# **2\. Executive Summary**

## **Problem Statement**

Student organization and class funds are hard to follow. Liquidation reports are mostly receipts, and members often cannot tell whether spending matched the purpose of an event. One reported pattern is liquidations made up mostly of food purchases. Manual tracking also causes human error, and transparency issues have been raised before. Today every member has to trust one treasurer's records, and those records can be edited or misread.

This matters because the UMak Student Handbook (2021) treats misappropriation or embezzlement of organization/class funds (4.2.21) and unauthorized collection of money (4.2.26) as major offenses. Even honest officers have no easy way to prove they spent funds properly, and members have no easy way to check. If nothing changes, trust in student organizations keeps depending on personal relationships instead of evidence.

*Note: this document describes making spending visible and checkable. It does not accuse any person or group.*

## **Value Proposition**

HeronKaban keeps org funds in a smart contract on BNB Smart Chain (BSC). The contract only releases money when public rules are met (for example, 2 of 3 officers approve). Each expense request comes with a receipt, and an AI reads the receipt and checks it against the request and the event budget, flagging anything unusual for human review. Every member can see the full history on a read-only dashboard.

- **For members:** they can see where their dues went, with receipts and AI notes.
- **For officers and treasurers:** a simple, shared process that reduces human error and gives them proof of proper spending.
- **For the university and the hackathon:** a practical, non-crypto-feeling app where blockchain provides trust and AI does real work on the money flow.

# **3\. Target Audience & User Personas**

## **Primary Persona: Org Member (Contributor)**

* **Background:** UMak college student who pays dues or fees to a student organization or class fund. Not familiar with crypto and uses a UMak Google account.
* **Core Need:** Know that their money was spent on what it was collected for, without having to ask or chase anyone.
* **Pain Points:**
  * Liquidation reports are hard to read and cannot be checked easily.
  * Unclear whether spending fits the event's purpose.
  * Must rely on trust in one person.

## **Second Persona: Org Officer / Treasurer**

* **Background:** Student leader who collects funds and files liquidations. Often handles records manually.
* **Core Need:** Spend funds properly and be able to prove it, with less paperwork.
* **Pain Points:**
  * Manual tracking is slow and prone to human error.
  * Any mistake can look like misuse.
  * No simple way to show members that everything is in order.

## **Supporting Audience (not primary users)**

* **Org adviser / university offices:** not users in this version. A read-only review view for them is listed under future work and will be added if the team decides otherwise.
* **Hackathon judges:** need to see a working end-to-end flow, a verified contract, and AI doing real work.

# **4\. Goals & Success Metrics**

## **Core Goals**

* **Product Goal:** A working prototype where dues are deposited, an expense is requested with a receipt, AI checks it, officers approve, and funds are released on BSC testnet, all visible on a member dashboard.
* **Business / Hackathon Goal:** Meet the hackathon bar (verified contract on BSC and AI doing real work in the demo) and deliver a clear, honest pitch that answers "why blockchain" and "what does the AI do."

## **Key Performance Indicators (KPIs)**

These are prototype targets, not measured baselines.

* **End-to-end demo flow:** Not built → Deposit, request, AI check, 2-of-3 approval, and release completed live without manual workarounds
* **Contract deployment:** None → At least one treasury contract deployed and verified on BSC testnet, address listed in the submission
* **AI receipt reading accuracy:** No check → Correct total amount extracted on at least 8 of 10 prepared sample receipts (80%), and correct line items on at least 7 of 10 (70%). Measured by running the 10 receipts once before the demo.
* **Flag detection:** None → All 4 planted cases flagged in the demo set: amount mismatch, duplicate receipt, over budget, and a food-heavy purchase mix for a non-food event (4 of 4), with no more than 1 false flag across the 10 sample receipts
* **Student verification:** None → 100% of non-UMak Google accounts rejected in testing (at least 3 test accounts), and UMak accounts accepted
* **Approval rule enforcement:** None → In testing, 1 officer approval never releases funds, and a repeat approval from the same officer is rejected (2 of 2 tests pass)
* **Request-to-release time:** Manual liquidation takes days → Under 2 minutes from filing an expense request to released funds in the live demo (testnet)
* **Transparency:** Records visible only to the treasurer → 100% of deposits, requests, receipts, AI notes and approvals visible to org members on the dashboard

# **5\. Assumptions, Constraints & Dependencies**

## **Assumptions**

* Student orgs would welcome a simple way to show members where funds went.
* Officers will upload receipt photos with each expense request.
* Orgs typically have 2-3 officers handling funds (confirmation from our source is pending). The approval threshold is set per org: 2 of 3 officers, or both officers if there are only 2.
* Members are comfortable using a normal-looking app if wallets and crypto stay hidden behind the scenes.
* A UMak Google account is proof of current enrollment for a prototype. Former students may keep access for a while, which is accepted as a limitation.

## **Constraints**

* **Time:** One build day (Nov 13). Significant code must be written Nov 12-13, with commit history to prove it.
* **Hackathon rules:** Testnet only, no real funds, no token launches. At least one contract deployed and verified on BSC.
* **Team:** 3 students, one with limited experience.
* **Everything must be free:** The team will not buy credits or any paid service. This applies to hosting, database, AI and blockchain (testnet only).
* **AI request budget:** The demo uses a free model on OpenRouter. Free models allow 20 requests per minute and 50 requests per day on an account with no purchased credits. Building, testing and the live demo all share these 50 requests, so the team plans them: about 30 for testing, and at least 15 kept in reserve for the demo. Each sample receipt's AI result is saved after the first run and reused, so repeat testing and the demo do not use new requests.
* **Validation:** No interview with a real treasurer was possible before build day. The problem account comes from a teammate.
* **Money:** The test token (1 token = ₱1) is play money. Real orgs use cash or GCash, so a real rollout needs a peso on-ramp (future work).
* **Policy:** Handbook rules were read from a scanned PDF using OCR. Wording must be verified before quoting.

## **Dependencies**

* BNB Smart Chain testnet (RPC access, test BNB from a faucet, block explorer for contract verification)
* Google Sign-In and the UMak Google domain \[exact domain TBC\]
* Supabase (database, auth, storage for receipt images)
* Vercel free hosting for the web app
* OpenRouter API with Google Gemma 4 26B A4B (free variant, `google/gemma-4-26b-a4b-it:free`), which accepts image input, for reading receipts
* Fallbacks if the free model is slow, rate-limited or down: replay the saved AI result for each sample receipt, or try another free vision-capable model on OpenRouter \[model to be chosen if needed\]. No paid fallback is used.
* Sample receipts: the team is finding or preparing 10 dummy receipts (personal details covered or removed), including 4 planted problem cases
* Designer's screens and branding (Figma link pending)
* Sample receipts prepared for the demo

# **6\. Functional Requirements**

| ID | User Story | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| **FR-01** | As a student, I want to sign in with my UMak Google account so that only UMak students can use the app. | High | • Given a user with a UMak-domain Google account, when they sign in, then access is granted• Given any other email, when they try to sign in, then access is denied• Domain is checked on the server, not only in the interface |
| **FR-02** | As a new user, I want to accept the terms and privacy notice so that I know how my data is used. | High | • Given first sign-in, when the user has not consented, then they cannot continue• Consent and timestamp are saved |
| **FR-03** | As an org member, I want to deposit my dues into my org's treasury so that funds are held transparently. | High | • Given a member and an org, when they deposit test tokens, then the contract balance increases and the deposit appears on the dashboard• Member does not need to manage a crypto wallet manually |
| **FR-04** | As an officer, I want to create an expense request with amount, purpose, event and receipt photo so that spending is documented before release. | High | • Given an officer, when they submit a request, then it is recorded on-chain and in the database with the receipt attached• Required fields cannot be empty |
| **FR-05** | As an officer, I want the AI to check my receipt against my request so that mistakes are caught early. | High | • Given a submitted receipt, when the AI runs, then it extracts amount, items and date and compares them with the request• The AI only reads the receipt (amount, items, date). Comparing amounts, spotting duplicates and checking the budget are done by normal code, so results are repeatable• Result is shown as flags with plain-language notes• Flags never release or block payment on their own |
| **FR-06** | As an org member, I want to see AI flags such as amount mismatch, duplicate receipt, over budget or an unusual purchase mix so that I know what needs a closer look. | High | • Given a request with a mismatch, when viewed, then the flag and reason are visible• Wording is neutral ("needs review") and does not accuse anyone |
| **FR-07** | As an org, I want an expense to need approval from several officers (2 of 3, or both if there are 2) so that no single person controls funds. | High | • Given a pending request, when fewer than the required officers approve, then funds stay locked• When the required number of distinct officers approve, then the contract releases the funds• The same officer cannot approve twice• The officer who filed the request may also approve it, but the required number of distinct approvals must still be met, so a second officer is always needed |
| **FR-08** | As an org member, I want a read-only dashboard of deposits, requests, receipts, AI notes and approvals so that I can verify spending. | High | • Given any signed-in member of the org, when they open the dashboard, then they see the full history• Dashboard cannot edit records |
| **FR-09** | As an officer, I want to reject or cancel a request so that mistakes can be corrected. | Medium | • Given a pending request, when it is rejected or cancelled, then no funds move and the status is shown |
| **FR-10** | As an org, I want a budget cap per event so that overspending is blocked by the rules. | Medium (stretch) | • Given an event budget, when a request would exceed it, then the contract refuses it or marks it over budget |
| **FR-11** | As an org member, I want a plain-language summary of an event's liquidation so that I can understand it quickly. | Low (stretch) | • Given an event with approved expenses, when requested, then the AI produces a short summary based only on recorded data |
| **FR-12** | As a user, I want the app to look familiar and Heron-themed so that it feels like a UMak app. | Low (stretch) | • UI uses the designer's screens and HeronKaban branding• Core flow works before styling work starts |

# **7\. Non-Functional Requirements**

## **Performance**

* **Latency:** Pages load in a few seconds on normal campus connections. AI receipt check returns in about 15 seconds or less for the demo, with a loading state shown. Blockchain confirmations on testnet may take longer, so the interface shows a clear "pending" state.
* **Scalability:** Prototype only. Must support a live demo with a small number of users and a few orgs. Large-scale load is out of scope.

## **Security & Compliance**

* **Authentication:** Google OAuth restricted to the UMak domain, verified on the server. No passwords stored by the app.
* **Authorization:** Only listed officers can create requests and approve. Members get read-only access to their org's data. Row Level Security is enabled in Supabase.
* **Data Privacy:** Follow the Philippine Data Privacy Act of 2012 (RA 10173) principles. Store the minimum (name, UMak email, wallet address). Keep personal data off-chain. On-chain data uses wallet addresses and amounts only. Show terms and privacy notice with saved consent. Mention UMak's Data Privacy and Records Management Service (DPRMS).
* **Smart contract safety:** Testnet only, no real funds. Prevent double approval and double release. Keep the contract small and simple.
* **AI use:** AI flags are advisory. Humans decide. Receipt images are used only for checking and display to org members.
* **AI data handling:** Receipt images go to a third-party model through OpenRouter. The free tier's data handling has not been verified by the team, so the demo uses sample or dummy receipts only, not real students' receipts. A real rollout would need a provider with an acceptable privacy policy and clear user consent.

## **Tech Stack & Infrastructure**

*Proposed. To be confirmed by the lead developer.*

* **Frontend:** Next.js (React)
* **Backend:** Supabase (auth, database, file storage) plus Next.js server routes
* **Database:** Supabase Postgres
* **Hosting:** Vercel (free tier)
* **Blockchain:** BNB Smart Chain testnet, Solidity smart contract, verified on the block explorer; test stablecoin token (1 token = ₱1)
* **Blockchain tooling:** Hardhat, with ethers or viem in the app
* **AI:** Google Gemma 4 26B A4B (free) through OpenRouter for receipt reading and short flag notes

# **8\. User Experience & Design**

## **Mockups & Wireframes**

* **Figma Project File:** Pending from the designer
* **Interactive Prototype:** Pending

## **Design Guidelines**

* Make it feel like a normal app: no wallet pop-ups, no crypto jargon. Say "dues" and "expenses," not "tokens" and "gas."
* Use Heron-inspired branding. A Roblox-style card layout is optional and only after the core flow works.
* Show status clearly: pending, approved, released, flagged.
* Use neutral wording for AI flags ("Needs review," not "Suspicious").
* Mobile-friendly layout, since most students will use phones.
* Accessibility: aim for WCAG 2.1 AA basics (contrast, readable text, labels) as time allows.

# **9\. Out of Scope & Future Work**

## **Deferred Features (Phase 2+)**

* Real peso on-ramp (GCash or other) so dues can be paid in real money
* Mainnet deployment and any real funds
* Governance tokens, voting and DAO features (deliberately not used; multi-officer approval is simpler)
* University-side tools: adviser and finance office review views, accreditation integration
* Officer rotation and org onboarding tools
* Automated checks against official UMak rules on organization fund handling
* Event certificates and attendance records on-chain
* Native mobile app
* Stronger student verification to exclude former students
* Multi-org dashboards and cross-org reporting
