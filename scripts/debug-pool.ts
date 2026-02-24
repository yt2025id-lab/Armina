const hre = require("hardhat");

/**
 * Debug: Investigate what contract is at 0x5DD3...30AC
 * and why priceFeed() and setPriceFeed() revert.
 */
async function main() {
  const ethers = hre.ethers;
  const [deployer] = await ethers.getSigners();
  const poolAddr = "0x5DD351Aa364b3E77650daF9eF29EC907eECA30AC";

  console.log("=== Debugging ArminaPool at", poolAddr, "===\n");

  // 1. Check if contract exists
  const code = await ethers.provider.getCode(poolAddr);
  console.log("1. Contract bytecode length:", code.length, "chars");
  console.log("   Has code:", code !== "0x");

  // 2. Try calling various functions with full ArminaPool ABI
  const fullAbi = [
    "function owner() view returns (address)",
    "function idrxToken() view returns (address)",
    "function poolCounter() view returns (uint256)",
    "function subscriptionId() view returns (uint256)",
    "function keyHash() view returns (bytes32)",
    "function priceFeed() view returns (address)",
    "function yieldOptimizer() view returns (address)",
    "function reputationContract() view returns (address)",
    "function automationContract() view returns (address)",
    "function ccipContract() view returns (address)",
    "function getDynamicCollateralMultiplier() view returns (uint256)",
    "function getLatestETHPrice() view returns (int256)",
    "function setPriceFeed(address _feed) external",
    "function PENALTY_RATE() view returns (uint256)",
    "function PLATFORM_FEE() view returns (uint256)",
  ];

  const contract = new ethers.Contract(poolAddr, fullAbi, deployer);

  // Try each function
  const viewFunctions = [
    "owner", "idrxToken", "poolCounter", "subscriptionId", "keyHash",
    "priceFeed", "yieldOptimizer", "reputationContract", "automationContract",
    "ccipContract", "getDynamicCollateralMultiplier", "getLatestETHPrice",
    "PENALTY_RATE", "PLATFORM_FEE",
  ];

  console.log("\n2. Testing view functions:");
  for (const fn of viewFunctions) {
    try {
      const result = await contract[fn]();
      console.log(`   ✅ ${fn}(): ${result}`);
    } catch (e: any) {
      const reason = e.reason || e.message?.substring(0, 80) || "unknown";
      console.log(`   ❌ ${fn}(): REVERT — ${reason}`);
    }
  }

  // 3. Try raw staticcall for getDynamicCollateralMultiplier
  console.log("\n3. Raw staticcall for getDynamicCollateralMultiplier:");
  try {
    const iface = new ethers.Interface(["function getDynamicCollateralMultiplier() view returns (uint256)"]);
    const calldata = iface.encodeFunctionData("getDynamicCollateralMultiplier");
    console.log("   Calldata:", calldata);
    const result = await ethers.provider.call({ to: poolAddr, data: calldata });
    console.log("   Raw result:", result);
    const decoded = iface.decodeFunctionResult("getDynamicCollateralMultiplier", result);
    console.log("   Decoded:", decoded[0].toString());
  } catch (e: any) {
    console.log("   ❌ Error:", e.message?.substring(0, 200));
    if (e.data) console.log("   Revert data:", e.data);
  }

  // 4. Try raw call for setPriceFeed(address(0))
  console.log("\n4. Estimate gas for setPriceFeed(address(0)):");
  try {
    const iface = new ethers.Interface(["function setPriceFeed(address _feed)"]);
    const calldata = iface.encodeFunctionData("setPriceFeed", [ethers.ZeroAddress]);
    console.log("   Calldata:", calldata);
    const gas = await ethers.provider.estimateGas({
      to: poolAddr,
      data: calldata,
      from: deployer.address,
    });
    console.log("   Estimated gas:", gas.toString());
  } catch (e: any) {
    console.log("   ❌ Error:", e.message?.substring(0, 200));
    if (e.data) console.log("   Revert data:", e.data);
  }

  // 5. Compare with working pool
  const workingPoolAddr = "0xB6aceB8060CC2CfA2Af0849c2f76838833ce06E3";
  const workingPool = new ethers.Contract(workingPoolAddr, fullAbi, deployer);
  console.log("\n5. Compare with working pool (0xB6ac...):");
  for (const fn of ["owner", "idrxToken", "poolCounter", "priceFeed", "getDynamicCollateralMultiplier"]) {
    try {
      const result = await workingPool[fn]();
      console.log(`   ✅ ${fn}(): ${result}`);
    } catch (e: any) {
      console.log(`   ❌ ${fn}(): ${(e.message || "").substring(0, 80)}`);
    }
  }

  console.log("\n=== Debug complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
