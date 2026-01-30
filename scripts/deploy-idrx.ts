const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy IDRX Mock Token for Testing
 * Uses 2 decimals to match IDR denomination
 * Faucet: 500,000 IDRX per claim, 1 day cooldown
 */
async function main() {
  console.log("Deploying IDRX Mock Token (500K faucet)...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  const IDRX = await hre.ethers.getContractFactory("IDRX");
  const idrx = await IDRX.deploy();

  await idrx.waitForDeployment();
  const idrxAddress = await idrx.getAddress();

  console.log("\n✅ IDRX Token deployed to:", idrxAddress);
  console.log("Faucet amount: 500,000 IDRX per claim");
  console.log("Cooldown: 1 day");

  console.log("\n📌 Next Steps:");
  console.log("==============");
  console.log("1. Update .env.local:");
  console.log(`   NEXT_PUBLIC_IDRX_TOKEN_ADDRESS=${idrxAddress}`);
  console.log("\n2. Update Vercel env vars with same address");

  // Save deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentInfo = {
    network: (await hre.ethers.provider.getNetwork()).name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contract: {
      name: "IDRX",
      address: idrxAddress,
      faucetAmount: "500,000 IDRX",
      decimals: 2,
    },
  };

  const filename = `idrx-deployment-${Date.now()}.json`;
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
