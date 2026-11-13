import type { OrgRole } from "@/db/schema";

/** Per-org hierarchy. Higher rank includes everything a lower rank can do. */
export const ROLE_RANK: Record<OrgRole, number> = { member: 1, committee: 2, officer: 3, president: 4 };

export function roleAtLeast(role: OrgRole, min: OrgRole) {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

export const ROLE_LABEL: Record<OrgRole, string> = {
  president: "President",
  officer: "Officer",
  committee: "Committee",
  member: "Member",
};

/**
 * What each role can do (shown in the UI and enforced in server actions).
 * Approving on-chain additionally requires being a signer with a linked wallet.
 */
export const ROLE_ABILITIES: Record<OrgRole, string[]> = {
  president: [
    "Everything officers can do",
    "Approve officer and committee requests",
    "Choose signers and the approval rule",
    "Activate the treasury and edit org settings",
  ],
  officer: ["File expense requests", "Approve or reject requests (if a signer)", "Manage events, budgets and members"],
  committee: ["Open the officer console", "File expense requests (a signer submits them)", "See the collections roster"],
  member: ["See balance, expenses, receipts and AI notes", "See pending requests", "Pay dues"],
};
