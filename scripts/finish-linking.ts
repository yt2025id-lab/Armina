const hre = require("hardhat");
require("dotenv").config();

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const poolAddr = "0x3d9a93038E93f70E9CD4fb374F2F7243a72663A5";
  const automationAddr = "0x2f4298770BbAa71624154d29126BB863014Dbf41";
  const functionsAddr = "0xE38C232d24Ca5cc82509D7285D924Fe7d3b079d9";
  const ccipAddr = "0x4e872C21F61CB1C6a5C8138185dc253c449F3017";
  const REPUTATION_ADDRESS = "0x6a7ff47bA8633F252d28F9D6F080fd8cf50ddF6B";
  const ETH_SEPOLIA_SELECTOR = "16015286601757825753";

  const automation = await hre.ethers.getContractAt("ArminaAutomation", automationAddr);
  const ccip = await hre.ethers.getContractAt("ArminaCCIP", ccipAddr);
  const pool = await hre.ethers.getContractAt("ArminaPool", poolAddr);

  let tx;

  console.log("1. Automation -> Functions (CRE)...");
  tx = await automation.setFunctions(functionsAddr);
  await tx.wait();
  console.log("  Done");
  await sleep(3000);

  console.log("2. CCIP -> Eth Sepolia allowed...");
  tx = await ccip.allowSourceChain(ETH_SEPOLIA_SELECTOR, true);
  await tx.wait();
  console.log("  Done");
  await sleep(3000);

  console.log("3. Pool -> Reputation...");
  tx = await pool.setReputationContract(REPUTATION_ADDRESS);
  await tx.wait();
  console.log("  Done");
  await sleep(3000);

  try {
    const reputation = await hre.ethers.getContractAt("ArminaReputation", REPUTATION_ADDRESS);
    console.log("4. Reputation -> Pool authorized...");
    tx = await reputation.authorizePool(poolAddr);
    await tx.wait();
    console.log("  Done");
  } catch (e) {
    console.log("  Reputation skipped");
  }

  console.log("\n=== ALL LINKS COMPLETE ===");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
