const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Linking with account:", deployer.address);

  const POOL = "0xD978524c46903E68F0C8CD171422Ae1658555975";
  const OPTIMIZER = "0x466E3662c5de88bd93300491187caDF8949ee61c";
  const REPUTATION = "0x6a7ff47bA8633F252d28F9D6F080fd8cf50ddF6B";

  // 1. Authorize pool on optimizer
  console.log("1. Authorizing pool on optimizer...");
  const optimizer = await hre.ethers.getContractAt("ArminaYieldOptimizer", OPTIMIZER);
  let tx = await optimizer.authorizePool(POOL);
  await tx.wait();
  console.log("   Done");

  // 2. Set reputation on pool
  console.log("2. Setting reputation on pool...");
  const pool = await hre.ethers.getContractAt("ArminaPool", POOL);
  tx = await pool.setReputationContract(REPUTATION);
  await tx.wait();
  console.log("   Done");

  // 3. Authorize pool on reputation
  console.log("3. Authorizing pool on reputation...");
  const reputation = await hre.ethers.getContractAt("ArminaReputation", REPUTATION);
  tx = await reputation.authorizePool(POOL);
  await tx.wait();
  console.log("   Done");

  // Verify
  console.log("\nVerification:");
  console.log("  optimizer.authorizedPools(pool):", await optimizer.authorizedPools(POOL));
  console.log("  pool.reputationContract():", await pool.reputationContract());
  console.log("  pool.yieldOptimizer():", await pool.yieldOptimizer());
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
