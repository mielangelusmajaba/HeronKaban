import { createPublicClient, http } from "viem";
import { bscTestnet } from "viem/chains";
import { publicEnv } from "@/lib/env/public";

export const chain = bscTestnet; // chain id 97, testnet only

/** Read-only client for BSC testnet (balances, contract reads, event logs). No keys here. */
export function getPublicClient() {
  return createPublicClient({ chain, transport: http(publicEnv().NEXT_PUBLIC_BSC_RPC_URL) });
}

export function explorerTxUrl(txHash: string) {
  return `${chain.blockExplorers.default.url}/tx/${txHash}`;
}

export function explorerAddressUrl(address: string) {
  return `${chain.blockExplorers.default.url}/address/${address}`;
}
