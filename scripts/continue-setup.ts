const hre = require("hardhat");

/**
 * Continue setup after ArminaPool was already deployed.
 * - Add pool as VRF consumer
 * - Deploy ArminaFunctions + ArminaCCIP
 * - Link all contracts
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("=== Continue Chainlink Setup ===\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Already deployed
  const POOL_ADDRESS = "0xB6aceB8060CC2CfA2Af0849c2f76838833ce06E3";
  const IDRX_ADDRESS = "0xd7712a13AB95Ab7F3AfeB3eEc4125dE18D219eeD";
  const OPTIMIZER_ADDRESS = "0x1b0007d0aACDDf08F9b32eAa431D141c33891031";
  const AUTOMATION_ADDRESS = "0x2f4298770BbAa71624154d29126BB863014Dbf41";
  const REPUTATION_ADDRESS = "0x6a7ff47bA8633F252d28F9D6F080fd8cf50ddF6B";

  // Chainlink addresses
  const VRF_COORDINATOR = "0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE";
  const VRF_SUB_ID = "2110460216846829773421514919442492273711957656333690255629191018031394650486";
  const FUNCTIONS_ROUTER = "0xf9B8fc078197181C841c296C876945aaa425B278";
  const FUNCTIONS_DON_ID = "0x66756e2d626173652d7365706f6c69612d310000000000000000000000000000";
  const CCIP_ROUTER = "0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93";
  const ETH_SEPOLIA_SELECTOR = "16015286601757825753";

  const pool = await hre.ethers.getContractAt("ArminaPool", POOL_ADDRESS);

  // Step 1: Add pool as VRF consumer (skip — do via vrf.chain.link UI)
  console.log("1/7 VRF addConsumer — skipped (do via UI)");

  // Step 2: Deploy ArminaFunctions
  console.log("\n2/7 Deploying ArminaFunctions...");
  const Functions = await hre.ethers.getContractFactory("ArminaFunctions");
  const functions = await Functions.deploy(FUNCTIONS_ROUTER, 0, FUNCTIONS_DON_ID);
  await functions.waitForDeployment();
  const functionsAddr = await functions.getAddress();
  console.log("  ArminaFunctions:", functionsAddr);
  await sleep(3000);

  // Step 3: Deploy ArminaCCIP
  console.log("\n3/7 Deploying ArminaCCIP...");
  const ArminaCCIP = await hre.ethers.getContractFactory("ArminaCCIP");
  const ccip = await ArminaCCIP.deploy(CCIP_ROUTER, POOL_ADDRESS, IDRX_ADDRESS);
  await ccip.waitForDeployment();
  const ccipAddr = await ccip.getAddress();
  console.log("  ArminaCCIP:", ccipAddr);
  await sleep(3000);

  // Step 4-7: Link contracts
  console.log("\n4/7 Linking Pool -> external contracts...");
  let tx;

  tx = await pool.setYieldOptimizer(OPTIMIZER_ADDRESS);
  await tx.wait();
  console.log("  Pool -> YieldOptimizer");
  await sleep(3000);

  tx = await pool.setAutomationContract(AUTOMATION_ADDRESS);
  await tx.wait();
  console.log("  Pool -> Automation");
  await sleep(3000);

  tx = await pool.setCCIPContract(ccipAddr);
  await tx.wait();
  console.log("  Pool -> CCIP");
  await sleep(3000);

  tx = await pool.setReputationContract(REPUTATION_ADDRESS);
  await tx.wait();
  console.log("  Pool -> Reputation");
  await sleep(3000);

  console.log("\n5/7 Linking Optimizer + Reputation...");
  const optimizer = await hre.ethers.getContractAt("ArminaYieldOptimizer", OPTIMIZER_ADDRESS);

  tx = await optimizer.authorizePool(POOL_ADDRESS);
  await tx.wait();
  console.log("  Optimizer -> Pool authorized");
  await sleep(3000);

  tx = await optimizer.setFunctionsContract(functionsAddr);
  await tx.wait();
  console.log("  Optimizer -> Functions");
  await sleep(3000);

  try {
    const reputation = await hre.ethers.getContractAt("ArminaReputation", REPUTATION_ADDRESS);
    tx = await reputation.authorizePool(POOL_ADDRESS);
    await tx.wait();
    console.log("  Reputation -> Pool authorized");
  } catch (e) {
    console.log("  Reputation -> Pool skipped");
  }
  await sleep(3000);

  console.log("\n6/7 Linking Functions...");
  tx = await functions.setYieldOptimizer(OPTIMIZER_ADDRESS);
  await tx.wait();
  console.log("  Functions -> Optimizer");
  await sleep(3000);

  tx = await functions.setArminaPool(POOL_ADDRESS);
  await tx.wait();
  console.log("  Functions -> Pool");
  await sleep(3000);

  console.log("\n7/7 Linking Automation + CCIP...");
  const automation = await hre.ethers.getContractAt("ArminaAutomation", AUTOMATION_ADDRESS);

  tx = await automation.setPool(POOL_ADDRESS);
  await tx.wait();
  console.log("  Automation -> Pool");
  await sleep(3000);

  tx = await automation.setFunctions(functionsAddr);
  await tx.wait();
  console.log("  Automation -> Functions");
  await sleep(3000);

  tx = await ccip.allowSourceChain(ETH_SEPOLIA_SELECTOR, true);
  await tx.wait();
  console.log("  CCIP -> Eth Sepolia allowed");

  // Summary
  console.log("\n\n=== Setup Complete ===\n");
  console.log("ArminaPool:       ", POOL_ADDRESS);
  console.log("ArminaFunctions:  ", functionsAddr);
  console.log("ArminaCCIP:       ", ccipAddr);
  console.log("VRF Sub ID:       ", VRF_SUB_ID);
  console.log("\nUpdate .env:");
  console.log(`  VRF_SUBSCRIPTION_ID=${VRF_SUB_ID}`);
  console.log(`  ARMINA_POOL_ADDRESS=${POOL_ADDRESS}`);
  console.log(`  NEXT_PUBLIC_ARMINA_POOL_ADDRESS=${POOL_ADDRESS}`);
  console.log(`  NEXT_PUBLIC_FUNCTIONS_ADDRESS=${functionsAddr}`);
  console.log(`  NEXT_PUBLIC_CCIP_ADDRESS=${ccipAddr}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
