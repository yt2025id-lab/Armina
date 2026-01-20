const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  console.log("Starting Armina Pool deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Configuration
  const IDRX_TOKEN_ADDRESS = process.env.IDRX_TOKEN_ADDRESS || "";
  const VRF_COORDINATOR = process.env.VRF_COORDINATOR_SEPOLIA || "";
  const VRF_SUBSCRIPTION_ID = process.env.VRF_SUBSCRIPTION_ID || "0";
  const VRF_KEY_HASH = process.env.VRF_KEY_HASH_SEPOLIA || "";

  console.log("\nDeployment Configuration:");
  console.log("------------------------");
  console.log("IDRX Token Address:", IDRX_TOKEN_ADDRESS);
  console.log("VRF Coordinator:", VRF_COORDINATOR);
  console.log("VRF Subscription ID:", VRF_SUBSCRIPTION_ID);
  console.log("VRF Key Hash:", VRF_KEY_HASH);

  // Validate configuration
  if (!IDRX_TOKEN_ADDRESS) {
    console.error("\n❌ Error: IDRX_TOKEN_ADDRESS not set in .env");
    console.log("Please deploy IDRX token first or provide existing address");
    process.exit(1);
  }

  if (!VRF_COORDINATOR || !VRF_KEY_HASH) {
    console.error("\n❌ Error: Chainlink VRF configuration missing");
    console.log("Please set VRF_COORDINATOR and VRF_KEY_HASH in .env");
    process.exit(1);
  }

  // Deploy ArminaPool contract
  console.log("\n📝 Deploying ArminaPool contract...");
  const ArminaPool = await hre.ethers.getContractFactory("ArminaPool");

  const arminaPool = await ArminaPool.deploy(
    IDRX_TOKEN_ADDRESS,
    VRF_COORDINATOR,
    VRF_SUBSCRIPTION_ID,
    VRF_KEY_HASH
  );

  await arminaPool.waitForDeployment();
  const arminaPoolAddress = await arminaPool.getAddress();

  console.log("\n✅ ArminaPool deployed to:", arminaPoolAddress);

  // Save deployment info
  const network = await hre.ethers.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      arminaPool: arminaPoolAddress,
      idrxToken: IDRX_TOKEN_ADDRESS,
      vrfCoordinator: VRF_COORDINATOR,
    },
    configuration: {
      vrfSubscriptionId: VRF_SUBSCRIPTION_ID,
      vrfKeyHash: VRF_KEY_HASH,
      platformFee: 10,
      penaltyRate: 10,
    },
  };

  console.log("\n📋 Deployment Summary:");
  console.log("======================");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Instructions
  console.log("\n📌 Next Steps:");
  console.log("==============");
  console.log("1. Create Chainlink VRF Subscription (if not exists):");
  console.log(`   - Go to https://vrf.chain.link/base-sepolia`);
  console.log(`   - Create subscription and fund it with LINK`);
  console.log(`   - Add consumer: ${arminaPoolAddress}`);
  console.log("\n2. Update .env file:");
  console.log(`   ARMINA_POOL_ADDRESS=${arminaPoolAddress}`);
  console.log(`   NEXT_PUBLIC_ARMINA_POOL_ADDRESS=${arminaPoolAddress}`);
  console.log("\n3. Verify contract on Basescan:");
  console.log(`   npx hardhat verify --network baseSepolia ${arminaPoolAddress} "${IDRX_TOKEN_ADDRESS}" "${VRF_COORDINATOR}" "${VRF_SUBSCRIPTION_ID}" "${VRF_KEY_HASH}"`);

  // Save to file
  const deploymentsDir = path.join(__dirname, "..", "deployments");

  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const filename = `arminapool-deployment-${Date.now()}.json`;
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
