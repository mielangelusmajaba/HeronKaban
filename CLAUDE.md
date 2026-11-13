# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

HeronKaban: a transparent, AI-checked treasury for UMak student organizations on **BNB Smart Chain**. Built for the BCC 2026 × Binance Academy Hackathon (build day Nov 13, 2026). Because the BSC faucet needs a mainnet balance, development and the demo run on a **local Hardhat node (chain id 31337)**; BSC testnet (97) is a config switch (`NEXT_PUBLIC_CHAIN_ID`). The source of truth for scope and decisions is in `docs/`:

- `docs/HeronKaban_PRD.md`: requirements (FR-01…FR-21), roles, KPIs, constraints
- `docs/HeronKaban_Architecture.md`: §0 is the implemented MVP (journey, roles, sitemap, contract, lifecycle, data); older sections hold the reasoning
- `docs/HeronKaban_Summary.md`: decisions, team roles, open items
- `docs/HeronKaban_Setup_Progress.md`: local-node runbook, MetaMask setup, Supabase dashboard steps, BSC testnet switch

Read the relevant doc section before building a feature. Where the docs disagree, the Architecture doc is the newer one.

## Commands

Root (Next.js app):

```bash
npm run dev            # dev server (Turbopack) on :3000
npm run build          # production build (what Vercel runs)
npm run lint           # ESLint (ignores blockchain/ and drizzle/)
npm run typecheck      # next typegen + tsc; typegen creates the global LayoutProps/PageProps types
npm run db:generate    # drizzle-kit: SQL migration from src/db/schema.ts into drizzle/
npm run db:migrate     # apply migrations to Supabase (reads DATABASE_URL from .env.local)
npm run db:push        # push schema directly (quick prototyping)
npm run db:studio
```

Blockchain (separate package in `blockchain/`, with its own `node_modules`):

```bash
npm run chain:install                     # first time
npm run chain:compile                     # hardhat build + export ABIs to src/lib/chain/abi.ts
npm run chain:test                        # all tests
npm run chain:node                        # local Hardhat node on :8545 (chain 31337); keep running
npm run chain:deploy:local                # deploy to the local node, writes addresses into .env.local
cd blockchain && npm run export-abi       # regenerate src/lib/chain/abi.ts after contract changes
cd blockchain && npx hardhat test nodejs test/<File>.ts   # single TS test file (node:test + viem)
cd blockchain && npx hardhat test --grep "<name>"        # tests matching a name
cd blockchain && npx hardhat test solidity                # Solidity tests (*.t.sol)
cd blockchain && npm run deploy:testnet -- ignition/modules/<Module>.ts
cd blockchain && npm run verify:testnet -- <address> [constructor args]
```

## Stack and versions (these differ from older training data)

- **Next.js 16** (App Router, `src/` dir, React 19). `cacheComponents: true` is on in `next.config.ts`: reading `cookies()`/the session outside `<Suspense>` is a **build error**. `middleware.ts` is now **`src/proxy.ts`** (export `proxy`). Check `node_modules/next/dist/docs/` before using Next APIs. `01-app/02-guides/authentication-with-cache-components.md` is the relevant auth guide.
- **Tailwind v4** (CSS-first config in `src/app/globals.css`, loaded via `@tailwindcss/turbopack`; there is no `tailwind.config`).
- **Zod v4** (`z.url()`, not `z.string().url()`).
- **Hardhat 3** (ESM, `defineConfig`, `configVariable`, `hardhat build`, Ignition for deploys, viem toolbox, node test runner). Not Hardhat 2: no `hardhat.config.js`, no ethers toolbox, no `npx hardhat compile` habits. OpenZeppelin Contracts 5.x, Solidity 0.8.34.
- **Supabase** (`@supabase/ssr`) for auth, storage and Postgres. **Drizzle ORM** (postgres-js driver) for typed queries and migrations. **viem** for chain reads in the app.
- **Better Auth was deliberately not used.** Supabase Auth (Google OAuth) is the only auth system, because RLS policies depend on `auth.uid()`. Don't add a second auth library.

## Architecture

