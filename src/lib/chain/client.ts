import { createPublicClient, http } from "viem";
import { chain, RPC_URL } from "./config";

export { chain, explorerAddressUrl, explorerTxUrl } from "./config";

/** Read-only chain client (balances, contract reads, event logs). No keys here. */
export function getPublicClient() {
  return createPublicClient({ chain, transport: http(RPC_URL) });
}
