const hre = require("hardhat");

/**
 * Fix: Call setPriceFeed(address(0)) on ArminaPool contracts
 * This disables the broken price feed that causes getDynamicCollateralMultiplier() to revert.
 * When priceFeed == address(0), the contract defaults to 125% multiplier.
 */
async function main() {
  const ethers = hre.ethers;
  const [deployer] = await ethers.getSigners();
  console.log("Fixing price feed with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // ArminaPool ABI - only need setPriceFeed and getDynamicCollateralMultiplier
  const abi = [
    "function setPriceFeed(address _feed) external",
    "function getDynamicCollateralMultiplier() public view returns (uint256)",
    "function priceFeed() public view returns (address)",
    "function owner() public view returns (address)",
  ];

  // Both pool addresses
  const pools = [
    { name: "ArminaPool (env.local / frontend)", address: "0x5DD351Aa364b3E77650daF9eF29EC907eECA30AC" },
    { name: "ArminaPool (env / older)", address: "0xB6aceB8060CC2CfA2Af0849c2f76838833ce06E3" },
  ];

  for (const pool of pools) {
    console.log(`\n--- ${pool.name} ---`);
    console.log("Address:", pool.address);

    const contract = new ethers.Contract(pool.address, abi, deployer);

    // Check current price feed
    try {
      const currentFeed = await contract.priceFeed();
      console.log("Current price feed:", currentFeed);

      if (currentFeed === ethers.ZeroAddress) {
        console.log("Price feed already disabled (address(0)). Skipping.");

        // Verify multiplier works
        const multiplier = await contract.getDynamicCollateralMultiplier();
        console.log("getDynamicCollateralMultiplier():", multiplier.toString(), "% ✅");
        continue;
      }
    } catch (e: any) {
      console.log("Could not read priceFeed():", e.message);
    }

    // Check owner
    try {
      const owner = await contract.owner();
      console.log("Contract owner:", owner);
      console.log("Our address:   ", deployer.address);
      if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.log("⚠️  We are NOT the owner. Skipping this contract.");
        continue;
      }
    } catch (e: any) {
      console.log("Could not read owner():", e.message);
      continue;
    }

    // Test if getDynamicCollateralMultiplier reverts
    try {
      const multiplier = await contract.getDynamicCollateralMultiplier();
      console.log("getDynamicCollateralMultiplier():", multiplier.toString(), "% — already works!");
      continue;
    } catch (e: any) {
      console.log("getDynamicCollateralMultiplier() REVERTS:", (e.message || "").substring(0, 100));
      console.log("→ Fixing by calling setPriceFeed(address(0))...");
    }

    // Call setPriceFeed(address(0))
    try {
      const tx = await contract.setPriceFeed(ethers.ZeroAddress);
      console.log("TX sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("TX confirmed in block:", receipt?.blockNumber);

      // Verify fix
      const multiplier = await contract.getDynamicCollateralMultiplier();
      console.log("getDynamicCollateralMultiplier():", multiplier.toString(), "% ✅ FIXED!");
    } catch (e: any) {
      console.log("❌ Failed to fix:", (e.message || "").substring(0, 200));
    }
  }

  console.log("\n=== Done! ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
