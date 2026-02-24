const hre = require("hardhat");
require("dotenv").config();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * End-to-end test: Create a pool then join it on the new ArminaPool contract.
 * Uses compiled ABI from artifacts for accurate encoding/decoding.
 */
async function main() {
  const ethers = hre.ethers;
  const [deployer] = await ethers.getSigners();

  const POOL_ADDR = "0xeF490B63A0b15618f437C5b7BA774146Dc3213A3";
  const IDRX_ADDR = "0x7F197979D4046b2264De80D11359B6Cb5d1a8611";

  console.log("=== Test joinPool on new ArminaPool ===\n");
  console.log("Account:", deployer.address);

  // Use compiled ABI from artifacts
  const ArminaPoolFactory = await ethers.getContractFactory("ArminaPool");
  const pool = ArminaPoolFactory.attach(POOL_ADDR);

  const IDRXFactory = await ethers.getContractFactory("IDRX");
  const idrx = IDRXFactory.attach(IDRX_ADDR);

  // Step 1: Check multiplier
  console.log("Step 1: getDynamicCollateralMultiplier()");
  const multiplier = await pool.getDynamicCollateralMultiplier();
  console.log("  Multiplier:", multiplier.toString(), "%\n");

  // Step 2: Check IDRX balance & claim faucet
  console.log("Step 2: Check IDRX balance");
  const decimals = await idrx.decimals();
  console.log("  Decimals:", Number(decimals));
  let balance = await idrx.balanceOf(deployer.address);
  console.log("  Balance:", ethers.formatUnits(balance, decimals), "IDRX");

  // Claim faucet if balance is low
  const neededRaw = ethers.parseUnits("1000", Number(decimals)); // 1000 IDRX should be enough for 100 IDRX test
  if (balance < neededRaw) {
    console.log("  Claiming faucet...");
    const faucetTx = await idrx.faucet();
    await faucetTx.wait();
    balance = await idrx.balanceOf(deployer.address);
    console.log("  New balance:", ethers.formatUnits(balance, decimals), "IDRX");
  }

  // Step 3: Create a pool (5 members, 100 IDRX monthly)
  console.log("\nStep 3: Create pool (5 members, 100 IDRX/month)");
  const monthlyAmount = ethers.parseUnits("100", Number(decimals));
  console.log("  monthlyAmount raw:", monthlyAmount.toString());
  try {
    const createTx = await pool.createPool(monthlyAmount, 5);
    const createReceipt = await createTx.wait();
    console.log("  TX:", createTx.hash);
    console.log("  Status:", createReceipt.status === 1 ? "✅" : "❌");
  } catch (e: any) {
    console.log("  ❌ createPool FAILED:", (e.message || "").substring(0, 200));
    return;
  }

  // Wait for chain sync
  await sleep(3000);

  const poolId = await pool.poolCounter();
  console.log("  Pool ID:", poolId.toString());

  // Step 4: Get pool details
  console.log("\nStep 4: Pool details");
  try {
    const details = await pool.getPoolDetails(poolId);
    console.log("  Monthly:", ethers.formatUnits(details.monthlyAmount, decimals), "IDRX");
    console.log("  Pool size:", details.poolSize.toString());
    console.log("  Collateral required:", ethers.formatUnits(details.collateralRequired, decimals), "IDRX");
    console.log("  Status:", details.status.toString(), "(0=Open)");

    // Step 5: Approve IDRX
    const totalApprove = details.collateralRequired + details.monthlyAmount;
    console.log("\nStep 5: Approve", ethers.formatUnits(totalApprove, decimals), "IDRX");

    // Check balance is sufficient
    if (balance < totalApprove) {
      console.log("  ⚠️  Balance insufficient. Claiming more faucet...");
      for (let i = 0; i < 5; i++) {
        try {
          const tx = await idrx.faucet();
          await tx.wait();
        } catch { /* nonce issues ok */ }
      }
      balance = await idrx.balanceOf(deployer.address);
      console.log("  Updated balance:", ethers.formatUnits(balance, decimals), "IDRX");
    }

    const approveTx = await idrx.approve(POOL_ADDR, totalApprove);
    await approveTx.wait();
    console.log("  Approved ✅");

    // Step 6: Join the pool
    console.log("\nStep 6: joinPool(" + poolId + ")");
    const joinTx = await pool.joinPool(poolId);
    const joinReceipt = await joinTx.wait();
    console.log("  TX:", joinTx.hash);
    console.log("  Status:", joinReceipt.status === 1 ? "✅ SUCCESS!" : "❌ FAILED");
    console.log("  Gas used:", joinReceipt.gasUsed.toString());

    // Step 7: Verify
    await sleep(2000);
    console.log("\nStep 7: Verify pool state after join");
    const detailsAfter = await pool.getPoolDetails(poolId);
    console.log("  Participants:", detailsAfter.currentParticipants.toString(), "/", detailsAfter.poolSize.toString());
    console.log("  Status:", detailsAfter.status.toString(), "(0=Open, 1=Full, 2=Active)");

  } catch (e: any) {
    console.log("  ❌ ERROR:", (e.message || "").substring(0, 300));
  }

  console.log("\n=== Test Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
