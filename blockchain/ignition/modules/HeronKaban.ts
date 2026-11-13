import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Deploys the Test Peso token (owned by the deployer, who acts as the app's relayer)
 * and the multi-org HeronTreasury. Used for BSC testnet:
 *   npm run deploy:testnet -- ignition/modules/HeronKaban.ts
 * For the local node, `npm run deploy:local` uses scripts/deploy-local.ts instead.
 */
export default buildModule("HeronKaban", (m) => {
  const deployer = m.getAccount(0);
  const token = m.contract("PesoToken", [deployer]);
  const treasury = m.contract("HeronTreasury", [token]);
  return { token, treasury };
});