**One Next.js app, two surfaces, plus a trust layer** (Architecture §3):

- Member portal `src/app/m/[org]` (read-only + pay dues; tabs) and officer console `src/app/o/[org]` (sidebar; committee and above). Onboarding: `src/app/auth/*` (sign-in, sign-up + profile step, callback, continue router, scroll-gated consent) and `src/app/welcome/*` (two-card role picker, join/create org). `/admin` verifies orgs. Same login; the per-org role decides access.
- **Per-org roles:** `president > officer > committee > member` (`memberships.role`), plus `is_signer` for officers whose wallet is on the on-chain signer list. Check roles with `requireOrgAccess(slug, minRole)` (pages) or `assertOrgAccess(orgId, minRole)` (server actions) from `src/lib/auth.ts`.
- The trust layer has no pages: the contract (`blockchain/`), the AI receipt reader (`src/lib/ai/receipt.ts`, called from the `fileRequest` server action), and Supabase.
- **Every page reads the session inside `<Suspense>`** (static shell + async body) because of `cacheComponents`. `src/lib/supabase/server.ts` calls `await connection()` first.

**Hard rules that span the codebase:**

1. **Chain = money and decisions; database = people and files.** Names and emails never go on-chain. On-chain data is addresses, amounts, ids and the receipt hash only. If the DB and the chain disagree about money, the chain wins.
2. **Officers sign approvals themselves** (own wallet, e.g. MetaMask on BSC testnet). The contract counts distinct approvals and releases funds on the threshold (2 of 3, or 2 of 2). The app server must never hold officer keys or relay "approvals" collected in the DB, or the contract becomes a rubber stamp.
3. **AI is advisory and never moves money.** The AI only *extracts* `{total, items, date}` from a receipt. Amount comparison, duplicate detection and budget checks are plain deterministic code. Flags use neutral wording ("Needs review").
4. **AI budget: 50 free OpenRouter requests per day**, shared by build, test and demo. Cache every AI result (`ai_checks` table) keyed to the receipt and reuse it; never call the model twice for the same receipt. Free models only; no paid fallback. Dummy receipts only.
5. **Receipt integrity:** the image lives in Supabase Storage; its hash goes on-chain via `createRequest(..., receiptHash)` so the portal can show "receipt matches on-chain record".
6. **No separate audit table.** Contract events (`Deposited`, `RequestCreated`, `Approved`, `Released`, `Rejected`) are the audit trail. The Activity timeline merges them with off-chain events and labels each one "Verified on-chain" or "Recorded by app".
7. UMak email-domain restriction (`ALLOWED_EMAIL_DOMAIN`, exact domain TBC) is enforced **on the server**, not just in the UI.
8. UX: no crypto jargon in the UI ("dues"/"expenses", not "tokens"/"gas"), mobile-first, clear pending/approved/released/flagged states.

**Integration modules (in `src/`):**

