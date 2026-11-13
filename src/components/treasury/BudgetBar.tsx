import { formatPeso } from "@/lib/chain/money";

/** Spent (released) + pending vs budget. Text carries the numbers so color isn't the only cue. */
export function BudgetBar({ spent, pending, budget }: { spent: number; pending: number; budget: number | null }) {
  if (budget == null || budget <= 0) {
    return (
      <p className="text-sm text-gray-600">
        Spent {formatPeso(spent)}
        {pending > 0 ? ` · ${formatPeso(pending)} waiting` : ""}
      </p>
    );
  }
  const s = Math.min(100, (spent / budget) * 100);
  const p = Math.min(100 - s, (pending / budget) * 100);
  const over = spent + pending > budget;
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-gray-100" role="img" aria-label={`Spent ${formatPeso(spent)} of ${formatPeso(budget)}`}>
        <div className="bg-blue-700" style={{ width: `${s}%` }} />
        <div className="bg-blue-300" style={{ width: `${p}%` }} />
      </div>
      <p className={`mt-1 text-xs ${over ? "font-medium text-amber-800" : "text-gray-600"}`}>
        Spent {formatPeso(spent)} of {formatPeso(budget)} ({Math.round((spent / budget) * 100)}%)
        {pending > 0 ? ` · ${formatPeso(pending)} waiting for approval` : ""}
        {over ? " · would go over budget" : ""}
      </p>
    </div>
  );
}
