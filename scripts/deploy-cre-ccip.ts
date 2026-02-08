const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

/**
 * Deploy CRE + CCIP upgrade:
 * 1. ArminaYieldOptimizer (with Functions caller)
 * 2. ArminaPool (with dynamic collateral, CCIP, automation)
 * 3. ArminaAutomation (with Functions trigger)
 * 4. ArminaFunctions (with auto-rebalance)
 * 5. ArminaCCIP (cross-chain receiver)
 * 6. Link all contracts
 */
async function main() {
  console.log("=== Armina CRE + CCIP Deployment ===\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Configuration
  const IDRX_ADDRESS = process.env.IDRX_TOKEN_ADDRESS || process.env.NEXT_PUBLIC_IDRX_ADDRESS || "";
  const VRF_COORDINATOR = process.env.VRF_COORDINATOR_SEPOLIA || "";
  const VRF_SUBSCRIPTION_ID = process.env.VRF_SUBSCRIPTION_ID || "0";
  const VRF_KEY_HASH = process.env.VRF_KEY_HASH_SEPOLIA || "";
  const REPUTATION_ADDRESS = process.env.NEXT_PUBLIC_REPUTATION_ADDRESS || "";
  // CCIP Router on Base Sepolia
  const CCIP_ROUTER = process.env.CCIP_ROUTER_BASE_SEPOLIA || deployer.address;
  // Ethereum Sepolia chain selector
  const ETH_SEPOLIA_SELECTOR = "16015286601757825753";

  if (!IDRX_ADDRESS) {
    console.error("IDRX address not set in .env");
    process.exit(1);
  }

  console.log("IDRX:", IDRX_ADDRESS);
  console.log("VRF Coordinator:", VRF_COORDINATOR);
  console.log("CCIP Router:", CCIP_ROUTER);
  console.log("Reputation:", REPUTATION_ADDRESS || "(not set)");
  console.log("");

  // 1. Deploy ArminaYieldOptimizer
  console.log("1/6 Deploying ArminaYieldOptimizer...");
  const Optimizer = await hre.ethers.getContractFactory("ArminaYieldOptimizer");
  const optimizer = await Optimizer.deploy(IDRX_ADDRESS);
  await optimizer.waitForDeployment();
  const optimizerAddr = await optimizer.getAddress();
  console.log("  ArminaYieldOptimizer:", optimizerAddr);

  // 2. Deploy ArminaPool
  console.log("\n2/6 Deploying ArminaPool...");
  const ArminaPool = await hre.ethers.getContractFactory("ArminaPool");
  const pool = await ArminaPool.deploy(IDRX_ADDRESS, VRF_COORDINATOR, VRF_SUBSCRIPTION_ID, VRF_KEY_HASH);
  await pool.waitForDeployment();
  const poolAddr = await pool.getAddress();
  console.log("  ArminaPool:", poolAddr);

  // 3. Deploy ArminaAutomation
  console.log("\n3/6 Deploying ArminaAutomation...");
  const AUTOMATION_INTERVAL = 30 * 24 * 3600; // 30 days
  const Automation = await hre.ethers.getContractFactory("ArminaAutomation");
  const automation = await Automation.deploy(poolAddr, optimizerAddr, AUTOMATION_INTERVAL);
  await automation.waitForDeployment();
  const automationAddr = await automation.getAddress();
  console.log("  ArminaAutomation:", automationAddr);

  // 4. Deploy ArminaFunctions
  console.log("\n4/6 Deploying ArminaFunctions...");
  const FUNCTIONS_ROUTER = process.env.FUNCTIONS_ROUTER || deployer.address;
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

  // 5. Deploy ArminaCCIP
  console.log("\n5/6 Deploying ArminaCCIP...");
  const ArminaCCIP = await hre.ethers.getContractFactory("ArminaCCIP");
  const ccip = await ArminaCCIP.deploy(CCIP_ROUTER, poolAddr, IDRX_ADDRESS);
  await ccip.waitForDeployment();
  const ccipAddr = await ccip.getAddress();
  console.log("  ArminaCCIP:", ccipAddr);

  // 6. Link all contracts
  console.log("\n6/6 Linking contracts...");

  let tx;

  // Pool -> YieldOptimizer
  tx = await pool.setYieldOptimizer(optimizerAddr);
  await tx.wait();
  console.log("  Pool -> YieldOptimizer linked");

  // Pool -> Automation
  tx = await pool.setAutomationContract(automationAddr);
  await tx.wait();
  console.log("  Pool -> Automation linked");

  // Pool -> CCIP
  tx = await pool.setCCIPContract(ccipAddr);
  await tx.wait();
  console.log("  Pool -> CCIP linked");

  // Optimizer -> Pool authorized
  tx = await optimizer.authorizePool(poolAddr);
  await tx.wait();
  console.log("  Optimizer -> Pool authorized");

  // Optimizer -> Functions caller
  if (functionsAddr) {
    tx = await optimizer.setFunctionsContract(functionsAddr);
    await tx.wait();
    console.log("  Optimizer -> Functions linked");

    // Functions -> YieldOptimizer
    const functions = await hre.ethers.getContractAt("ArminaFunctions", functionsAddr);
    tx = await functions.setYieldOptimizer(optimizerAddr);
    await tx.wait();
    console.log("  Functions -> Optimizer linked");

    // Functions -> ArminaPool (for auto-rebalance)
    tx = await functions.setArminaPool(poolAddr);
    await tx.wait();
    console.log("  Functions -> Pool linked (auto-rebalance)");

    // Automation -> Functions (CRE orchestration)
    tx = await automation.setFunctions(functionsAddr);
    await tx.wait();
    console.log("  Automation -> Functions linked (CRE cycle)");
  }

  // CCIP -> Allow Ethereum Sepolia
  tx = await ccip.allowSourceChain(ETH_SEPOLIA_SELECTOR, true);
  await tx.wait();
  console.log("  CCIP -> Ethereum Sepolia allowed");

  // Pool -> Reputation
  if (REPUTATION_ADDRESS) {
    tx = await pool.setReputationContract(REPUTATION_ADDRESS);
    await tx.wait();
    console.log("  Pool -> Reputation linked");

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
  console.log(`  ArminaCCIP:            ${ccipAddr}`);
  console.log(`  ArminaReputation:      ${REPUTATION_ADDRESS || "not set"}`);

  console.log("\nUpdate .env:");
  console.log(`  ARMINA_POOL_ADDRESS=${poolAddr}`);
  console.log(`  YIELD_OPTIMIZER_ADDRESS=${optimizerAddr}`);
  console.log(`  NEXT_PUBLIC_ARMINA_POOL_ADDRESS=${poolAddr}`);
  console.log(`  NEXT_PUBLIC_YIELD_OPTIMIZER_ADDRESS=${optimizerAddr}`);
  console.log(`  NEXT_PUBLIC_AUTOMATION_ADDRESS=${automationAddr}`);
  if (functionsAddr) console.log(`  NEXT_PUBLIC_FUNCTIONS_ADDRESS=${functionsAddr}`);
  console.log(`  NEXT_PUBLIC_CCIP_ADDRESS=${ccipAddr}`);

  console.log("\nVerify commands:");
  console.log(`  npx hardhat verify --network baseSepolia ${optimizerAddr} "${IDRX_ADDRESS}"`);
  console.log(`  npx hardhat verify --network baseSepolia ${poolAddr} "${IDRX_ADDRESS}" "${VRF_COORDINATOR}" "${VRF_SUBSCRIPTION_ID}" "${VRF_KEY_HASH}"`);
  console.log(`  npx hardhat verify --network baseSepolia ${automationAddr} "${poolAddr}" "${optimizerAddr}" "${AUTOMATION_INTERVAL}"`);
  if (functionsAddr) console.log(`  npx hardhat verify --network baseSepolia ${functionsAddr} "${FUNCTIONS_ROUTER}" "${FUNCTIONS_SUB_ID}" "${FUNCTIONS_DON_ID}"`);
  console.log(`  npx hardhat verify --network baseSepolia ${ccipAddr} "${CCIP_ROUTER}" "${poolAddr}" "${IDRX_ADDRESS}"`);

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
      arminaCCIP: ccipAddr,
      arminaReputation: REPUTATION_ADDRESS || "not set",
    },
    chainlink: {
      vrfCoordinator: VRF_COORDINATOR,
      vrfSubscriptionId: VRF_SUBSCRIPTION_ID,
      automationInterval: AUTOMATION_INTERVAL,
      ccipRouter: CCIP_ROUTER,
      ethSepoliaSelector: ETH_SEPOLIA_SELECTOR,
    },
  };

  const filename = `cre-ccip-deployment-${Date.now()}.json`;
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