- `lib/env/public.ts` / `lib/env/server.ts`: lazily-validated env (Zod). `server.ts` is `server-only`. `NEXT_PUBLIC_*` vars must be read literally so Next can inline them.
- `lib/supabase/client.ts` (browser), `server.ts` (RSC/actions/route handlers; one per request), `admin.ts` (secret key, **bypasses RLS**), `proxy.ts` (session refresh, called from `src/proxy.ts`; it passes requests through when Supabase env is unset).
- `db/index.ts` `getDb()`: Drizzle over Supabase's transaction pooler (`prepare: false`). It connects as the owner role, so it **bypasses RLS**: authorize first, or use the Supabase server client for user-scoped reads. Tables go in `db/schema.ts` (planned list in Architecture §13).
- `lib/chain/config.ts` (chain from `NEXT_PUBLIC_CHAIN_ID`, RPC, addresses, explorer links that are null on the local node), `client.ts` (viem public client), `abi.ts` (GENERATED by `blockchain/scripts/export-abi.ts`), `ledger.ts` (reads org state/events, `reconcileOrg` updates DB caches from contract events, `syncTx`), `wallet.ts` (client: MetaMask, `writeTreasury` simulates then sends, friendly revert messages), `relayer.ts` (server-only: mints test pesos + custodial member deposits ONLY), `money.ts`, `link-message.ts`.
- `lib/auth.ts`: data access layer (`getViewer`, `requireViewer`, `requireOrgAccess`, `assertOrgAccess`, `nextStepFor`). `lib/roles.ts`, `lib/consent.ts` (`CONSENT_VERSION`).
- `lib/orgs/actions.ts` (create/join/request/decide/roles/join code/settings/verify), `lib/treasury/actions.ts` (wallet link, activate treasury, sync, pay dues, events, file request, recheck, drafts), `lib/treasury/queries.ts` (overview, timeline, request detail with receipt-hash integrity, roster, deposits).
- `lib/ai/openrouter.ts` + `lib/ai/receipt.ts`: OpenRouter config and the cached receipt reader (`OPENROUTER_MODEL`, default `google/gemma-4-26b-a4b-it:free`). `lib/checks.ts`: deterministic flags (amount mismatch, duplicate, over budget, food-heavy mix, unreadable).
- `components/ui.tsx`: minimal primitives (Button, Card, Badge, Field…) so the design skin can be swapped in one place. `components/treasury/*`: shared display, client widgets, sidebar, member tabs.

**Blockchain package (`blockchain/`):** its own ESM package, excluded from the root `tsconfig` and ESLint. Contracts go in `contracts/`, Ignition modules in `ignition/modules/`, tests in `test/`. Secrets go in `blockchain/.env` (loaded by `process.loadEnvFile`) or `npx hardhat keystore set`: `BSC_TESTNET_RPC_URL`, `DEPLOYER_PRIVATE_KEY` (throwaway faucet wallet), `ETHERSCAN_API_KEY` (Etherscan v2 key covers BscScan; Sourcify is the fallback verifier). Contract surface to build (Architecture §12): peso-pegged test ERC-20 (OpenZeppelin) plus a treasury with `deposit`, `createRequest(amount, payee, eventId, receiptHash)`, `approve`, `reject`/`cancel`, `setOfficers(list, threshold)`, and optional `setEventBudget`. Release once on threshold; no double approval or double release.

## Environment

Copy `.env.example` to `.env.local` (app) and `blockchain/.env.example` to `blockchain/.env`. Set the same app vars in Vercel. Everything must stay on free tiers (Vercel, Supabase, OpenRouter free model, BSC testnet). New vars: `NEXT_PUBLIC_CHAIN_ID`, `NEXT_PUBLIC_RPC_URL` (replaces `NEXT_PUBLIC_BSC_RPC_URL`), `RELAYER_PRIVATE_KEY` (Hardhat account #0 locally), `PLATFORM_ADMIN_EMAILS`.

Manual Supabase steps (Google provider, redirect URLs, enabling the "Before User Created" hook) are in `docs/HeronKaban_Setup_Progress.md` §5.

## Database

- `drizzle/0000_init.sql` is generated from `src/db/schema.ts`. `drizzle/0001_rls_auth_storage.sql` is a **custom** migration (RLS policies, helper functions, profile trigger, `hook_restrict_signup_domain`, `receipts` bucket). For schema changes run `npm run db:generate` then `npm run db:migrate`; write RLS/SQL-only changes with `npx drizzle-kit generate --custom`.
- Tables that mirror the chain (`requests.status/approvals/chain_request_id`, `orgs.chain_signers/threshold`) are caches: update them through `reconcileOrg`, not by hand.

## Not built yet

- `.claude/skills/`: project skills (e.g. deploy-contract, seed-demo-data)
- BSC testnet deployment + verification; a deploy-block setting for `getLogs` on testnet (`ledger.ts` reads from block 0)
- Designer's skin (FR-12); dark mode

## Hackathon constraints

Testnet only, no real funds, no token launches. At least one contract deployed **and verified** on BSC testnet (local node meanwhile; confirm with organizers). Commit history must show the work was done Nov 12-13. Done so far: contract → officer flow → AI read + checks → member pages → login/consent → timeline/hash badge. Remaining: testnet deploy/verify, design skin.
