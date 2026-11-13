# HeronKaban: Setup Progress Summary

**Date:** Nov 13, 2026 (Build Day)
**Event:** BCC 2026 × Binance Academy Hackathon, University of Makati
**Project:** HeronKaban, a transparent treasury for student orgs on BNB Smart Chain (BSC) with AI receipt checks
**Stack:** Next.js + Supabase, Solidity + Hardhat, local Hardhat node (BSC testnet later), Gemma via OpenRouter

---

## 1. Where we are (updated Nov 13, evening)

- **Contracts are written, tested and deploy to a local node.** `HeronTreasury` (multi-org) and `PesoToken` (test peso). 11 contract tests pass.
- **The app runs end to end on the local node:** Google sign-up/sign-in, scroll-gated consent, role-picker modal, org create/join, officer console, member portal, AI receipt check, on-chain approvals.
- **Supabase is fully set up and confirmed working:** tables, Row Level Security, profile trigger, sign-up domain hook and the private `receipts` bucket are applied (`npm run db:migrate`). The Google OAuth client is connected, the "Before User Created" hook is enabled, and a UMak account signs in and appears under Authentication → Users.
- **Not done yet:** BSC testnet deployment and verification (needs tBNB), publishing the Google consent screen (see §5.4), designer's skin.

## 2. Network details from the organizers

| Field | Value |
|---|---|
| Network name | BSC Testnet |
| RPC URL | https://data-seed-prebsc-1-s1.bnbchain.org:8545 |
| Chain ID | 97 |
| Currency symbol | tBNB |
| Block explorer | https://testnet.bscscan.com |

## 3. Blocker and organizer's answer

- The official faucet gives 0.3 tBNB per 24 hours, but **requires about 0.002 BNB on BSC mainnet**. We have none.
- Organizers said they cannot provide mainnet balance. **Their recommendation for online participants: use a local node to simulate a testnet RPC.** We use the Hardhat node (`npx hardhat node`: RPC `http://127.0.0.1:8545`, chain ID `31337`, 20 pre-funded accounts).
- Other faucet options: Thirdweb (about 0.01 tBNB/day, no mainnet balance needed), QuickNode, Chainstack. Mentors or an on-site teammate may be able to send tBNB.

## 4. What was built (changes to the web app and its logic)

### 4.1 User journey
Landing → **Sign in / Sign up (Google only, UMak email)** → profile step (name, college; sign-up only) → **Terms & Privacy (agree button unlocks only after scrolling to the end)** → **two-card role picker** over a blurred, dimmed backdrop (Student Member left, Student Officer right) → join or create an org → member portal (`/m/[org]`) or officer console (`/o/[org]`). `/admin` lets platform admins verify orgs.

### 4.2 Roles (per organization, not per account)
`president > officer > committee > member`. The same student can be a member of one org and an officer of another.
- **President:** creates the org, approves officer/committee seats, marks which officers are **signers** (their wallets approve on-chain), activates the treasury, edits settings.
- **Officer (exec board):** full officer console; signers can submit and approve requests on-chain.
- **Committee (exec comms):** officer console, can file requests, cannot approve.
- **Member:** read-only transparency dashboard, a **Requests** tab (pending requests from officers), expenses, own dues and activity; can pay dues in test pesos.
- **Platform admin:** emails in `PLATFORM_ADMIN_EMAILS`; verifies orgs at `/admin`. New orgs show "Unverified" until then.
- Joining: a join code joins instantly as a member; otherwise a request is approved by an officer (members) or the President (officer/committee seats).

### 4.3 Money rules and logic
- **Chain = money and decisions; database = people and files.** Names and emails never go on-chain. If the DB and chain disagree, the chain wins. DB tables that mirror the chain are caches refreshed from contract events (`reconcileOrg`).
- **Reimbursement model:** an officer spends first, files the request with a receipt, and is paid back when approved.
- **Requests start as drafts** (committee or officer files them); a signer submits the draft on-chain; at least **2 distinct signers** approve; the contract then releases funds exactly once. Any single signer can reject; the filer can cancel.
- **Officers approve in their own MetaMask.** The server never holds officer keys and never approves.
- **Members never need a wallet.** Dues are paid through an app-managed demo wallet (disclosed in the UI). The server relayer can only mint test pesos and deposit; it can never approve or release.
- **AI only reads the receipt** (`{merchant, date, total, items}`), cached per receipt so each one costs one request (50 free per day). Flags (amount mismatch, duplicate receipt, over budget, food-heavy purchase mix, unreadable) are plain deterministic code with neutral wording.
- **Receipt integrity:** the receipt's SHA-256 hash is stored on-chain; the portal shows "Receipt matches the on-chain record".

