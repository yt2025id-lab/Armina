const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const IDRX_ADDRESS = "0xd7712a13AB95Ab7F3AfeB3eEc4125dE18D219eeD";
  const poolAddr = "0x3d9a93038E93f70E9CD4fb374F2F7243a72663A5";
  const optimizerAddr = "0x1b0007d0aACDDf08F9b32eAa431D141c33891031";
  const automationAddr = "0x2f4298770BbAa71624154d29126BB863014Dbf41";
  const functionsAddr = "0xE38C232d24Ca5cc82509D7285D924Fe7d3b079d9";
  const CCIP_ROUTER = deployer.address;
  const REPUTATION_ADDRESS = "0x6a7ff47bA8633F252d28F9D6F080fd8cf50ddF6B";
  const ETH_SEPOLIA_SELECTOR = "16015286601757825753";

  // 5. Deploy ArminaCCIP
  console.log("5/6 Deploying ArminaCCIP...");
  const ArminaCCIP = await hre.ethers.getContractFactory("ArminaCCIP");
  const ccip = await ArminaCCIP.deploy(CCIP_ROUTER, poolAddr, IDRX_ADDRESS);
  await ccip.waitForDeployment();
  const ccipAddr = await ccip.getAddress();
  console.log("  ArminaCCIP:", ccipAddr);

  // 6. Link all contracts
  console.log("\n6/6 Linking contracts...");

  const pool = await hre.ethers.getContractAt("ArminaPool", poolAddr);
  const optimizer = await hre.ethers.getContractAt("ArminaYieldOptimizer", optimizerAddr);
  const automation = await hre.ethers.getContractAt("ArminaAutomation", automationAddr);
  const functions = await hre.ethers.getContractAt("ArminaFunctions", functionsAddr);

  let tx;

  tx = await pool.setYieldOptimizer(optimizerAddr);
  await tx.wait();
  console.log("  Pool -> YieldOptimizer");

  tx = await pool.setAutomationContract(automationAddr);
  await tx.wait();
  console.log("  Pool -> Automation");

  tx = await pool.setCCIPContract(ccipAddr);
  await tx.wait();
  console.log("  Pool -> CCIP");

  tx = await optimizer.authorizePool(poolAddr);
  await tx.wait();
  console.log("  Optimizer -> Pool authorized");

  tx = await optimizer.setFunctionsContract(functionsAddr);
  await tx.wait();
  console.log("  Optimizer -> Functions");

  tx = await functions.setYieldOptimizer(optimizerAddr);
  await tx.wait();
  console.log("  Functions -> Optimizer");

  tx = await functions.setArminaPool(poolAddr);
  await tx.wait();
  console.log("  Functions -> Pool (auto-rebalance)");

  tx = await automation.setFunctions(functionsAddr);
  await tx.wait();
  console.log("  Automation -> Functions (CRE)");

  const ccipContract = await hre.ethers.getContractAt("ArminaCCIP", ccipAddr);
  tx = await ccipContract.allowSourceChain(ETH_SEPOLIA_SELECTOR, true);
  await tx.wait();
  console.log("  CCIP -> Eth Sepolia allowed");

  tx = await pool.setReputationContract(REPUTATION_ADDRESS);
  await tx.wait();
  console.log("  Pool -> Reputation");

  try {
    const reputation = await hre.ethers.getContractAt("ArminaReputation", REPUTATION_ADDRESS);
    tx = await reputation.authorizePool(poolAddr);
    await tx.wait();
    console.log("  Reputation -> Pool authorized");
  } catch (e) {
    console.log("  Reputation -> Pool skipped");
  }

  console.log("\n=== ALL CONTRACTS DEPLOYED AND LINKED ===");
  console.log("\nAddresses:");
  console.log(`  ArminaPool:            ${poolAddr}`);
  console.log(`  ArminaYieldOptimizer:  ${optimizerAddr}`);
  console.log(`  ArminaAutomation:      ${automationAddr}`);
  console.log(`  ArminaFunctions:       ${functionsAddr}`);
  console.log(`  ArminaCCIP:            ${ccipAddr}`);
  console.log(`\nNEXT_PUBLIC_CCIP_ADDRESS=${ccipAddr}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
