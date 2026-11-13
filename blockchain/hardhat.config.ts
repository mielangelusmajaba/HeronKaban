import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";

// Load blockchain/.env if present (Node 22 built-in). Values are read lazily
// through configVariable(), so compile/test work without any secrets set.
try {
  process.loadEnvFile(".env");
} catch {
  // no .env file: rely on real env vars or `npx hardhat keystore set <NAME>`
}

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.34",
        settings: { evmVersion: "cancun" },
      },
      production: {
        version: "0.8.34",
        settings: {
          evmVersion: "cancun",
          optimizer: { enabled: true, runs: 200 },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    // Local Hardhat node (`npm run node`): chain id 31337, pre-funded public test keys.
    // The organizers' recommendation while BSC testnet faucet funds are unavailable.
    localhost: {
      type: "http",
      chainType: "l1",
      chainId: 31337,
      url: "http://127.0.0.1:8545",
    },
    // BNB Smart Chain testnet (chain id 97). Testnet only: hackathon rule.
    bscTestnet: {
      type: "http",
      chainType: "l1",
      chainId: 97,
      url: configVariable("BSC_TESTNET_RPC_URL"),
      accounts: [configVariable("DEPLOYER_PRIVATE_KEY")],
    },
  },
  verify: {
    // Etherscan API v2 key (one key covers BscScan). Sourcify is on by default as a fallback.
    etherscan: {
      apiKey: configVariable("ETHERSCAN_API_KEY"),
    },
  },
});
