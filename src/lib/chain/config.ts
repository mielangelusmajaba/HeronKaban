import { bscTestnet, hardhat } from "viem/chains";
import type { Address } from "viem";

// Shared by server and client code. NEXT_PUBLIC_* are read literally so Next inlines them.
// Switching from the local node to BSC testnet is a config change only:
//   NEXT_PUBLIC_CHAIN_ID=97, NEXT_PUBLIC_RPC_URL=<bsc rpc>, new contract addresses.
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 31337);
export const chain = CHAIN_ID === 97 ? bscTestnet : hardhat;
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";
export const isLocalChain = CHAIN_ID !== 97;

export const TREASURY_ADDRESS = (process.env.NEXT_PUBLIC_TREASURY_ADDRESS || undefined) as Address | undefined;
export const TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_TOKEN_ADDRESS || undefined) as Address | undefined;

/** True when the contracts have been deployed and their addresses configured. */
export const chainConfigured = Boolean(TREASURY_ADDRESS && TOKEN_ADDRESS);

/** Test Peso uses 18 decimals; 1 tPHP = PHP 1. */
export const PESO_DECIMALS = 18;

/** Block explorer links exist only on BSC testnet. On the local node they return null. */
export function explorerTxUrl(txHash: string): string | null {
  return isLocalChain ? null : `${bscTestnet.blockExplorers.default.url}/tx/${txHash}`;
}

export function explorerAddressUrl(address: string): string | null {
  return isLocalChain ? null : `${bscTestnet.blockExplorers.default.url}/address/${address}`;
}

export const networkLabel = isLocalChain ? "Local test network" : "BNB Smart Chain testnet";
