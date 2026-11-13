// Drizzle table definitions (see docs/HeronKaban_Architecture.md §13).
// Rule: chain = money and decisions; database = people and files. Tables that mirror chain
// data (requests.status, deposits) are CACHES: if they disagree with the chain, the chain wins.
// RLS policies, helper functions, the auth hook and the storage bucket live in the custom
// migration drizzle/0001_rls_auth_storage.sql.
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const peso = (name: string) => numeric(name, { precision: 14, scale: 2, mode: "number" });

// ───────────────────────── Enums ─────────────────────────

/** Per-org hierarchy: president > officer (exec board) > committee (exec comms) > member. */
export const orgRole = pgEnum("org_role", ["president", "officer", "committee", "member"]);
export const membershipStatus = pgEnum("membership_status", ["pending", "active", "rejected", "removed"]);
export const orgStatus = pgEnum("org_status", ["unverified", "verified"]);
/** draft = filed in the app, not yet on-chain (e.g. filed by a committee member). */
export const requestStatus = pgEnum("request_status", ["draft", "pending", "released", "rejected", "cancelled"]);
export const eventCategory = pgEnum("event_category", [
  "general",
  "food",
  "seminar",
  "sports",
  "outreach",
  "competition",
  "other",
]);

// ───────────────────────── People ─────────────────────────

export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  college: text("college"),
  /** Officer wallet (MetaMask). Linked only after a signed-message proof. */
  walletAddress: text("wallet_address").unique(),
  walletVerifiedAt: timestamp("wallet_verified_at", { withTimezone: true }),
  /** Set when the sign-up profile step is completed. */
  profileCompletedAt: timestamp("profile_completed_at", { withTimezone: true }),
  consentVersion: text("consent_version"),
  consentAt: timestamp("consent_at", { withTimezone: true }),
  createdAt: createdAt(),
});

// ───────────────────────── Orgs ─────────────────────────

export const orgs = pgTable("orgs", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  college: text("college"),
  status: orgStatus("status").notNull().default("unverified"),
  /** Shared by officers; entering it joins instantly as a member. Hidden from members by RLS. */
  joinCode: text("join_code").notNull().unique(),
  /** Set when the President activates the treasury on-chain (createOrg). */
  chainOrgId: bigint("chain_org_id", { mode: "number" }).unique(),
  /** Cached from the chain (OrgCreated/SignersSet). */
  chainThreshold: integer("chain_threshold"),
  chainSigners: jsonb("chain_signers").$type<string[]>(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => profiles.id),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedBy: uuid("verified_by").references(() => profiles.id),
  createdAt: createdAt(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: orgRole("role").notNull().default("member"),
    /** What the user asked for while status = pending (e.g. "officer"). */
    requestedRole: orgRole("requested_role"),
    /** Free-form title, e.g. "Treasurer", "VP Finance", "Logistics Head". */
    positionTitle: text("position_title"),
    /** Chosen by the President: this person's wallet goes into the on-chain signer list. */
    isSigner: boolean("is_signer").notNull().default(false),
    status: membershipStatus("status").notNull().default("pending"),
    note: text("note"),
    decidedBy: uuid("decided_by").references(() => profiles.id),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("memberships_org_user_uq").on(t.orgId, t.userId), index("memberships_user_idx").on(t.userId)],
);

// ───────────────────────── Money ─────────────────────────

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Global number used as `eventId` on-chain (0 on-chain = no event). */
    chainEventId: integer("chain_event_id").generatedAlwaysAsIdentity().notNull().unique(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    category: eventCategory("category").notNull().default("general"),
    budget: peso("budget"),
    startsOn: timestamp("starts_on", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: createdAt(),
  },
  (t) => [index("events_org_idx").on(t.orgId)],
);

export type Flag = {
  type: "amount_mismatch" | "duplicate_receipt" | "over_budget" | "purchase_mix" | "unreadable";
  note: string;
};

export const requests = pgTable(
  "requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").references(() => events.id, { onDelete: "set null" }),
    /** Null while status = draft. */
    chainRequestId: bigint("chain_request_id", { mode: "number" }).unique(),
    purpose: text("purpose").notNull(),
    amount: peso("amount").notNull(),
    /** Reimbursement model: usually the wallet of the officer who paid. */
    payeeAddress: text("payee_address").notNull(),
    receiptPath: text("receipt_path").notNull(),
    receiptMime: text("receipt_mime"),
    /** 0x-prefixed SHA-256 of the receipt file; stored on-chain at createRequest. */
    receiptHash: text("receipt_hash").notNull().unique(),
    status: requestStatus("status").notNull().default("draft"),
    approvals: integer("approvals").notNull().default(0),
    threshold: integer("threshold"),
    /** Deterministic flags computed by code from the AI extraction (advisory only). */
    flags: jsonb("flags").$type<Flag[]>().notNull().default(sql`'[]'::jsonb`),
    filedBy: uuid("filed_by")
      .notNull()
      .references(() => profiles.id),
    submittedBy: uuid("submitted_by").references(() => profiles.id),
    createdTxHash: text("created_tx_hash"),
    closedTxHash: text("closed_tx_hash"),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("requests_org_idx").on(t.orgId)],
);

export type ReceiptExtraction = {
  merchant?: string | null;
  date?: string | null;
  total?: number | null;
  currency?: string | null;
  items: { name: string; qty?: number | null; amount?: number | null; category?: string | null }[];
};

/** AI results cached by receipt hash: one model call per receipt, ever (50 free calls/day). */
export const aiChecks = pgTable("ai_checks", {
  receiptHash: text("receipt_hash").primaryKey(),
  model: text("model").notNull(),
  extracted: jsonb("extracted").$type<ReceiptExtraction>(),
  error: text("error"),
  createdAt: createdAt(),
});

/** Cache of custodial deposits so a member can see their own payments by name. */
export const deposits = pgTable(
  "deposits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id),
    amount: peso("amount").notNull(),
    note: text("note"),
    memberRef: text("member_ref").notNull(),
    txHash: text("tx_hash").notNull().unique(),
    createdAt: createdAt(),
  },
  (t) => [index("deposits_org_idx").on(t.orgId), index("deposits_user_idx").on(t.userId)],
);

/** Off-chain timeline items ("Recorded by app"). On-chain events come from the contract log. */
export const activity = pgTable(
  "activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => profiles.id),
    kind: text("kind").notNull(),
    refId: uuid("ref_id"),
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [index("activity_org_idx").on(t.orgId)],
);

export type Profile = typeof profiles.$inferSelect;
export type Org = typeof orgs.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type OrgRole = (typeof orgRole.enumValues)[number];
export type Event = typeof events.$inferSelect;
export type ExpenseRequest = typeof requests.$inferSelect;
export type Deposit = typeof deposits.$inferSelect;
