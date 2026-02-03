const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

/**
 * Deploy all Armina contracts: ArminaPool + ArminaYieldOptimizer
 * Links them together and sets up permissions
 */
async function main() {
  console.log("=== Armina Full Deployment ===\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Configuration
  const IDRX_TOKEN_ADDRESS = process.env.IDRX_TOKEN_ADDRESS || "";
  const VRF_COORDINATOR = process.env.VRF_COORDINATOR_SEPOLIA || "";
  const VRF_SUBSCRIPTION_ID = process.env.VRF_SUBSCRIPTION_ID || "0";
  const VRF_KEY_HASH = process.env.VRF_KEY_HASH_SEPOLIA || "";
  const REPUTATION_ADDRESS = process.env.NEXT_PUBLIC_REPUTATION_ADDRESS || "";

  if (!IDRX_TOKEN_ADDRESS) {
    console.error("IDRX_TOKEN_ADDRESS not set in .env");
    process.exit(1);
  }

  if (!VRF_COORDINATOR || !VRF_KEY_HASH) {
    console.error("Chainlink VRF configuration missing in .env");
    process.exit(1);
  }

  console.log("IDRX Token:", IDRX_TOKEN_ADDRESS);
  console.log("VRF Coordinator:", VRF_COORDINATOR);
  console.log("VRF Subscription ID:", VRF_SUBSCRIPTION_ID);
  console.log("VRF Key Hash:", VRF_KEY_HASH);
  console.log("Reputation:", REPUTATION_ADDRESS || "(not set)");
  console.log("");

  // 1. Deploy ArminaYieldOptimizer
  console.log("1/4 Deploying ArminaYieldOptimizer...");
  const Optimizer = await hre.ethers.getContractFactory("ArminaYieldOptimizer");
  const optimizer = await Optimizer.deploy(IDRX_TOKEN_ADDRESS);
  await optimizer.waitForDeployment();
  const optimizerAddr = await optimizer.getAddress();
  console.log("  ArminaYieldOptimizer:", optimizerAddr);

  // 2. Deploy ArminaPool
  console.log("\n2/4 Deploying ArminaPool...");
  const ArminaPool = await hre.ethers.getContractFactory("ArminaPool");
  const pool = await ArminaPool.deploy(
    IDRX_TOKEN_ADDRESS,
    VRF_COORDINATOR,
    VRF_SUBSCRIPTION_ID,
    VRF_KEY_HASH
  );
  await pool.waitForDeployment();
  const poolAddr = await pool.getAddress();
  console.log("  ArminaPool:", poolAddr);

  // 3. Link contracts
  console.log("\n3/4 Linking contracts...");

  // Set yield optimizer on pool
  let tx = await pool.setYieldOptimizer(optimizerAddr);
  await tx.wait();
  console.log("  Pool -> YieldOptimizer linked");

  // Authorize pool on optimizer
  tx = await optimizer.authorizePool(poolAddr);
  await tx.wait();
  console.log("  Optimizer -> Pool authorized");

  // Set reputation if available
  if (REPUTATION_ADDRESS) {
    tx = await pool.setReputationContract(REPUTATION_ADDRESS);
    await tx.wait();
    console.log("  Pool -> Reputation linked");
  }

  // 4. Verify setup
  console.log("\n4/4 Verifying setup...");
  const yoAddr = await pool.yieldOptimizer();
  console.log("  pool.yieldOptimizer():", yoAddr, yoAddr === optimizerAddr ? "OK" : "MISMATCH");

  const isAuthorized = await optimizer.authorizedPools(poolAddr);
  console.log("  optimizer.authorizedPools(pool):", isAuthorized ? "OK" : "FAIL");

  if (REPUTATION_ADDRESS) {
    const repAddr = await pool.reputationContract();
    console.log("  pool.reputationContract():", repAddr, repAddr === REPUTATION_ADDRESS ? "OK" : "MISMATCH");
  }

  // Save deployment info
  const network = await hre.ethers.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      arminaPool: poolAddr,
      arminaYieldOptimizer: optimizerAddr,
      idrxToken: IDRX_TOKEN_ADDRESS,
      reputation: REPUTATION_ADDRESS || "not set",
      vrfCoordinator: VRF_COORDINATOR,
    },
    configuration: {
      vrfSubscriptionId: VRF_SUBSCRIPTION_ID,
      vrfKeyHash: VRF_KEY_HASH,
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `full-deployment-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n=== Deployment Complete ===");
  console.log(`Saved to: deployments/${filename}`);
  console.log("\nUpdate .env:");
  console.log(`  ARMINA_POOL_ADDRESS=${poolAddr}`);
  console.log(`  NEXT_PUBLIC_ARMINA_POOL_ADDRESS=${poolAddr}`);
  console.log(`  NEXT_PUBLIC_YIELD_OPTIMIZER_ADDRESS=${optimizerAddr}`);
  console.log("\nVerify contracts:");
  console.log(`  npx hardhat verify --network baseSepolia ${optimizerAddr} "${IDRX_TOKEN_ADDRESS}"`);
  console.log(`  npx hardhat verify --network baseSepolia ${poolAddr} "${IDRX_TOKEN_ADDRESS}" "${VRF_COORDINATOR}" "${VRF_SUBSCRIPTION_ID}" "${VRF_KEY_HASH}"`);
  console.log("\nAdd VRF consumer:");
  console.log(`  Go to https://vrf.chain.link/base-sepolia`);
  console.log(`  Add consumer: ${poolAddr}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
