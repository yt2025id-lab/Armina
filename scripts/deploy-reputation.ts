const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy ArminaReputation Soulbound NFT
 */
async function main() {
  console.log("Deploying ArminaReputation Soulbound NFT...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  const Reputation = await hre.ethers.getContractFactory("ArminaReputation");
  const reputation = await Reputation.deploy();

  await reputation.waitForDeployment();
  const reputationAddress = await reputation.getAddress();

  console.log("\n✅ ArminaReputation deployed to:", reputationAddress);

  // Authorize the ArminaPool contract if set
  const poolAddress = process.env.NEXT_PUBLIC_ARMINA_POOL_ADDRESS;
  if (poolAddress) {
    console.log("\nAuthorizing ArminaPool:", poolAddress);
    const tx = await reputation.authorizePool(poolAddress);
    await tx.wait();
    console.log("✅ ArminaPool authorized");
  }

  console.log("\n📌 Next Steps:");
  console.log("==============");
  console.log("1. Update .env.local:");
  console.log(`   NEXT_PUBLIC_REPUTATION_ADDRESS=${reputationAddress}`);
  console.log("\n2. Verify on Basescan:");
  console.log(`   npx hardhat verify --network baseSepolia ${reputationAddress}`);

  // Save deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentInfo = {
    network: (await hre.ethers.provider.getNetwork()).name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contract: {
      name: "ArminaReputation",
      address: reputationAddress,
    },
  };

  const filename = `reputation-deployment-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`\n💾 Deployment info saved to: deployments/${filename}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
