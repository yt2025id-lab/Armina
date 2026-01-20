const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy IDRX Mock Token for Testing
 * This is a simple ERC20 token for testnet purposes
 */
async function main() {
  console.log("Deploying IDRX Mock Token...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy a simple ERC20 token
  const IDRX = await hre.ethers.getContractFactory("IDRX");

  const initialSupply = hre.ethers.parseUnits("1000000000", 18); // 1 billion IDRX
  const idrx = await IDRX.deploy(initialSupply);

  await idrx.waitForDeployment();
  const idrxAddress = await idrx.getAddress();

  console.log("\n✅ IDRX Token deployed to:", idrxAddress);
  console.log("Initial supply:", hre.ethers.formatUnits(initialSupply, 18), "IDRX");
  console.log("Deployer balance:", hre.ethers.formatUnits(await idrx.balanceOf(deployer.address), 18), "IDRX");

  console.log("\n📌 Next Steps:");
  console.log("==============");
  console.log("1. Update .env file:");
  console.log(`   IDRX_TOKEN_ADDRESS=${idrxAddress}`);
  console.log(`   NEXT_PUBLIC_IDRX_TOKEN_ADDRESS=${idrxAddress}`);
  console.log("\n2. Verify on Basescan:");
  console.log(`   npx hardhat verify --network baseSepolia ${idrxAddress} "${initialSupply}"`);
  console.log("\n3. Deploy ArminaPool contract:");
  console.log(`   npm run deploy:pool`);

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
      initialSupply: initialSupply.toString(),
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
