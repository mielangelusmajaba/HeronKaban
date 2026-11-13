import "server-only";
import { createWalletClient, http, type Hash } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { serverEnv } from "@/lib/env/server";
import { heronTreasuryAbi, pesoTokenAbi } from "./abi";
import { getPublicClient } from "./client";
import { chain, RPC_URL, TOKEN_ADDRESS, TREASURY_ADDRESS } from "./config";

/**
 * The app relayer: a server-held key used ONLY to
 *   1. mint Test Pesos (play money), and
 *   2. make custodial member deposits ("Pay dues (test pesos)").
 * It must never create, approve, reject or cancel requests (CLAUDE.md hard rule 2):
 * those are signed by officers in their own wallets.
 */
function relayer() {
  const key = serverEnv().RELAYER_PRIVATE_KEY;
  if (!key) throw new Error("RELAYER_PRIVATE_KEY is not set");
  if (!TREASURY_ADDRESS || !TOKEN_ADDRESS) throw new Error("Contract addresses are not configured");
  const account = privateKeyToAccount(key as `0x${string}`);
  return {
    account,
    wallet: createWalletClient({ account, chain, transport: http(RPC_URL) }),
    treasury: TREASURY_ADDRESS,
    token: TOKEN_ADDRESS,
  };
}

/** Mint `amount` test pesos to the relayer and deposit them into the org on a member's behalf. */
export async function custodialDeposit(chainOrgId: bigint, amount: bigint, memberRef: `0x${string}`): Promise<Hash> {
  const { wallet, account, treasury, token } = relayer();
  const pub = getPublicClient();

  const mint = await wallet.writeContract({
    address: token,
    abi: pesoTokenAbi,
    functionName: "mint",
    args: [account.address, amount],
  });
  await pub.waitForTransactionReceipt({ hash: mint });

  const approve = await wallet.writeContract({
    address: token,
    abi: pesoTokenAbi,
    functionName: "approve",
    args: [treasury, amount],
  });
  await pub.waitForTransactionReceipt({ hash: approve });

  const deposit = await wallet.writeContract({
    address: treasury,
    abi: heronTreasuryAbi,
    functionName: "deposit",
    args: [chainOrgId, amount, memberRef],
  });
  await pub.waitForTransactionReceipt({ hash: deposit });
  return deposit;
}
