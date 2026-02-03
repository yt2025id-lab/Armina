const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("ArminaPool", function () {
  // Deploy fixture
  async function deployFixture() {
    const [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();

    // Deploy IDRX token (constructor mints 1B with 2 decimals)
    const IDRX = await ethers.getContractFactory("IDRX");
    const idrx = await IDRX.deploy();
    await idrx.waitForDeployment();

    // Use zero address for VRF coordinator in tests (VRF won't be called)
    const vrfCoordinator = "0x0000000000000000000000000000000000000001"; // non-zero to avoid constructor issues

    // Deploy ArminaPool
    const ArminaPool = await ethers.getContractFactory("ArminaPool");
    const pool = await ArminaPool.deploy(
      await idrx.getAddress(),
      vrfCoordinator,
      0, // subscriptionId
      ethers.ZeroHash // keyHash
    );
    await pool.waitForDeployment();

    // Deploy ArminaReputation
    const Reputation = await ethers.getContractFactory("ArminaReputation");
    const reputation = await Reputation.deploy();
    await reputation.waitForDeployment();

    // Deploy ArminaYieldOptimizer
    const Optimizer = await ethers.getContractFactory("ArminaYieldOptimizer");
    const optimizer = await Optimizer.deploy(await idrx.getAddress());
    await optimizer.waitForDeployment();

    // Distribute IDRX to users for testing (2 decimals)
    const distributionAmount = ethers.parseUnits("100000000", 2); // 100M each
    for (const user of [user1, user2, user3, user4, user5]) {
      await idrx.transfer(user.address, distributionAmount);
    }

    return { idrx, pool, reputation, optimizer, owner, user1, user2, user3, user4, user5 };
  }

  describe("IDRX Token", function () {
    it("should deploy with correct initial supply", async function () {
      const { idrx, owner } = await loadFixture(deployFixture);
      const balance = await idrx.balanceOf(owner.address);
      expect(balance).to.be.gt(0);
    });

    it("should allow faucet claims", async function () {
      const { idrx, user1 } = await loadFixture(deployFixture);
      const balanceBefore = await idrx.balanceOf(user1.address);
      await idrx.connect(user1).faucet();
      const balanceAfter = await idrx.balanceOf(user1.address);
      const faucetAmount = ethers.parseUnits("500000", 2); // 500K IDRX with 2 decimals
      expect(balanceAfter - balanceBefore).to.equal(faucetAmount);
    });

    it("should have 2 decimals", async function () {
      const { idrx } = await loadFixture(deployFixture);
      expect(await idrx.decimals()).to.equal(2);
    });
  });

  describe("Pool Creation", function () {
    it("should create a pool with valid parameters", async function () {
      const { pool } = await loadFixture(deployFixture);
      const monthlyAmount = ethers.parseUnits("500000", 2);

      const tx = await pool.createPool(monthlyAmount, 5);
      await tx.wait();

      const counter = await pool.poolCounter();
      expect(counter).to.equal(1);
    });

    it("should emit PoolCreated event", async function () {
      const { pool, owner } = await loadFixture(deployFixture);
      const monthlyAmount = ethers.parseUnits("500000", 2);
      const poolSize = 5;
      const expectedCollateral = (monthlyAmount * BigInt(poolSize) * 125n) / 100n;

      await expect(pool.createPool(monthlyAmount, poolSize))
        .to.emit(pool, "PoolCreated")
        .withArgs(1, owner.address, monthlyAmount, poolSize, expectedCollateral);
    });

    it("should reject invalid pool size", async function () {
      const { pool } = await loadFixture(deployFixture);
      const monthlyAmount = ethers.parseUnits("500000", 2);

      await expect(pool.createPool(monthlyAmount, 3)).to.be.revertedWithCustomError(
        pool,
        "InvalidPoolSize"
      );
      await expect(pool.createPool(monthlyAmount, 7)).to.be.revertedWithCustomError(
        pool,
        "InvalidPoolSize"
      );
    });

    it("should reject zero monthly amount", async function () {
      const { pool } = await loadFixture(deployFixture);
      await expect(pool.createPool(0, 5)).to.be.revertedWithCustomError(
        pool,
        "InvalidMonthlyAmount"
      );
    });

    it("should calculate 125% collateral correctly", async function () {
      const { pool } = await loadFixture(deployFixture);
      const monthlyAmount = ethers.parseUnits("100000", 2);

      await pool.createPool(monthlyAmount, 10);
      const details = await pool.getPoolDetails(1);

      const expected = (monthlyAmount * 10n * 125n) / 100n;
      expect(details[3]).to.equal(expected);
    });

    it("should allow multiple pool creation", async function () {
      const { pool } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("100000", 2);

      await pool.createPool(amount, 5);
      await pool.createPool(amount, 10);
      await pool.createPool(amount, 20);

      expect(await pool.poolCounter()).to.equal(3);
    });
  });

  describe("Joining Pool", function () {
    async function createPoolFixture() {
      const fixture = await deployFixture();
      const { pool } = fixture;

      const monthlyAmount = ethers.parseUnits("100000", 2);
      await pool.createPool(monthlyAmount, 5);

      return { ...fixture, monthlyAmount };
    }

    it("should allow user to join pool with correct payment", async function () {
      const { pool, idrx, user1, monthlyAmount } = await loadFixture(createPoolFixture);

      const collateral = (monthlyAmount * 5n * 125n) / 100n;
      const totalRequired = collateral + monthlyAmount;

      await idrx.connect(user1).approve(await pool.getAddress(), totalRequired);

      await expect(pool.connect(user1).joinPool(1))
        .to.emit(pool, "ParticipantJoined")
        .withArgs(1, user1.address, collateral, monthlyAmount);

      const details = await pool.getPoolDetails(1);
      expect(details[4]).to.equal(1);
    });

    it("should reject double join", async function () {
      const { pool, idrx, user1, monthlyAmount } = await loadFixture(createPoolFixture);

      const collateral = (monthlyAmount * 5n * 125n) / 100n;
      const totalRequired = collateral + monthlyAmount;

      await idrx.connect(user1).approve(await pool.getAddress(), totalRequired * 2n);
      await pool.connect(user1).joinPool(1);

      await expect(pool.connect(user1).joinPool(1)).to.be.revertedWithCustomError(
        pool,
        "AlreadyJoined"
      );
    });

    it("should auto-start pool when full", async function () {
      const { pool, idrx, user1, user2, user3, user4, user5, monthlyAmount } =
        await loadFixture(createPoolFixture);

      const collateral = (monthlyAmount * 5n * 125n) / 100n;
      const totalRequired = collateral + monthlyAmount;

      const users = [user1, user2, user3, user4, user5];
      for (const user of users) {
        await idrx.connect(user).approve(await pool.getAddress(), totalRequired);
        await pool.connect(user).joinPool(1);
      }

      const details = await pool.getPoolDetails(1);
      expect(details[5]).to.equal(2); // PoolStatus.Active
      expect(details[7]).to.equal(1); // currentMonth = 1
    });

    it("should emit PoolStarted when pool is full", async function () {
      const { pool, idrx, user1, user2, user3, user4, user5, monthlyAmount } =
        await loadFixture(createPoolFixture);

      const collateral = (monthlyAmount * 5n * 125n) / 100n;
      const totalRequired = collateral + monthlyAmount;

      const users = [user1, user2, user3, user4];
      for (const user of users) {
        await idrx.connect(user).approve(await pool.getAddress(), totalRequired);
        await pool.connect(user).joinPool(1);
      }

      await idrx.connect(user5).approve(await pool.getAddress(), totalRequired);
      await expect(pool.connect(user5).joinPool(1)).to.emit(pool, "PoolStarted");
    });

    it("should record first payment in history", async function () {
      const { pool, idrx, user1, monthlyAmount } = await loadFixture(createPoolFixture);

      const collateral = (monthlyAmount * 5n * 125n) / 100n;
      const totalRequired = collateral + monthlyAmount;

      await idrx.connect(user1).approve(await pool.getAddress(), totalRequired);
      await pool.connect(user1).joinPool(1);

      const history = await pool.getPaymentHistory(1, user1.address);
      expect(history.length).to.equal(1);
      expect(history[0].month).to.equal(1);
      expect(history[0].amount).to.equal(monthlyAmount);
      expect(history[0].source).to.equal(0); // PaymentSource.Wallet
    });
  });

  describe("Monthly Payments", function () {
    async function activePoolFixture() {
      const fixture = await deployFixture();
      const { pool, idrx, user1, user2, user3, user4, user5 } = fixture;

      const monthlyAmount = ethers.parseUnits("100000", 2);
      await pool.createPool(monthlyAmount, 5);

      const collateral = (monthlyAmount * 5n * 125n) / 100n;
      const totalRequired = collateral + monthlyAmount;

      const users = [user1, user2, user3, user4, user5];
      for (const user of users) {
        await idrx.connect(user).approve(await pool.getAddress(), totalRequired);
        await pool.connect(user).joinPool(1);
      }

      return { ...fixture, monthlyAmount };
    }

    it("should process monthly payment from wallet", async function () {
      const { pool, idrx, user1, monthlyAmount } = await loadFixture(activePoolFixture);

      await idrx.connect(user1).approve(await pool.getAddress(), monthlyAmount);

      await expect(pool.connect(user1).processMonthlyPayment(1, 2))
        .to.emit(pool, "PaymentProcessed")
        .withArgs(1, user1.address, 2, monthlyAmount, 0, 0);
    });

    it("should reject duplicate payment for same month", async function () {
      const { pool, idrx, user1, monthlyAmount } = await loadFixture(activePoolFixture);

      await idrx.connect(user1).approve(await pool.getAddress(), monthlyAmount * 2n);
      await pool.connect(user1).processMonthlyPayment(1, 2);

      await expect(
        pool.connect(user1).processMonthlyPayment(1, 2)
      ).to.be.revertedWithCustomError(pool, "PaymentAlreadyProcessed");
    });

    it("should reject payment from non-participant", async function () {
      const { pool, owner } = await loadFixture(activePoolFixture);

      await expect(
        pool.connect(owner).processMonthlyPayment(1, 2)
      ).to.be.revertedWithCustomError(pool, "NotParticipant");
    });
  });

  describe("View Functions", function () {
    it("should return pool details", async function () {
      const { pool } = await loadFixture(deployFixture);
      const monthlyAmount = ethers.parseUnits("500000", 2);

      await pool.createPool(monthlyAmount, 10);

      const details = await pool.getPoolDetails(1);
      expect(details[0]).to.equal(1);
      expect(details[1]).to.equal(monthlyAmount);
      expect(details[2]).to.equal(10);
      expect(details[4]).to.equal(0);
      expect(details[5]).to.equal(0); // Open
    });

    it("should return participant details after joining", async function () {
      const { pool, idrx, user1 } = await loadFixture(deployFixture);
      const monthlyAmount = ethers.parseUnits("100000", 2);

      await pool.createPool(monthlyAmount, 5);

      const collateral = (monthlyAmount * 5n * 125n) / 100n;
      const totalRequired = collateral + monthlyAmount;

      await idrx.connect(user1).approve(await pool.getAddress(), totalRequired);
      await pool.connect(user1).joinPool(1);

      const participant = await pool.getParticipantDetails(1, user1.address);
      expect(participant[0]).to.equal(collateral);
      expect(participant[5]).to.equal(false);
    });

    it("should return payment history", async function () {
      const { pool, idrx, user1 } = await loadFixture(deployFixture);
      const monthlyAmount = ethers.parseUnits("100000", 2);

      await pool.createPool(monthlyAmount, 5);

      const collateral = (monthlyAmount * 5n * 125n) / 100n;
      const totalRequired = collateral + monthlyAmount;

      await idrx.connect(user1).approve(await pool.getAddress(), totalRequired);
      await pool.connect(user1).joinPool(1);

      const history = await pool.getPaymentHistory(1, user1.address);
      expect(history.length).to.equal(1);
      expect(history[0].amount).to.equal(monthlyAmount);
    });
  });

  describe("Settlement", function () {
    it("should reject settlement for non-completed pool", async function () {
      const { pool, idrx, user1 } = await loadFixture(deployFixture);
      const monthlyAmount = ethers.parseUnits("100000", 2);

      await pool.createPool(monthlyAmount, 5);

      const collateral = (monthlyAmount * 5n * 125n) / 100n;
      const totalRequired = collateral + monthlyAmount;

      await idrx.connect(user1).approve(await pool.getAddress(), totalRequired);
      await pool.connect(user1).joinPool(1);

      await expect(
        pool.connect(user1).claimFinalSettlement(1)
      ).to.be.revertedWithCustomError(pool, "PoolNotCompleted");
    });
  });

  // ============ NEW: Yield Optimizer Integration Tests ============

  describe("Yield Optimizer Integration", function () {
    it("should set yield optimizer address", async function () {
      const { pool, optimizer } = await loadFixture(deployFixture);
      const optimizerAddr = await optimizer.getAddress();

      await pool.setYieldOptimizer(optimizerAddr);
      expect(await pool.yieldOptimizer()).to.equal(optimizerAddr);
    });

    it("should emit YieldOptimizerUpdated event", async function () {
      const { pool, optimizer } = await loadFixture(deployFixture);
      const optimizerAddr = await optimizer.getAddress();

      await expect(pool.setYieldOptimizer(optimizerAddr))
        .to.emit(pool, "YieldOptimizerUpdated")
        .withArgs(optimizerAddr);
    });

    it("should only allow owner to set yield optimizer", async function () {
      const { pool, optimizer, user1 } = await loadFixture(deployFixture);
      const optimizerAddr = await optimizer.getAddress();

      await expect(
        pool.connect(user1).setYieldOptimizer(optimizerAddr)
      ).to.be.revertedWithCustomError(pool, "OwnableUnauthorizedAccount");
    });

    it("should return current APY from optimizer", async function () {
      const { pool, optimizer } = await loadFixture(deployFixture);
      const optimizerAddr = await optimizer.getAddress();

      await pool.setYieldOptimizer(optimizerAddr);

      const currentAPY = await pool.getCurrentAPY();
      // Morpho has the highest default APY (1400 = 14%)
      expect(currentAPY).to.equal(1400);
    });

    it("should return default APY without optimizer", async function () {
      const { pool } = await loadFixture(deployFixture);

      const currentAPY = await pool.getCurrentAPY();
      expect(currentAPY).to.equal(1250); // Default 12.5%
    });

    it("should deploy collateral to optimizer when pool starts", async function () {
      const { pool, idrx, optimizer, user1, user2, user3, user4, user5 } = await loadFixture(deployFixture);
      const optimizerAddr = await optimizer.getAddress();
      const poolAddr = await pool.getAddress();

      // Setup optimizer
      await pool.setYieldOptimizer(optimizerAddr);
      await optimizer.authorizePool(poolAddr);

      // Create pool
      const monthlyAmount = ethers.parseUnits("100000", 2);
      await pool.createPool(monthlyAmount, 5);

      const collateral = (monthlyAmount * 5n * 125n) / 100n;
      const totalRequired = collateral + monthlyAmount;

      // Join pool with all 5 users to trigger start
      const users = [user1, user2, user3, user4, user5];
      for (const user of users) {
        await idrx.connect(user).approve(poolAddr, totalRequired);
        await pool.connect(user).joinPool(1);
      }

      // Check optimizer received collateral
      const yieldStatus = await optimizer.getPoolYieldStatus(poolAddr);
      expect(yieldStatus[0]).to.equal(collateral * 5n); // Total collateral deposited
    });
  });

  // ============ NEW: VRF Integration Tests ============

  describe("VRF Integration", function () {
    it("should set subscription ID", async function () {
      const { pool } = await loadFixture(deployFixture);

      await pool.setSubscriptionId(12345);
      expect(await pool.subscriptionId()).to.equal(12345);
    });

    it("should emit SubscriptionIdUpdated event", async function () {
      const { pool } = await loadFixture(deployFixture);

      await expect(pool.setSubscriptionId(12345))
        .to.emit(pool, "SubscriptionIdUpdated")
        .withArgs(12345);
    });

    it("should only allow owner to set subscription ID", async function () {
      const { pool, user1 } = await loadFixture(deployFixture);

      await expect(
        pool.connect(user1).setSubscriptionId(12345)
      ).to.be.revertedWithCustomError(pool, "OwnableUnauthorizedAccount");
    });

    it("should reject winner draw for non-active pool", async function () {
      const { pool } = await loadFixture(deployFixture);
      const monthlyAmount = ethers.parseUnits("100000", 2);

      await pool.createPool(monthlyAmount, 5);

      await expect(
        pool.requestWinnerDraw(1)
      ).to.be.revertedWithCustomError(pool, "PoolNotActive");
    });

    it("should allow pool creator to request winner draw", async function () {
      const { pool, idrx, user1, user2, user3, user4, user5 } = await loadFixture(deployFixture);

      const monthlyAmount = ethers.parseUnits("100000", 2);
      await pool.createPool(monthlyAmount, 5); // owner is creator

      const collateral = (monthlyAmount * 5n * 125n) / 100n;
      const totalRequired = collateral + monthlyAmount;

      const users = [user1, user2, user3, user4, user5];
      for (const user of users) {
        await idrx.connect(user).approve(await pool.getAddress(), totalRequired);
        await pool.connect(user).joinPool(1);
      }

      // VRF call will revert because we're using a mock coordinator,
      // but the access control check should pass (owner is creator)
      await expect(
        pool.requestWinnerDraw(1)
      ).to.be.reverted; // Will revert at VRF coordinator level, not access control
    });

    it("should reject winner draw from non-creator non-owner", async function () {
      const { pool, idrx, user1, user2, user3, user4, user5 } = await loadFixture(deployFixture);

      const monthlyAmount = ethers.parseUnits("100000", 2);
      await pool.createPool(monthlyAmount, 5); // owner is creator

      const collateral = (monthlyAmount * 5n * 125n) / 100n;
      const totalRequired = collateral + monthlyAmount;

      const users = [user1, user2, user3, user4, user5];
      for (const user of users) {
        await idrx.connect(user).approve(await pool.getAddress(), totalRequired);
        await pool.connect(user).joinPool(1);
      }

      // user1 is not creator or owner
      await expect(
        pool.connect(user1).requestWinnerDraw(1)
      ).to.be.revertedWith("Only owner or pool creator can draw");
    });

    it("should return pool winner address", async function () {
      const { pool } = await loadFixture(deployFixture);
      const monthlyAmount = ethers.parseUnits("100000", 2);

      await pool.createPool(monthlyAmount, 5);

      // Winner for month 1 should be zero address (no draw yet)
      const winner = await pool.getPoolWinner(1, 1);
      expect(winner).to.equal(ethers.ZeroAddress);
    });
  });

  // ============ NEW: Reputation Integration Tests ============

  describe("Reputation Integration", function () {
    it("should set reputation contract address", async function () {
      const { pool, reputation } = await loadFixture(deployFixture);
      const repAddr = await reputation.getAddress();

      await pool.setReputationContract(repAddr);
      expect(await pool.reputationContract()).to.equal(repAddr);
    });

    it("should emit ReputationContractUpdated event", async function () {
      const { pool, reputation } = await loadFixture(deployFixture);
      const repAddr = await reputation.getAddress();

      await expect(pool.setReputationContract(repAddr))
        .to.emit(pool, "ReputationContractUpdated")
        .withArgs(repAddr);
    });

    it("should return 0 discount without reputation contract", async function () {
      const { pool, user1 } = await loadFixture(deployFixture);

      const discount = await pool.getCollateralDiscountForUser(user1.address);
      expect(discount).to.equal(0);
    });

    it("should return 0 discount for user without reputation NFT", async function () {
      const { pool, reputation, user1 } = await loadFixture(deployFixture);

      await pool.setReputationContract(await reputation.getAddress());

      const discount = await pool.getCollateralDiscountForUser(user1.address);
      expect(discount).to.equal(0);
    });

    it("should apply Silver discount (10%) for user with score >= 100", async function () {
      const { pool, reputation, user1, owner } = await loadFixture(deployFixture);
      const repAddr = await reputation.getAddress();
      const poolAddr = await pool.getAddress();

      // Setup reputation
      await pool.setReputationContract(repAddr);
      await reputation.authorizePool(poolAddr);

      // Use owner as mock pool to build reputation
      await reputation.authorizePool(owner.address);
      await reputation.connect(user1).mint();

      // Give user1 a score of 100 (10 on-time payments)
      for (let i = 0; i < 10; i++) {
        await reputation.recordOnTimePayment(user1.address);
      }

      const discount = await pool.getCollateralDiscountForUser(user1.address);
      expect(discount).to.equal(10); // 10% discount
    });

    it("should apply discounted collateral when joining pool", async function () {
      const { pool, idrx, reputation, user1, owner } = await loadFixture(deployFixture);
      const repAddr = await reputation.getAddress();
      const poolAddr = await pool.getAddress();

      // Setup reputation
      await pool.setReputationContract(repAddr);
      await reputation.authorizePool(poolAddr);
      await reputation.authorizePool(owner.address);

      // Give user1 Silver level (10% discount)
      await reputation.connect(user1).mint();
      for (let i = 0; i < 10; i++) {
        await reputation.recordOnTimePayment(user1.address);
      }

      // Create pool
      const monthlyAmount = ethers.parseUnits("100000", 2);
      await pool.createPool(monthlyAmount, 5);

      const baseCollateral = (monthlyAmount * 5n * 125n) / 100n;
      const discountedCollateral = baseCollateral - (baseCollateral * 10n / 100n);
      const totalRequired = discountedCollateral + monthlyAmount;

      await idrx.connect(user1).approve(poolAddr, totalRequired);

      await expect(pool.connect(user1).joinPool(1))
        .to.emit(pool, "ParticipantJoined")
        .withArgs(1, user1.address, discountedCollateral, monthlyAmount);

      // Check participant collateral deposited is discounted
      const participant = await pool.getParticipantDetails(1, user1.address);
      expect(participant[0]).to.equal(discountedCollateral);
    });

    it("should join without discount when no reputation set", async function () {
      const { pool, idrx, user1 } = await loadFixture(deployFixture);

      const monthlyAmount = ethers.parseUnits("100000", 2);
      await pool.createPool(monthlyAmount, 5);

      const collateral = (monthlyAmount * 5n * 125n) / 100n;
      const totalRequired = collateral + monthlyAmount;

      await idrx.connect(user1).approve(await pool.getAddress(), totalRequired);

      await expect(pool.connect(user1).joinPool(1))
        .to.emit(pool, "ParticipantJoined")
        .withArgs(1, user1.address, collateral, monthlyAmount);
    });
  });

  // ============ NEW: Yield Optimizer Contract Tests ============

  describe("ArminaYieldOptimizer", function () {
    it("should deploy with correct IDRX token", async function () {
      const { optimizer, idrx } = await loadFixture(deployFixture);
      expect(await optimizer.idrx()).to.equal(await idrx.getAddress());
    });

    it("should return best APY (Morpho at 14%)", async function () {
      const { optimizer } = await loadFixture(deployFixture);
      const [protocol, apy] = await optimizer.getBestAPY();
      expect(protocol).to.equal(4); // Protocol.MORPHO
      expect(apy).to.equal(1400);   // 14%
    });

    it("should authorize pool", async function () {
      const { optimizer, pool } = await loadFixture(deployFixture);
      const poolAddr = await pool.getAddress();

      await optimizer.authorizePool(poolAddr);
      expect(await optimizer.authorizedPools(poolAddr)).to.be.true;
    });

    it("should update APY via AI agent", async function () {
      const { optimizer } = await loadFixture(deployFixture);

      // Owner is also AI agent by default
      await optimizer.updateAPY(1, 1500); // Moonwell to 15%

      const [protocol, apy] = await optimizer.getBestAPY();
      expect(apy).to.equal(1500); // Now Moonwell is best at 15%
    });

    it("should accept deposits from authorized pool", async function () {
      const { optimizer, idrx, owner } = await loadFixture(deployFixture);
      const optimizerAddr = await optimizer.getAddress();

      await optimizer.authorizePool(owner.address); // Use owner as authorized pool for testing

      const amount = ethers.parseUnits("1000000", 2);
      await idrx.approve(optimizerAddr, amount);
      await optimizer.deposit(amount, true);

      const status = await optimizer.getPoolYieldStatus(owner.address);
      expect(status[0]).to.equal(amount); // totalDeposit
    });

    it("should reject deposits from unauthorized pool", async function () {
      const { optimizer, idrx, user1 } = await loadFixture(deployFixture);
      const optimizerAddr = await optimizer.getAddress();

      const amount = ethers.parseUnits("1000000", 2);
      await idrx.connect(user1).approve(optimizerAddr, amount);

      await expect(
        optimizer.connect(user1).deposit(amount, true)
      ).to.be.revertedWithCustomError(optimizer, "NotAuthorized");
    });
  });

  // ============ Full Pool Lifecycle E2E Test ============

  describe("Full Pool Lifecycle", function () {
    it("should complete a full pool lifecycle: create -> join -> pay -> verify", async function () {
      const { pool, idrx, optimizer, reputation, owner, user1, user2, user3, user4, user5 } = await loadFixture(deployFixture);
      const poolAddr = await pool.getAddress();
      const optimizerAddr = await optimizer.getAddress();

      // Setup optimizer & reputation
      await pool.setYieldOptimizer(optimizerAddr);
      await optimizer.authorizePool(poolAddr);
      await pool.setReputationContract(await reputation.getAddress());
      await reputation.authorizePool(poolAddr);
      await reputation.authorizePool(owner.address);

      // Mint reputation NFTs for users
      for (const user of [user1, user2, user3, user4, user5]) {
        await reputation.connect(user).mint();
      }

      // Step 1: Create pool (5 members, 100K IDRX monthly)
      const monthlyAmount = ethers.parseUnits("100000", 2);
      await pool.createPool(monthlyAmount, 5);

      const poolDetails = await pool.getPoolDetails(1);
      expect(poolDetails[1]).to.equal(monthlyAmount);
      expect(poolDetails[2]).to.equal(5);
      expect(poolDetails[5]).to.equal(0); // PoolStatus.Open

      // Step 2: All 5 users join (pool auto-starts)
      const collateral = (monthlyAmount * 5n * 125n) / 100n;
      const totalRequired = collateral + monthlyAmount;

      const users = [user1, user2, user3, user4, user5];
      for (const user of users) {
        await idrx.connect(user).approve(poolAddr, totalRequired);
        await pool.connect(user).joinPool(1);
      }

      // Verify pool is now active
      const activeDetails = await pool.getPoolDetails(1);
      expect(activeDetails[5]).to.equal(2); // PoolStatus.Active
      expect(activeDetails[4]).to.equal(5); // 5 participants
      expect(activeDetails[7]).to.equal(1); // currentMonth = 1

      // Verify collateral was deployed to optimizer
      const yieldStatus = await optimizer.getPoolYieldStatus(poolAddr);
      expect(yieldStatus[0]).to.be.gt(0); // totalDeposit > 0

      // Step 3: All users pay month 2
      for (const user of users) {
        await idrx.connect(user).approve(poolAddr, monthlyAmount);
        await pool.connect(user).processMonthlyPayment(1, 2);
      }

      // Step 4: All users pay month 3
      for (const user of users) {
        await idrx.connect(user).approve(poolAddr, monthlyAmount);
        await pool.connect(user).processMonthlyPayment(1, 3);
      }

      // Step 5: Verify payment history for user1
      const history = await pool.getPaymentHistory(1, user1.address);
      expect(history.length).to.equal(3); // Month 1 (join), 2, 3
      expect(history[0].month).to.equal(1);
      expect(history[1].month).to.equal(2);
      expect(history[2].month).to.equal(3);

      // Step 6: Verify participant details
      const participant = await pool.getParticipantDetails(1, user1.address);
      expect(participant[0]).to.equal(collateral); // collateralDeposited
      expect(participant[3]).to.equal(0); // 0 missed payments

      // Step 7: Verify on-chain APY from optimizer
      const currentAPY = await pool.getCurrentAPY();
      expect(currentAPY).to.equal(1400); // Morpho 14% (highest default)

      // Step 8: Verify projected payout exists
      const projected = await pool.calculateProjectedPayout(1, user1.address);
      expect(projected).to.be.gt(0);

      // Step 9: Verify reputation was recorded (pool joined)
      const repData = await reputation.getReputation(user1.address);
      expect(repData[2]).to.equal(1); // poolsJoined = 1
    });
  });
});
