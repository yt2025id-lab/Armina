const hre = require("hardhat");
require("dotenv").config();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Redeploy ArminaPool with the latest contract code (includes Chainlink Data Feeds, Automation, CCIP).
 * Links to existing IDRX, YieldOptimizer, and Reputation contracts.
 */
async function main() {
  const ethers = hre.ethers;
  const [deployer] = await ethers.getSigners();
  console.log("=== Redeploy ArminaPool (Full Chainlink Version) ===\n");
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  // Existing contracts to link with
  const IDRX_ADDRESS = "0x7F197979D4046b2264De80D11359B6Cb5d1a8611";
  const YIELD_OPTIMIZER = "0xA29B86204f0Dd052922C6417bceECd7554e5BC9a";
  const REPUTATION = "0xb4D23587F855C54E558d1a3d630Be53bdAEe16de";

  // Chainlink VRF config
  const VRF_COORDINATOR = "0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE";
  const VRF_KEY_HASH = "0xc799bd1e3bd4d1a41cd4968997a4e03dfd2a3c7c04b695881138580163f42887";
  const VRF_SUBSCRIPTION_ID = process.env.VRF_SUBSCRIPTION_ID || "0";

  console.log("Config:");
  console.log("  IDRX:", IDRX_ADDRESS);
  console.log("  YieldOptimizer:", YIELD_OPTIMIZER);
  console.log("  Reputation:", REPUTATION);
  console.log("  VRF Coordinator:", VRF_COORDINATOR);
  console.log("  VRF Sub ID:", VRF_SUBSCRIPTION_ID);
  console.log("");

  // Step 1: Deploy new ArminaPool
  console.log("1/5 Deploying new ArminaPool...");
  const ArminaPool = await ethers.getContractFactory("ArminaPool");
  const pool = await ArminaPool.deploy(
    IDRX_ADDRESS,
    VRF_COORDINATOR,
    VRF_SUBSCRIPTION_ID,
    VRF_KEY_HASH
  );
  await pool.waitForDeployment();
  const poolAddr = await pool.getAddress();
  console.log("  New ArminaPool:", poolAddr);

  // Wait for a few blocks
  console.log("  Waiting 5s for confirmation...");
  await sleep(5000);

  // Verify the pool was deployed correctly
  console.log("  Verifying deployment...");
  const ownerCheck = await pool.owner();
  console.log("  owner():", ownerCheck);
  const idrxCheck = await pool.idrxToken();
  console.log("  idrxToken():", idrxCheck);

  // Step 2: Link YieldOptimizer — use explicit sendTransaction
  console.log("\n2/5 Linking YieldOptimizer...");
  try {
    const tx = await pool.setYieldOptimizer(YIELD_OPTIMIZER);
    console.log("  TX hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("  TX status:", receipt.status, receipt.status === 1 ? "✅" : "❌");
  } catch (e: any) {
    console.log("  setYieldOptimizer failed. Trying raw transaction...");
    // Try with raw encoded call
    const iface = new ethers.Interface(["function setYieldOptimizer(address _optimizer)"]);
    const calldata = iface.encodeFunctionData("setYieldOptimizer", [YIELD_OPTIMIZER]);
    console.log("  Calldata:", calldata);
    try {
      const tx = await deployer.sendTransaction({
        to: poolAddr,
        data: calldata,
      });
      console.log("  Raw TX hash:", tx.hash);
      const receipt = await tx.wait();
      console.log("  Raw TX status:", receipt.status, receipt.status === 1 ? "✅" : "❌");
    } catch (e2: any) {
      console.log("  Raw TX also failed:", (e2.message || "").substring(0, 150));

      // Check if setYieldOptimizer exists by checking the contract ABI
      console.log("\n  Debugging: checking contract functions...");
      const code = await ethers.provider.getCode(poolAddr);
      console.log("  Bytecode length:", code.length);

      // Try simple view calls
      const testAbi = [
        "function owner() view returns (address)",
        "function setYieldOptimizer(address) external",
        "function yieldOptimizer() view returns (address)",
        "function priceFeed() view returns (address)",
        "function getDynamicCollateralMultiplier() view returns (uint256)",
      ];
      const testContract = new ethers.Contract(poolAddr, testAbi, deployer);

      try {
        const yo = await testContract.yieldOptimizer();
        console.log("  yieldOptimizer():", yo);
      } catch { console.log("  yieldOptimizer(): REVERT"); }

      try {
        const pf = await testContract.priceFeed();
        console.log("  priceFeed():", pf);
      } catch { console.log("  priceFeed(): REVERT"); }

      try {
        const m = await testContract.getDynamicCollateralMultiplier();
        console.log("  getDynamicCollateralMultiplier():", m.toString());
      } catch { console.log("  getDynamicCollateralMultiplier(): REVERT"); }
    }
  }

  await sleep(3000);

  // Step 3: Authorize new pool on YieldOptimizer
  console.log("\n3/5 Authorizing pool on YieldOptimizer...");
  const optimizerAbi = [
    "function authorizePool(address pool) external",
    "function authorizedPools(address pool) view returns (bool)",
    "function owner() view returns (address)",
  ];
  const optimizer = new ethers.Contract(YIELD_OPTIMIZER, optimizerAbi, deployer);
  try {
    const optOwner = await optimizer.owner();
    console.log("  Optimizer owner:", optOwner);
    const tx = await optimizer.authorizePool(poolAddr);
    console.log("  TX hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("  Status:", receipt.status === 1 ? "✅" : "❌");
  } catch (e: any) {
    console.log("  ❌ Failed:", (e.message || "").substring(0, 120));
  }

  // Step 4: Link Reputation
  console.log("\n4/5 Linking Reputation...");
  try {
    const tx = await pool.setReputationContract(REPUTATION);
    console.log("  TX hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("  Status:", receipt.status === 1 ? "✅" : "❌");
  } catch (e: any) {
    console.log("  ❌ Failed:", (e.message || "").substring(0, 120));
  }

  // Authorize pool on Reputation
  const repAbi = [
    "function authorizePool(address pool) external",
    "function owner() view returns (address)",
  ];
  const reputation = new ethers.Contract(REPUTATION, repAbi, deployer);
  try {
    const tx = await reputation.authorizePool(poolAddr);
    console.log("  Reputation -> Pool authorized ✅");
    await tx.wait();
  } catch (e: any) {
    console.log("  Reputation auth:", (e.message || "").substring(0, 80));
  }

  // Step 5: Final verification
  console.log("\n5/5 Final verification...");
  const checks = [
    "owner", "idrxToken", "poolCounter", "yieldOptimizer",
    "reputationContract", "priceFeed", "getDynamicCollateralMultiplier", "PENALTY_RATE"
  ];
  for (const fn of checks) {
    try {
      const val = await pool[fn]();
      console.log(`  ${fn}(): ${val}`);
    } catch (e: any) {
      console.log(`  ${fn}(): ❌ REVERT`);
    }
  }

  console.log("\n=== Deployment Complete ===");
  console.log("\nNew ArminaPool address:", poolAddr);
  console.log("\nUpdate .env.local:");
  console.log(`  NEXT_PUBLIC_ARMINA_POOL_ADDRESS=${poolAddr}`);
  console.log("\nVerify on BaseScan:");
  console.log(`  npx hardhat verify --network baseSepolia ${poolAddr} "${IDRX_ADDRESS}" "${VRF_COORDINATOR}" "${VRF_SUBSCRIPTION_ID}" "${VRF_KEY_HASH}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
