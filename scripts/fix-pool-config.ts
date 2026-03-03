const hre = require("hardhat");
require("dotenv").config();

/**
 * Diagnose & fix ArminaPool configuration issues that cause joinPool() to revert.
 *
 * Root causes of "Execution reverted for unknown reason" in joinPool():
 *  1. priceFeed set to a broken/wrong address → getDynamicCollateralMultiplier() reverts
 *  2. reputationContract set to a wrong address → getCollateralDiscount() reverts
 *
 * Fix: zero out the broken addresses so joinPool() uses safe defaults.
 *   - priceFeed = address(0)       → getDynamicCollateralMultiplier returns 125 (default)
 *   - reputationContract = address(0) → skip collateral discount (no discount applied)
 *
 * Usage:
 *   npx hardhat run scripts/fix-pool-config.ts --network baseSepolia
 */
async function main() {
  const ethers = hre.ethers;
  const [deployer] = await ethers.getSigners();
  console.log("=== ArminaPool Config Fix ===\n");
  console.log("Deployer:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  // Current pool address — read from env or use known address
  const poolAddr =
    process.env.ARMINA_POOL_ADDRESS ||
    process.env.NEXT_PUBLIC_ARMINA_POOL_ADDRESS ||
    "0xeF490B63A0b15618f437C5b7BA774146Dc3213A3";

  console.log("Target ArminaPool:", poolAddr);

  const abi = [
    "function owner() view returns (address)",
    "function priceFeed() view returns (address)",
    "function reputationContract() view returns (address)",
    "function getDynamicCollateralMultiplier() view returns (uint256)",
    "function getCollateralDiscountForUser(address user) view returns (uint8)",
    "function setPriceFeed(address _feed) external",
    "function setReputationContract(address _reputation) external",
  ];

  const pool = new ethers.Contract(poolAddr, abi, deployer);

  // 1. Verify we are owner
  let owner: string;
  try {
    owner = await pool.owner();
    console.log("Contract owner:", owner);
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log("❌ We are NOT the contract owner. Cannot fix.\n");
      console.log("   The owner is:", owner);
      console.log("   Configure PRIVATE_KEY in .env to use the owner wallet.");
      process.exit(1);
    }
    console.log("✅ We are the owner\n");
  } catch (e: any) {
    console.log("❌ Cannot read owner():", (e.message || "").substring(0, 100));
    process.exit(1);
  }

  // 2. Diagnose priceFeed
  console.log("--- Diagnosing priceFeed ---");
  let priceFeedFixed = false;
  try {
    const feed = await pool.priceFeed();
    console.log("priceFeed address:", feed);

    if (feed === ethers.ZeroAddress) {
      console.log("priceFeed is address(0) — no external call, safe ✅");
    } else {
      console.log("priceFeed is set. Testing getDynamicCollateralMultiplier()...");
      try {
        const m = await pool.getDynamicCollateralMultiplier();
        console.log("getDynamicCollateralMultiplier():", m.toString(), "% ✅ (working)");
      } catch (e2: any) {
        console.log("getDynamicCollateralMultiplier() REVERTS ❌ — broken price feed!");
        console.log("→ Calling setPriceFeed(address(0)) to disable...");
        const tx = await pool.setPriceFeed(ethers.ZeroAddress);
        await tx.wait();
        const m2 = await pool.getDynamicCollateralMultiplier();
        console.log("getDynamicCollateralMultiplier() after fix:", m2.toString(), "% ✅ FIXED");
        priceFeedFixed = true;
      }
    }
  } catch (e: any) {
    console.log("Could not read priceFeed():", (e.message || "").substring(0, 100));
  }

  // 3. Diagnose reputationContract
  console.log("\n--- Diagnosing reputationContract ---");
  let reputationFixed = false;
  try {
    const repAddr = await pool.reputationContract();
    console.log("reputationContract address:", repAddr);

    if (repAddr === ethers.ZeroAddress) {
      console.log("reputationContract is address(0) — skipped in joinPool, safe ✅");
    } else {
      console.log("reputationContract is set. Testing getCollateralDiscountForUser()...");
      // Use a known EOA as test user (the deployer)
      try {
        const discount = await pool.getCollateralDiscountForUser(deployer.address);
        console.log("getCollateralDiscountForUser(deployer):", discount.toString(), "% ✅ (working)");
      } catch (e2: any) {
        console.log("getCollateralDiscountForUser() REVERTS ❌ — broken reputation contract!");
        console.log("→ Calling setReputationContract(address(0)) to disable...");
        const tx = await pool.setReputationContract(ethers.ZeroAddress);
        await tx.wait();
        console.log("setReputationContract(0) ✅ FIXED — collateral discount disabled");
        reputationFixed = true;
      }
    }
  } catch (e: any) {
    console.log("Could not read reputationContract():", (e.message || "").substring(0, 100));
  }

  // 4. Summary
  console.log("\n=== Summary ===");
  if (priceFeedFixed || reputationFixed) {
    console.log("✅ Fixes applied:");
    if (priceFeedFixed) console.log("   - priceFeed reset to address(0)");
    if (reputationFixed) console.log("   - reputationContract reset to address(0)");
    console.log("\n joinPool() should now work. Test via frontend or test-joinpool script.");
  } else {
    console.log("No fixes needed — priceFeed and reputationContract appear healthy.");
    console.log("If joinPool() still fails, the issue might be:");
    console.log("  - User has insufficient IDRX balance on the correct IDRX contract");
    console.log("  - Pool is not in Open status on-chain (try refreshing the frontend)");
    console.log("  - User already joined this pool");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
