import type { Flag, ReceiptExtraction } from "@/db/schema";

/**
 * Deterministic receipt checks (FR-05/FR-06). The AI only EXTRACTS {total, items, date};
 * every comparison here is plain code, so the same inputs always give the same flags.
 * Flags are advisory notes for humans ("Needs review"), never verdicts.
 */

export const FOOD_WORDS =
  /\b(food|meal|snack|lunch|dinner|breakfast|merienda|rice|chicken|pork|beef|burger|pizza|pasta|noodle|pancit|spaghetti|bread|cake|donut|coffee|tea|juice|soda|softdrink|soft drink|coke|sprite|water|drinks?|beverage|chips|biscuit|candy|ice cream|fries|siopao|lumpia|kakanin)\b/i;

export function isFoodItem(item: { name: string; category?: string | null }) {
  return item.category?.toLowerCase() === "food" || FOOD_WORDS.test(item.name);
}

export type CheckInput = {
  requestedAmount: number;
  extraction: ReceiptExtraction | null;
  extractionError?: string | null;
  event?: { name: string; category: string; budget: number | null } | null;
  /** Sum of other non-cancelled/non-rejected requests already filed under the same event. */
  eventCommittedOther?: number;
  /** Other requests in the org whose receipt looks the same (same total + date, and merchant if known). */
  lookalikes?: { purpose: string }[];
};

const peso = (n: number) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function computeFlags(input: CheckInput): Flag[] {
  const flags: Flag[] = [];
  const x = input.extraction;

  if (!x || x.total == null) {
    flags.push({
      type: "unreadable",
      note: input.extractionError
        ? "The receipt couldn't be read automatically. Needs review by an officer."
        : "No total could be found on the receipt. Needs review.",
    });
  }

  if (x?.total != null) {
    const diff = Math.abs(x.total - input.requestedAmount);
    if (diff > Math.max(1, input.requestedAmount * 0.01)) {
      flags.push({
        type: "amount_mismatch",
        note: `The receipt total reads ${peso(x.total)} but the request is for ${peso(input.requestedAmount)}. Needs review.`,
      });
    }
  }

  if (input.lookalikes && input.lookalikes.length > 0) {
    flags.push({
      type: "duplicate_receipt",
      note: `This receipt looks like one already filed ("${input.lookalikes[0].purpose}"): same total and date. Needs review.`,
    });
  }

  const ev = input.event;
  if (ev?.budget != null) {
    const after = (input.eventCommittedOther ?? 0) + input.requestedAmount;
    if (after > ev.budget) {
      flags.push({
        type: "over_budget",
        note: `With this request, "${ev.name}" would use ${peso(after)} of its ${peso(ev.budget)} budget. Needs review.`,
      });
    }
  }

  if (ev && ev.category !== "food" && x && x.items.length > 0) {
    const priced = x.items.filter((i) => typeof i.amount === "number" && i.amount > 0);
    const basis = priced.length > 0 ? priced : x.items;
    const total = priced.length > 0 ? priced.reduce((s, i) => s + (i.amount ?? 0), 0) : basis.length;
    const food = priced.length > 0
      ? priced.filter(isFoodItem).reduce((s, i) => s + (i.amount ?? 0), 0)
      : basis.filter(isFoodItem).length;
    const share = total > 0 ? food / total : 0;
    if (share >= 0.6) {
      flags.push({
        type: "purchase_mix",
        note: `About ${Math.round(share * 100)}% of this receipt is food, but "${ev.name}" isn't a food event. Needs review.`,
      });
    }
  }

  return flags;
}

export const FLAG_LABEL: Record<Flag["type"], string> = {
  amount_mismatch: "Amount differs",
  duplicate_receipt: "Possible duplicate",
  over_budget: "Over event budget",
  purchase_mix: "Unusual purchase mix",
  unreadable: "Receipt unreadable",
};

/** Spending categories for the member dashboard. */
export function categorize(item: { name: string; category?: string | null }): string {
  if (isFoodItem(item)) return "Food & drinks";
  const c = item.category?.toLowerCase();
  if (c && ["supplies", "venue", "transport", "printing", "prizes", "equipment"].includes(c)) {
    return c[0].toUpperCase() + c.slice(1);
  }
  return "Other";
}
