import { formatUnits, parseUnits } from "viem";
import { PESO_DECIMALS } from "./config";

/** Pesos (as typed by a user, e.g. "1200.50") to on-chain units. */
export function toUnits(pesos: string | number): bigint {
  return parseUnits(String(pesos), PESO_DECIMALS);
}

/** On-chain units to pesos (fine for display at prototype scale). */
export function toPesos(units: bigint): number {
  return Number(formatUnits(units, PESO_DECIMALS));
}

const fmt = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 });

export function formatPeso(amount: number | string | bigint): string {
  const n = typeof amount === "bigint" ? toPesos(amount) : Number(amount);
  return fmt.format(n);
}
