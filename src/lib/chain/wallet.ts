"use client";

import {
  BaseError,
  ContractFunctionRevertedError,
  createPublicClient,
  createWalletClient,
  custom,
  http,
  numberToHex,
  type Address,
  type EIP1193Provider,
  type Hash,
} from "viem";
import { heronTreasuryAbi } from "./abi";
import { chain, CHAIN_ID, RPC_URL, TREASURY_ADDRESS } from "./config";

/**
 * Officer wallet helpers (MetaMask or any injected wallet). Officers sign their own
 * approvals: the app server never holds officer keys (CLAUDE.md hard rule 2).
 */

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

export function hasWallet() {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

function provider(): EIP1193Provider {
  if (!window.ethereum) throw new Error("No wallet found. Install MetaMask to sign as an officer.");
  return window.ethereum;
}

export async function connectWallet(): Promise<Address> {
  const [account] = await provider().request({ method: "eth_requestAccounts" });
  if (!account) throw new Error("No account selected in your wallet.");
  return account;
}

/** Switch the wallet to our network, adding it first if needed. */
export async function ensureChain() {
  const p = provider();
  const current = await p.request({ method: "eth_chainId" });
  if (Number(current) === CHAIN_ID) return;
  try {
    await p.request({ method: "wallet_switchEthereumChain", params: [{ chainId: numberToHex(CHAIN_ID) }] });
  } catch (e) {
    if ((e as { code?: number }).code !== 4902) throw e;
    await p.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: numberToHex(CHAIN_ID),
          chainName: CHAIN_ID === 97 ? "BNB Smart Chain Testnet" : "HeronKaban Local (Hardhat)",
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: [RPC_URL],
          blockExplorerUrls: chain.blockExplorers ? [chain.blockExplorers.default.url] : undefined,
        },
      ],
    });
  }
}

export async function signLinkMessage(address: Address, message: string) {
  return createWalletClient({ account: address, transport: custom(provider()) }).signMessage({ account: address, message });
}

type TreasuryWrite =
  | { functionName: "createOrg"; args: readonly [readonly Address[], number] }
  | { functionName: "setSigners"; args: readonly [bigint, readonly Address[], number] }
  | { functionName: "createRequest"; args: readonly [bigint, bigint, Address, bigint, `0x${string}`] }
  | { functionName: "approve" | "reject" | "cancel"; args: readonly [bigint] }
  | { functionName: "setEventBudget"; args: readonly [bigint, bigint, bigint] };

/**
 * Send a treasury transaction from the officer's wallet. `expected` is the wallet linked
 * to their HeronKaban profile; we refuse to send from a different account to avoid confusion.
 * Simulates first so contract errors show as readable messages before MetaMask opens.
 */
export async function writeTreasury(expected: Address, call: TreasuryWrite): Promise<Hash> {
  if (!TREASURY_ADDRESS) throw new Error("The treasury contract address isn't configured.");
  await ensureChain();
  const account = await connectWallet();
  if (account.toLowerCase() !== expected.toLowerCase()) {
    throw new Error(`Your wallet is on ${short(account)}, but your linked wallet is ${short(expected)}. Switch accounts in MetaMask.`);
  }
  const pub = createPublicClient({ chain, transport: http(RPC_URL) });
  const wallet = createWalletClient({ account, chain, transport: custom(provider()) });
  try {
    const { request } = await pub.simulateContract({
      account,
      address: TREASURY_ADDRESS,
      abi: heronTreasuryAbi,
      ...(call as { functionName: "approve"; args: readonly [bigint] }),
    });
    return await wallet.writeContract(request);
  } catch (e) {
    throw new Error(explain(e));
  }
}

const FRIENDLY: Record<string, string> = {
  NotSigner: "Your wallet isn't on this org's signer list.",
  AlreadyApproved: "You already approved this request.",
  NotPending: "This request is no longer pending.",
  InsufficientBalance: "The treasury doesn't have enough funds for this request yet.",
  ReceiptAlreadyUsed: "This receipt was already used in another request.",
  OverEventBudget: "This would go over the event's on-chain budget cap.",
  NotOrgAdmin: "Only the President's linked wallet can change signers.",
  BadSigners: "The signer list needs at least 2 different wallets.",
  BadThreshold: "The approval rule must be at least 2 and no more than the number of signers.",
  NotRequester: "Only the officer who submitted this request can cancel it.",
  UnknownOrg: "This org's treasury wasn't found on the network. If the local node restarted, re-activate it.",
};

export function explain(e: unknown): string {
  if (e instanceof BaseError) {
    const revert = e.walk((x) => x instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const name = revert.data?.errorName ?? "";
      return FRIENDLY[name] ?? `The contract refused this (${name || revert.reason || "reverted"}).`;
    }
    if (/User (rejected|denied)/i.test(e.message)) return "You cancelled the request in your wallet.";
    return e.shortMessage;
  }
  return e instanceof Error ? e.message : "Something went wrong with the wallet.";
}

export function short(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
