const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

/**
 * Deploy Chainlink CRE upgrade:
 * 1. Redeploy ArminaPool (with Automation + Data Feed support)
 * 2. Redeploy ArminaYieldOptimizer (with Functions caller support)
 * 3. Deploy ArminaAutomation (Chainlink Automation)
 * 4. Deploy ArminaFunctions (Chainlink Functions)
 * 5. Link all contracts together
 */
async function main() {
  console.log("=== Armina Chainlink CRE Deployment ===\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Configuration
  const IDRX_ADDRESS = process.env.IDRX_TOKEN_ADDRESS || "";
  const VRF_COORDINATOR = process.env.VRF_COORDINATOR_SEPOLIA || "";
  const VRF_SUBSCRIPTION_ID = process.env.VRF_SUBSCRIPTION_ID || "0";
  const VRF_KEY_HASH = process.env.VRF_KEY_HASH_SEPOLIA || "";
  const REPUTATION_ADDRESS = process.env.NEXT_PUBLIC_REPUTATION_ADDRESS || "";

  if (!IDRX_ADDRESS) {
    console.error("IDRX_TOKEN_ADDRESS not set in .env");
    process.exit(1);
  }

  console.log("IDRX:", IDRX_ADDRESS);
  console.log("VRF Coordinator:", VRF_COORDINATOR);
  console.log("Reputation:", REPUTATION_ADDRESS || "(not set)");
  console.log("");

  // 1. Deploy ArminaYieldOptimizer (updated with functionsContract)
  console.log("1/5 Deploying ArminaYieldOptimizer...");
  const Optimizer = await hre.ethers.getContractFactory("ArminaYieldOptimizer");
  const optimizer = await Optimizer.deploy(IDRX_ADDRESS);
  await optimizer.waitForDeployment();
  const optimizerAddr = await optimizer.getAddress();
  console.log("  ArminaYieldOptimizer:", optimizerAddr);

  // 2. Deploy ArminaPool (updated with automation + data feed)
  console.log("\n2/5 Deploying ArminaPool...");
  const ArminaPool = await hre.ethers.getContractFactory("ArminaPool");
  const pool = await ArminaPool.deploy(
    IDRX_ADDRESS,
    VRF_COORDINATOR,
    VRF_SUBSCRIPTION_ID,
    VRF_KEY_HASH
  );
  await pool.waitForDeployment();
  const poolAddr = await pool.getAddress();
  console.log("  ArminaPool:", poolAddr);

  // 3. Deploy ArminaAutomation
  console.log("\n3/5 Deploying ArminaAutomation...");
  const AUTOMATION_INTERVAL = 30 * 24 * 3600; // 30 days
  const Automation = await hre.ethers.getContractFactory("ArminaAutomation");
  const automation = await Automation.deploy(poolAddr, optimizerAddr, AUTOMATION_INTERVAL);
  await automation.waitForDeployment();
  const automationAddr = await automation.getAddress();
  console.log("  ArminaAutomation:", automationAddr);

  // 4. Deploy ArminaFunctions (using placeholder router - will need real one for live)
  console.log("\n4/5 Deploying ArminaFunctions...");
  const FUNCTIONS_ROUTER = process.env.FUNCTIONS_ROUTER || deployer.address; // Use deployer as placeholder
  const FUNCTIONS_SUB_ID = process.env.FUNCTIONS_SUBSCRIPTION_ID || "0";
  const FUNCTIONS_DON_ID = process.env.FUNCTIONS_DON_ID || "0x0000000000000000000000000000000000000000000000000000000000000000";

  let functionsAddr = "";
  try {
    const Functions = await hre.ethers.getContractFactory("ArminaFunctions");
    const functions = await Functions.deploy(FUNCTIONS_ROUTER, FUNCTIONS_SUB_ID, FUNCTIONS_DON_ID);
    await functions.waitForDeployment();
    functionsAddr = await functions.getAddress();
    console.log("  ArminaFunctions:", functionsAddr);
  } catch (e: any) {
    console.log("  ArminaFunctions: skipped (Functions router not configured)");
    console.log("  Error:", e.message?.substring(0, 100));
  }

  // 5. Link contracts
  console.log("\n5/5 Linking contracts...");

  // Pool -> YieldOptimizer
  let tx = await pool.setYieldOptimizer(optimizerAddr);
  await tx.wait();
  console.log("  Pool -> YieldOptimizer linked");

  // Pool -> Automation
  tx = await pool.setAutomationContract(automationAddr);
  await tx.wait();
  console.log("  Pool -> Automation linked");

  // Optimizer -> Pool authorized
  tx = await optimizer.authorizePool(poolAddr);
  await tx.wait();
  console.log("  Optimizer -> Pool authorized");

  // Optimizer -> Functions authorized
  if (functionsAddr) {
    tx = await optimizer.setFunctionsContract(functionsAddr);
    await tx.wait();
    console.log("  Optimizer -> Functions linked");
  }

  // Pool -> Reputation
  if (REPUTATION_ADDRESS) {
    tx = await pool.setReputationContract(REPUTATION_ADDRESS);
    await tx.wait();
    console.log("  Pool -> Reputation linked");

    // Authorize pool on reputation
    try {
      const reputation = await hre.ethers.getContractAt("ArminaReputation", REPUTATION_ADDRESS);
      tx = await reputation.authorizePool(poolAddr);
      await tx.wait();
      console.log("  Reputation -> Pool authorized");
    } catch (e) {
      console.log("  Reputation -> Pool authorization skipped");
    }
  }

  // Summary
  console.log("\n=== Deployment Complete ===");
  console.log("\nContract Addresses:");
  console.log(`  IDRX Token:            ${IDRX_ADDRESS}`);
  console.log(`  ArminaPool:            ${poolAddr}`);
  console.log(`  ArminaYieldOptimizer:  ${optimizerAddr}`);
  console.log(`  ArminaAutomation:      ${automationAddr}`);
  console.log(`  ArminaFunctions:       ${functionsAddr || "not deployed"}`);
  console.log(`  ArminaReputation:      ${REPUTATION_ADDRESS || "not set"}`);

  console.log("\nUpdate .env:");
  console.log(`  ARMINA_POOL_ADDRESS=${poolAddr}`);
  console.log(`  YIELD_OPTIMIZER_ADDRESS=${optimizerAddr}`);
  console.log(`  NEXT_PUBLIC_ARMINA_POOL_ADDRESS=${poolAddr}`);
  console.log(`  NEXT_PUBLIC_YIELD_OPTIMIZER_ADDRESS=${optimizerAddr}`);
  console.log(`  NEXT_PUBLIC_AUTOMATION_ADDRESS=${automationAddr}`);
  if (functionsAddr) console.log(`  NEXT_PUBLIC_FUNCTIONS_ADDRESS=${functionsAddr}`);

  console.log("\nVerify contracts:");
  console.log(`  npx hardhat verify --network baseSepolia ${optimizerAddr} "${IDRX_ADDRESS}"`);
  console.log(`  npx hardhat verify --network baseSepolia ${poolAddr} "${IDRX_ADDRESS}" "${VRF_COORDINATOR}" "${VRF_SUBSCRIPTION_ID}" "${VRF_KEY_HASH}"`);
  console.log(`  npx hardhat verify --network baseSepolia ${automationAddr} "${poolAddr}" "${optimizerAddr}" "${AUTOMATION_INTERVAL}"`);

  // Save deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentInfo = {
    network: (await hre.ethers.provider.getNetwork()).name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      idrxToken: IDRX_ADDRESS,
      arminaPool: poolAddr,
      arminaYieldOptimizer: optimizerAddr,
      arminaAutomation: automationAddr,
      arminaFunctions: functionsAddr || "not deployed",
      arminaReputation: REPUTATION_ADDRESS || "not set",
    },
    chainlink: {
      vrfCoordinator: VRF_COORDINATOR,
      vrfSubscriptionId: VRF_SUBSCRIPTION_ID,
      automationInterval: AUTOMATION_INTERVAL,
    },
  };

  const filename = `chainlink-deployment-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`\nSaved to: deployments/${filename}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
