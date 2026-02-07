const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Linking with:", deployer.address);

  const POOL = "0x68CA47998CD6Ea7F32daCf7B5e682F25cd487E80";
  const OPTIMIZER = "0x2A6A74A5be9db960eeEF4762304A5aD58aF66059";
  const AUTOMATION = "0xa1cD2242Df6312bA3E9D803c53f0d13f018fEC5D";
  const FUNCTIONS = "0x692c59D534e0EbFE3827a1469154511734219BBb";
  const REPUTATION = "0x6a7ff47bA8633F252d28F9D6F080fd8cf50ddF6B";

  // Check what's already linked
  const pool = await hre.ethers.getContractAt("ArminaPool", POOL);
  const optimizer = await hre.ethers.getContractAt("ArminaYieldOptimizer", OPTIMIZER);

  // 1. Functions -> Optimizer
  console.log("1. Setting functions contract on optimizer...");
  try {
    let tx = await optimizer.setFunctionsContract(FUNCTIONS);
    await tx.wait();
    console.log("   Done");
  } catch(e) { console.log("   Already set or error:", e.message?.substring(0, 80)); }

  // 2. Reputation on pool
  console.log("2. Setting reputation on pool...");
  try {
    let tx = await pool.setReputationContract(REPUTATION);
    await tx.wait();
    console.log("   Done");
  } catch(e) { console.log("   Error:", e.message?.substring(0, 80)); }

  // 3. Authorize pool on reputation
  console.log("3. Authorizing pool on reputation...");
  try {
    const rep = await hre.ethers.getContractAt("ArminaReputation", REPUTATION);
    let tx = await rep.authorizePool(POOL);
    await tx.wait();
    console.log("   Done");
  } catch(e) { console.log("   Error:", e.message?.substring(0, 80)); }

  // Verify
  console.log("\nVerification:");
  console.log("  pool.yieldOptimizer():", await pool.yieldOptimizer());
  console.log("  pool.automationContract():", await pool.automationContract());
  console.log("  pool.reputationContract():", await pool.reputationContract());
  console.log("  optimizer.functionsContract():", await optimizer.functionsContract());
  console.log("  optimizer.authorizedPools(pool):", await optimizer.authorizedPools(POOL));
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
