import { ethers } from "hardhat";

/**
 * VRF Setup Script for ArminaPool
 *
 * Steps to configure Chainlink VRF on Base Sepolia:
 *
 * 1. Go to https://vrf.chain.link/ and connect wallet
 * 2. Create a new subscription on Base Sepolia
 * 3. Fund the subscription with LINK tokens
 *    - Get LINK from faucet: https://faucets.chain.link/base-sepolia
 * 4. Add ArminaPool contract as consumer
 * 5. Run this script with the subscription ID
 *
 * Usage:
 *   SUBSCRIPTION_ID=123 npx hardhat run scripts/setup-vrf.ts --network baseSepolia
 */

async function main() {
  const ARMINA_POOL_ADDRESS = process.env.NEXT_PUBLIC_ARMINA_POOL_ADDRESS;
  const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID;

  if (!ARMINA_POOL_ADDRESS) {
    console.error("Error: NEXT_PUBLIC_ARMINA_POOL_ADDRESS not set in .env");
    process.exit(1);
  }

  if (!SUBSCRIPTION_ID) {
    console.error("Error: SUBSCRIPTION_ID not set. Usage: SUBSCRIPTION_ID=123 npx hardhat run scripts/setup-vrf.ts --network baseSepolia");
    process.exit(1);
  }

  console.log("=== ArminaPool VRF Configuration ===\n");
  console.log("Contract:", ARMINA_POOL_ADDRESS);
  console.log("Subscription ID:", SUBSCRIPTION_ID);

  // Base Sepolia VRF Configuration
  const VRF_CONFIG = {
    coordinator: "0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE",
    keyHash: "0xc799bd1e3bd4d1a41cd4968997a4e03dfd2a3c7c04b695881138580163f42887",
    callbackGasLimit: 100000,
    requestConfirmations: 3,
  };

  console.log("\nVRF Coordinator:", VRF_CONFIG.coordinator);
  console.log("Key Hash:", VRF_CONFIG.keyHash);
  console.log("Callback Gas Limit:", VRF_CONFIG.callbackGasLimit);
  console.log("Request Confirmations:", VRF_CONFIG.requestConfirmations);

  console.log("\n--- Checklist ---");
  console.log("[ ] 1. Create VRF Subscription at https://vrf.chain.link/");
  console.log("[ ] 2. Fund subscription with LINK tokens (min 2 LINK)");
  console.log(`[ ] 3. Add consumer: ${ARMINA_POOL_ADDRESS}`);
  console.log(`[ ] 4. Note your Subscription ID: ${SUBSCRIPTION_ID}`);
  console.log("[ ] 5. Update .env with SUBSCRIPTION_ID");

  console.log("\n--- Contract currently deployed with ---");
  console.log("VRF Coordinator:", VRF_CONFIG.coordinator);
  console.log("Subscription ID: 0 (needs update via redeployment or setter)");

  console.log("\n=== To update subscription ID ===");
  console.log("The current ArminaPool contract has subscriptionId as a state variable.");
  console.log("If there's no setter function, you'll need to redeploy with the correct ID.");
  console.log("\nRedeploy command:");
  console.log(`  npx hardhat run scripts/deploy.ts --network baseSepolia`);
  console.log(`  (Update scripts/deploy.ts with SUBSCRIPTION_ID=${SUBSCRIPTION_ID})`);

  console.log("\n=== Done ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