### 4.4 BSC / Hardhat integration
- `blockchain/contracts/PesoToken.sol` (test peso, OpenZeppelin ERC-20) and `HeronTreasury.sol` (one contract serving every org: `createOrg`, `setSigners`, `deposit`, `createRequest`, `approve`, `reject`, `cancel`, `setEventBudget`; min 2 signers; reused receipt hashes revert).
- Hardhat 3 with a `localhost` network (chain 31337) and a `bscTestnet` network (chain 97); Ignition module `ignition/modules/HeronKaban.ts`; `scripts/deploy-local.ts` deploys and writes the addresses into `.env.local`; `scripts/export-abi.ts` generates `src/lib/chain/abi.ts`.
- The app picks the chain from `NEXT_PUBLIC_CHAIN_ID` (31337 local, 97 testnet). Explorer links are hidden on the local chain. Moving to testnet is a config change (§7).
- App chain layer in `src/lib/chain/`: `config`, `client` (viem reads), `ledger` (reads events, reconciles DB), `wallet` (MetaMask, simulate-then-send, friendly error messages), `relayer` (server only, mint + dues), `money`.

### 4.5 Responsive layout
Mobile-first: phone portrait and landscape, tablet and wide screens. Officer sidebar becomes a slide-out menu on phones; member tabs work on small screens. Visual polish is left for the designer.

## 5. Supabase and Google sign-in setup (what we actually did, step by step)

### 5.1 Database (already applied, no manual SQL needed)
The repo does **not** use `supabase/migrations/` or the Supabase CLI. SQL lives in `drizzle/`:
- `drizzle/0000_init.sql`: tables.
- `drizzle/0001_rls_auth_storage.sql`: Row Level Security, the new-profile trigger, the receipts bucket, and `public.hook_restrict_signup_domain` (allows only `@umak.edu.ph`, with the needed `GRANT` to `supabase_auth_admin` and `REVOKE` from everyone else already included).

Both are applied with `npm run db:migrate` (reads `DATABASE_URL` from `.env.local`). To confirm in Supabase → SQL Editor:
```sql
select proname from pg_proc where proname = 'hook_restrict_signup_domain';
```
One row means it exists. Docker and `supabase start` (local Supabase) are not needed; we use the hosted project.

### 5.2 Google OAuth client
1. Google Cloud Console → new project "HeronKaban".
2. APIs & Services → OAuth consent screen (Google Auth Platform): choose **External**, fill in app name and support email.
3. Credentials → Create credentials → OAuth client ID → **Web application**:
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback` (not the app's `/auth/callback`: Google goes to Supabase first, then Supabase goes to the app).
4. Copy the Client ID and Client Secret.

### 5.3 Supabase dashboard
1. Authentication → Sign In / Providers → **Google**: enable, paste Client ID and Secret, save.
2. Authentication → URL Configuration: Site URL `http://localhost:3000`; Redirect URLs add `http://localhost:3000/auth/callback` (add the Vercel URL to both later, and to Google's JavaScript origins).
3. Authentication → Hooks → **Before User Created** → Postgres function → schema `public`, function `hook_restrict_signup_domain` → create and make sure it is on.
4. Put your UMak email in `PLATFORM_ADMIN_EMAILS` in `.env.local` (comma-separated, no spaces), restart `npm run dev`, sign in, and open `/admin`.

**Result:** signing in with a UMak Google account worked and the user appears in Authentication → Users. A non-UMak account is rejected by the hook (and again by the callback and by every server request).

### 5.4 "Testing" mode on the Google consent screen: what it means and what to do
A new Google OAuth app starts with publishing status **Testing**. In Testing, **only the Gmail addresses you list under "Test users" can sign in** (maximum 100); everyone else gets "Access blocked". Our UMak email domain check is separate and sits on top of this.

