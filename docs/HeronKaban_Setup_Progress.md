# HeronKaban: Setup Progress Summary

**Date:** Nov 13, 2026 (Build Day)
**Event:** BCC 2026 × Binance Academy Hackathon, University of Makati
**Project:** HeronKaban, a transparent treasury for student orgs on BNB Smart Chain (BSC) with AI receipt checks
**Stack:** Next.js + Supabase, Solidity + Hardhat, local Hardhat node (BSC testnet later), Gemma via OpenRouter

---

## 1. Where we are (updated Nov 13, afternoon)

- **Contracts are written, tested and deploy to a local node.** `HeronTreasury` (multi-org) and `PesoToken` (test peso). 11 contract tests pass.
- **The app runs end to end on the local node:** Google sign-up/sign-in, scroll-gated consent, role-picker modal, org create/join, officer console, member portal, AI receipt check, on-chain approvals.
- **Supabase is set up:** tables, Row Level Security, profile trigger, sign-up domain hook function and the private `receipts` bucket are applied (`npm run db:migrate`).
- **Not done yet:** Google OAuth client in Supabase, enabling the auth hook in the dashboard, BSC testnet deployment and verification.

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

## 4. Local runbook (do this every time the node restarts)

The local chain resets when the node stops, so redo steps 2 to 4 after a restart. The contract addresses stay the same on a fresh node.

1. **One-time:** `npm run chain:install`, copy `.env.example` to `.env.local` and fill in Supabase/OpenRouter values. The chain settings default to the local node:
   ```
   NEXT_PUBLIC_CHAIN_ID=31337
   NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
   RELAYER_PRIVATE_KEY=<Hardhat account #0 key, printed by the node>
   ```
2. **Terminal 1:** `npm run chain:node` (leave it running).
3. **Terminal 2:** `npm run chain:deploy:local`. It deploys both contracts and writes `NEXT_PUBLIC_TOKEN_ADDRESS` / `NEXT_PUBLIC_TREASURY_ADDRESS` into `.env.local`.
4. **Terminal 2:** `npm run dev`, then open http://localhost:3000.
5. **If an org was activated before the restart,** its treasury no longer exists on the fresh chain. In Supabase, clear that org's `chain_org_id` (or use a new org) and have the President activate it again.

### MetaMask for signer officers (demo laptop)
1. Create a fresh MetaMask profile used only for the hackathon. Write the recovery phrase on paper and never share it.
2. Add the network: RPC `http://127.0.0.1:8545`, chain ID `31337`, symbol `ETH`. (The app also offers to add it.)
3. Import Hardhat **accounts #1, #2 and #3** (private keys printed by `npm run chain:node`) as the President and two officers. Account #0 is the app relayer: don't use it as an officer.
4. Each officer signs in to HeronKaban with their own UMak Google account, opens **My wallet**, switches MetaMask to their account and clicks **Connect & link wallet**.
5. The President marks at least two officers as signers in **Officers & roles** and clicks **Activate treasury on-chain**.

### Demo flow
1. President creates the org → shares the join code.
2. Officers request seats → President approves, marks signers, activates the treasury.
3. Member joins with the code → **My dues** → pays test pesos.
4. Officer files a request with a sample receipt → the AI reads it → flags appear.
5. A signer submits it on-chain → one approval (still locked) → a second signer approves → released.
6. Member opens **Requests** / **Expenses** → sees the receipt, AI notes, approvals and "Receipt matches the on-chain record".

## 5. Supabase dashboard steps (manual, once)

1. **Google provider:** Google Cloud Console → create an OAuth client (Web). Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`. Paste the client ID and secret into Supabase → Authentication → Sign In / Providers → Google.
2. **Redirect URLs:** Supabase → Authentication → URL Configuration: Site URL `http://localhost:3000` and add `http://localhost:3000/auth/callback` (plus the Vercel URL later).
3. **Auth hook:** Supabase → Authentication → Hooks → "Before User Created" → Postgres function `public.hook_restrict_signup_domain`.
4. **Platform admins:** put your UMak email(s) in `PLATFORM_ADMIN_EMAILS` in `.env.local` to verify orgs at `/admin`.

## 6. Moving to real BSC testnet (at the end, if possible)

1. Get a little tBNB (Thirdweb, a mentor or an on-site teammate) into a **throwaway** wallet.
2. In `blockchain/.env`: `BSC_TESTNET_RPC_URL`, `DEPLOYER_PRIVATE_KEY` (that wallet), `ETHERSCAN_API_KEY`.
3. `cd blockchain && npm run deploy:testnet -- ignition/modules/HeronKaban.ts`.
4. Verify: `npm run verify:testnet -- <PesoToken address> <deployer address>` and `npm run verify:testnet -- <HeronTreasury address> <PesoToken address>`.
5. In `.env.local` (and Vercel): `NEXT_PUBLIC_CHAIN_ID=97`, `NEXT_PUBLIC_RPC_URL=<BSC testnet RPC>`, the new addresses, and `RELAYER_PRIVATE_KEY` = the deployer key (it owns the token).
6. Officers switch MetaMask to BSC testnet and need a little tBNB each for gas. The President re-activates each org's treasury.

## 7. Open questions and risks

- **Does a local-node deployment count for the "contract deployed and verified on BSC" requirement?** Ask the organizers in the event chat and get the answer in writing.
- A local node is only visible on one laptop, so the demo must run from one machine, with the app running locally and no BscScan links.
- Never commit `.env`, `.env.local` or any private key. The pre-funded Hardhat keys are public: use them for local testing only.
- The free AI model allows 50 requests per day. Each receipt is read once and cached; use the same sample receipts for the demo.
