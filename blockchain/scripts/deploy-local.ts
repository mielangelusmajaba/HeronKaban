/**
 * Deploys PesoToken + HeronTreasury to the local Hardhat node and writes the addresses
 * into the app's .env.local. Run with the node already up (`npm run node`):
 *   npm run deploy:local
 *
 * A fresh node deploys from account #0 at nonce 0 and 1, so the addresses are the
 * same every time the node restarts. Account #0 is also the app's relayer
 * (RELAYER_PRIVATE_KEY), which owns the token so it can mint test pesos.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { network } from "hardhat";

const { viem } = await network.create({ network: "localhost" });
const [deployer] = await viem.getWalletClients();

const token = await viem.deployContract("PesoToken", [deployer.account.address]);
const treasury = await viem.deployContract("HeronTreasury", [token.address]);

console.log(`PesoToken     ${token.address}`);
console.log(`HeronTreasury ${treasury.address}`);

const envPath = fileURLToPath(new URL("../../.env.local", import.meta.url));
const updates: Record<string, string> = {
  NEXT_PUBLIC_TOKEN_ADDRESS: token.address,
  NEXT_PUBLIC_TREASURY_ADDRESS: treasury.address,
};
if (existsSync(envPath)) {
  let env = readFileSync(envPath, "utf8");
  for (const [k, v] of Object.entries(updates)) {
    const line = `${k}=${v}`;
    env = new RegExp(`^${k}=.*$`, "m").test(env) ? env.replace(new RegExp(`^${k}=.*$`, "m"), line) : `${env.trimEnd()}\n${line}\n`;
  }
  writeFileSync(envPath, env);
  console.log("Updated .env.local with the contract addresses. Restart `npm run dev` to pick them up.");
} else {
  console.log("No .env.local found; set these yourself:");
  for (const [k, v] of Object.entries(updates)) console.log(`${k}=${v}`);
}