- **For the hackathon demo:** Testing is enough. Add the UMak emails of everyone who will sign in on demo day (team, judges' demo accounts, helpers) as Test users.
- **For all UMak students:** open the consent screen and click **Publish app** (status becomes "In production"). Because we only ask for the basic scopes (`openid`, `email`, `profile`), Google does not require a verification review, and any Google account can then reach the sign-in, with our hook still rejecting everything that is not `@umak.edu.ph`. Expect a small "unverified app" style notice only if Google shows one; that is cosmetic for these scopes.
- **"Internal" user type** would restrict to one Google Workspace organization, but it only works if the Cloud project belongs to UMak's Workspace. We cannot do that from a personal account, so we stay on External.
- Rule of thumb: keep Testing until demo day if you want a closed audience; publish when you want any UMak student to try it. Publishing can be done any time and does not change code.

## 6. Local runbook (do this every time the node restarts)

The local chain resets when the node stops, so redo steps 2 to 4 after a restart. The contract addresses stay the same on a fresh node.

1. **One-time:** `npm run chain:install`, copy `.env.example` to `.env.local` and fill in Supabase/OpenRouter values. The chain settings default to the local node:
   ```
   NEXT_PUBLIC_CHAIN_ID=31337
   NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
   RELAYER_PRIVATE_KEY=<Hardhat account #0 key, printed by the node>
   ```
2. **Terminal 1:** `npm run chain:node` (leave it running).
3. **Terminal 2:** `npm run chain:deploy:local`. It deploys both contracts and writes `NEXT_PUBLIC_TOKEN_ADDRESS` / `NEXT_PUBLIC_TREASURY_ADDRESS` into `.env.local`.
4. **Terminal 3:** `npm run dev`, then open http://localhost:3000. Restart it after editing `.env.local`.
5. **If an org was activated before the restart,** its treasury no longer exists on the fresh chain. In Supabase, clear that org's `chain_org_id` (or use a new org) and have the President activate it again.

### MetaMask for signer officers (demo laptop)
1. Create a fresh MetaMask profile used only for the hackathon. Write the recovery phrase on paper and never share it.
2. Add the network: name `Hardhat Local`, RPC `http://127.0.0.1:8545`, chain ID `31337`, symbol `ETH`. (The app also offers to add it.)
3. Import Hardhat **accounts #1, #2 and #3** (private keys printed by `npm run chain:node`) as the President and two officers. Account #0 is the app relayer: don't use it as an officer. Expected addresses:
   - #1 `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
   - #2 `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
   - #3 `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
4. Each officer signs in to HeronKaban with their own UMak Google account, opens **My wallet**, switches MetaMask to their account and clicks **Connect & link wallet**.
5. The President marks at least two officers as signers in **Officers & roles** and clicks **Activate treasury on-chain**.
6. After a node restart, if transactions hang or show nonce errors: MetaMask → Settings → Advanced → **Clear activity tab data** (per account).

### Demo flow
1. President creates the org → shares the join code.
2. Officers request seats → President approves, marks signers, activates the treasury.
3. Member joins with the code → **My dues** → pays test pesos.
4. Officer files a request with a sample receipt → the AI reads it → flags appear.
5. A signer submits it on-chain → one approval (still locked) → a second signer approves → released.
6. Member opens **Requests** / **Expenses** → sees the receipt, AI notes, approvals and "Receipt matches the on-chain record".

## 7. Moving to real BSC testnet (at the end, if possible)

1. Get a little tBNB (Thirdweb, a mentor or an on-site teammate) into a **throwaway** wallet.
2. In `blockchain/.env`: `BSC_TESTNET_RPC_URL`, `DEPLOYER_PRIVATE_KEY` (that wallet), `ETHERSCAN_API_KEY`.
3. `cd blockchain && npm run deploy:testnet -- ignition/modules/HeronKaban.ts`.
4. Verify: `npm run verify:testnet -- <PesoToken address> <deployer address>` and `npm run verify:testnet -- <HeronTreasury address> <PesoToken address>`.
5. In `.env.local` (and Vercel): `NEXT_PUBLIC_CHAIN_ID=97`, `NEXT_PUBLIC_RPC_URL=<BSC testnet RPC>`, the new addresses, and `RELAYER_PRIVATE_KEY` = the deployer key (it owns the token).
6. Officers switch MetaMask to BSC testnet and need a little tBNB each for gas. The President re-activates each org's treasury.
7. Known gap: `ledger.ts` reads logs from block 0; on testnet add the deploy block so `getLogs` stays fast.

## 8. Open questions and risks

- **Does a local-node deployment count for the "contract deployed and verified on BSC" requirement?** Ask the organizers in the event chat and get the answer in writing.
- A local node is only visible on one laptop, so the demo must run from one machine, with the app running locally and no BscScan links.
- Not yet tested in a real browser with MetaMask signing, or with a real OpenRouter call (to protect the 50/day budget).
- Never commit `.env`, `.env.local` or any private key. The pre-funded Hardhat keys are public: use them for local testing only.
- The free AI model allows 50 requests per day. Each receipt is read once and cached; use the same sample receipts for the demo.
