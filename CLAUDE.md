# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

HeronKaban: a transparent, AI-checked treasury for UMak student organizations on **BNB Smart Chain testnet** (chain id 97). Built for the BCC 2026 × Binance Academy Hackathon (build day Nov 13, 2026). The source of truth for scope and decisions is in `docs/`:

- `docs/HeronKaban_PRD.md`: requirements (FR-01…FR-12), KPIs, constraints
- `docs/HeronKaban_Architecture.md`: structure, corrected flow, data ownership, contract surface, DB tables, build order
- `docs/HeronKaban_Summary.md`: decisions, team roles, open items

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
npm run chain:compile                     # = hardhat build
npm run chain:test                        # all tests
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

- Member portal `/m/...` (read-only, information-rich) and officer console `/o/...` (request, approve, admin). Planned as route groups `src/app/(member)/m` and `src/app/(officer)/o`. Same login; role decides access.
- The trust layer has no pages: the BSC contract (`blockchain/`), the AI receipt reader (planned `src/app/api/ai/check-receipt`), and Supabase.

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
- `lib/chain/client.ts`: viem public client for BSC testnet and explorer links. Contract ABIs and addresses come from `blockchain/` builds and `NEXT_PUBLIC_TREASURY_ADDRESS`/`NEXT_PUBLIC_TOKEN_ADDRESS`.
- `lib/ai/openrouter.ts`: OpenRouter base URL, model and headers (`OPENROUTER_MODEL`, default `google/gemma-4-26b-a4b-it:free`).

**Blockchain package (`blockchain/`):** its own ESM package, excluded from the root `tsconfig` and ESLint. Contracts go in `contracts/`, Ignition modules in `ignition/modules/`, tests in `test/`. Secrets go in `blockchain/.env` (loaded by `process.loadEnvFile`) or `npx hardhat keystore set`: `BSC_TESTNET_RPC_URL`, `DEPLOYER_PRIVATE_KEY` (throwaway faucet wallet), `ETHERSCAN_API_KEY` (Etherscan v2 key covers BscScan; Sourcify is the fallback verifier). Contract surface to build (Architecture §12): peso-pegged test ERC-20 (OpenZeppelin) plus a treasury with `deposit`, `createRequest(amount, payee, eventId, receiptHash)`, `approve`, `reject`/`cancel`, `setOfficers(list, threshold)`, and optional `setEventBudget`. Release once on threshold; no double approval or double release.

## Environment

Copy `.env.example` to `.env.local` (app) and `blockchain/.env.example` to `blockchain/.env`. Set the same app vars in Vercel. Everything must stay on free tiers (Vercel, Supabase, OpenRouter free model, BSC testnet).

## Planned layout (not created yet)

- `src/app/(member)/m/...`, `src/app/(officer)/o/...`, `src/app/api/ai/check-receipt/`
- `.claude/skills/`: project skills to be added later (e.g. deploy-contract, seed-demo-data)
- `drizzle/`: generated migrations (created by `db:generate`)

## Hackathon constraints

Testnet only, no real funds, no token launches. At least one contract deployed **and verified** on BSC testnet. Commit history must show the work was done Nov 12-13. Build order: contract → officer flow → AI route → member read pages → login/consent → timeline/hash badge → design skin.
