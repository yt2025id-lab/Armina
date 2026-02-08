const hre = require("hardhat");
require("dotenv").config();

/**
 * Full redeployment with REAL Chainlink service addresses.
 *
 * Redeploys: ArminaPool (V2.5), ArminaFunctions, ArminaCCIP
 * Keeps:     ArminaYieldOptimizer, ArminaAutomation, ArminaReputation, IDRX
 *
 * Creates VRF subscription automatically.
 * Functions subscription must be created manually (TOS allowlist).
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("=== Chainlink Live Deployment ===\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH\n");

  // ============ EXISTING CONTRACTS (keep as-is) ============
  const IDRX_ADDRESS = "0xd7712a13AB95Ab7F3AfeB3eEc4125dE18D219eeD";
  const OPTIMIZER_ADDRESS = "0x1b0007d0aACDDf08F9b32eAa431D141c33891031";
  const AUTOMATION_ADDRESS = "0x2f4298770BbAa71624154d29126BB863014Dbf41";
  const REPUTATION_ADDRESS = "0x6a7ff47bA8633F252d28F9D6F080fd8cf50ddF6B";

  // ============ REAL CHAINLINK ADDRESSES (Base Sepolia) ============
  const VRF_COORDINATOR = "0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE";
  const VRF_KEY_HASH = "0xc799bd1e3bd4d1a41cd4968997a4e03dfd2a3c7c04b695881138580163f42887";
  const FUNCTIONS_ROUTER = "0xf9B8fc078197181C841c296C876945aaa425B278";
  const FUNCTIONS_DON_ID = "0x66756e2d626173652d7365706f6c69612d310000000000000000000000000000";
  const CCIP_ROUTER = "0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93";
  const ETH_SEPOLIA_SELECTOR = "16015286601757825753";

  // ============ STEP 1: Create VRF Subscription ============
  console.log("1/6 Creating VRF Subscription...");
  const vrfCoordinator = await hre.ethers.getContractAt(
    [
      "function createSubscription() external returns (uint256 subId)",
      "function addConsumer(uint256 subId, address consumer) external",
    ],
    VRF_COORDINATOR
  );

  const createTx = await vrfCoordinator.createSubscription();
  const receipt = await createTx.wait();

  let vrfSubId = 0n;
  for (const log of receipt.logs) {
    if (log.topics.length >= 2) {
      vrfSubId = BigInt(log.topics[1]);
      break;
    }
  }
  console.log("  VRF Sub ID:", vrfSubId.toString());
  await sleep(3000);

  // ============ STEP 2: Deploy ArminaPool (V2.5) ============
  console.log("\n2/6 Deploying ArminaPool (VRF V2.5)...");
  const ArminaPool = await hre.ethers.getContractFactory("ArminaPool");
  const pool = await ArminaPool.deploy(
    IDRX_ADDRESS,
    VRF_COORDINATOR,
    vrfSubId,
    VRF_KEY_HASH
  );
  await pool.waitForDeployment();
  const poolAddr = await pool.getAddress();
  console.log("  ArminaPool:", poolAddr);
  await sleep(3000);

  // Add pool as VRF consumer
  const addVrfTx = await vrfCoordinator.addConsumer(vrfSubId, poolAddr);
  await addVrfTx.wait();
  console.log("  Pool added as VRF consumer");
  await sleep(3000);

  // ============ STEP 3: Deploy ArminaFunctions (real router) ============
  console.log("\n3/6 Deploying ArminaFunctions (real Functions Router)...");
  // Deploy with sub ID 0 — user will create subscription via UI and update later
  const Functions = await hre.ethers.getContractFactory("ArminaFunctions");
  const functions = await Functions.deploy(FUNCTIONS_ROUTER, 0, FUNCTIONS_DON_ID);
  await functions.waitForDeployment();
  const functionsAddr = await functions.getAddress();
  console.log("  ArminaFunctions:", functionsAddr);
  await sleep(3000);

  // ============ STEP 4: Deploy ArminaCCIP (real router) ============
  console.log("\n4/6 Deploying ArminaCCIP (real CCIP Router)...");
  const ArminaCCIP = await hre.ethers.getContractFactory("ArminaCCIP");
  const ccip = await ArminaCCIP.deploy(CCIP_ROUTER, poolAddr, IDRX_ADDRESS);
  await ccip.waitForDeployment();
  const ccipAddr = await ccip.getAddress();
  console.log("  ArminaCCIP:", ccipAddr);
  await sleep(3000);

  // ============ STEP 5: Link all contracts ============
  console.log("\n5/6 Linking contracts...");

  const optimizer = await hre.ethers.getContractAt("ArminaYieldOptimizer", OPTIMIZER_ADDRESS);
  const automation = await hre.ethers.getContractAt("ArminaAutomation", AUTOMATION_ADDRESS);
  let tx;

  // Pool -> YieldOptimizer
  tx = await pool.setYieldOptimizer(OPTIMIZER_ADDRESS);
  await tx.wait();
  console.log("  Pool -> YieldOptimizer");
  await sleep(3000);

  // Pool -> Automation
  tx = await pool.setAutomationContract(AUTOMATION_ADDRESS);
  await tx.wait();
  console.log("  Pool -> Automation");
  await sleep(3000);

  // Pool -> CCIP
  tx = await pool.setCCIPContract(ccipAddr);
  await tx.wait();
  console.log("  Pool -> CCIP");
  await sleep(3000);

  // Pool -> Reputation
  tx = await pool.setReputationContract(REPUTATION_ADDRESS);
  await tx.wait();
  console.log("  Pool -> Reputation");
  await sleep(3000);

  // Optimizer -> Pool authorized
  tx = await optimizer.authorizePool(poolAddr);
  await tx.wait();
  console.log("  Optimizer -> Pool authorized");
  await sleep(3000);

  // Optimizer -> Functions
  tx = await optimizer.setFunctionsContract(functionsAddr);
  await tx.wait();
  console.log("  Optimizer -> Functions");
  await sleep(3000);

  // Functions -> YieldOptimizer
  tx = await functions.setYieldOptimizer(OPTIMIZER_ADDRESS);
  await tx.wait();
  console.log("  Functions -> Optimizer");
  await sleep(3000);

  // Functions -> Pool (auto-rebalance)
  tx = await functions.setArminaPool(poolAddr);
  await tx.wait();
  console.log("  Functions -> Pool");
  await sleep(3000);

  // Automation -> new Pool
  tx = await automation.setPool(poolAddr);
  await tx.wait();
  console.log("  Automation -> Pool (new)");
  await sleep(3000);

  // Automation -> new Functions
  tx = await automation.setFunctions(functionsAddr);
  await tx.wait();
  console.log("  Automation -> Functions (new)");
  await sleep(3000);

  // Reputation -> Pool authorized
  try {
    const reputation = await hre.ethers.getContractAt("ArminaReputation", REPUTATION_ADDRESS);
    tx = await reputation.authorizePool(poolAddr);
    await tx.wait();
    console.log("  Reputation -> Pool authorized");
  } catch (e) {
    console.log("  Reputation -> Pool skipped");
  }
  await sleep(3000);

  // CCIP -> Allow Ethereum Sepolia
  tx = await ccip.allowSourceChain(ETH_SEPOLIA_SELECTOR, true);
  await tx.wait();
  console.log("  CCIP -> Eth Sepolia allowed");

  // ============ STEP 6: Summary ============
  console.log("\n\n=== Deployment Complete ===\n");
  console.log("Deployed Contracts:");
  console.log(`  ArminaPool:            ${poolAddr}`);
  console.log(`  ArminaFunctions:       ${functionsAddr}`);
  console.log(`  ArminaCCIP:            ${ccipAddr}`);
  console.log("");
  console.log("Existing Contracts:");
  console.log(`  IDRX:                  ${IDRX_ADDRESS}`);
  console.log(`  ArminaYieldOptimizer:  ${OPTIMIZER_ADDRESS}`);
  console.log(`  ArminaAutomation:      ${AUTOMATION_ADDRESS}`);
  console.log(`  ArminaReputation:      ${REPUTATION_ADDRESS}`);
  console.log("");
  console.log("Chainlink Services:");
  console.log(`  VRF Coordinator:       ${VRF_COORDINATOR}`);
  console.log(`  VRF Sub ID:            ${vrfSubId}`);
  console.log(`  Functions Router:      ${FUNCTIONS_ROUTER}`);
  console.log(`  CCIP Router:           ${CCIP_ROUTER}`);
  console.log("");
  console.log("Update .env:");
  console.log(`  VRF_SUBSCRIPTION_ID=${vrfSubId}`);
  console.log(`  ARMINA_POOL_ADDRESS=${poolAddr}`);
  console.log(`  NEXT_PUBLIC_ARMINA_POOL_ADDRESS=${poolAddr}`);
  console.log(`  NEXT_PUBLIC_FUNCTIONS_ADDRESS=${functionsAddr}`);
  console.log(`  NEXT_PUBLIC_CCIP_ADDRESS=${ccipAddr}`);
  console.log("");
  console.log("=== MANUAL STEPS ===");
  console.log("1. Get LINK tokens: https://faucets.chain.link/base-sepolia");
  console.log(`2. Fund VRF sub: https://vrf.chain.link/base-sepolia`);
  console.log("3. Create Functions sub: https://functions.chain.link/base-sepolia");
  console.log(`   Then: npx hardhat console --network baseSepolia`);
  console.log(`   > const fn = await ethers.getContractAt("ArminaFunctions", "${functionsAddr}")`);
  console.log(`   > await fn.setSubscriptionId(YOUR_SUB_ID)`);
  console.log(`4. Register Automation: https://automation.chain.link/base-sepolia/new`);
  console.log(`   Contract: ${AUTOMATION_ADDRESS}, Gas limit: 500000`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
