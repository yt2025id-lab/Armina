const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("ArminaPool", function () {
  // Deploy fixture
  async function deployFixture() {
    const [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();

    // Deploy IDRX token
    const IDRX = await ethers.getContractFactory("IDRX");
    const initialSupply = ethers.parseUnits("1000000000", 18); // 1B
    const idrx = await IDRX.deploy(initialSupply);
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

    // Distribute IDRX to users for testing
    const distributionAmount = ethers.parseUnits("100000000", 18); // 100M each
    for (const user of [user1, user2, user3, user4, user5]) {
      await idrx.transfer(user.address, distributionAmount);
    }

    return { idrx, pool, owner, user1, user2, user3, user4, user5 };
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
      const faucetAmount = ethers.parseUnits("10000", 18);
      expect(balanceAfter - balanceBefore).to.equal(faucetAmount);
    });

    it("should have 18 decimals", async function () {
      const { idrx } = await loadFixture(deployFixture);
      expect(await idrx.decimals()).to.equal(18);
    });
  });

  describe("Pool Creation", function () {
    it("should create a pool with valid parameters", async function () {
      const { pool } = await loadFixture(deployFixture);
      const monthlyAmount = ethers.parseUnits("500000", 18);

      const tx = await pool.createPool(monthlyAmount, 5);
      await tx.wait();

      const counter = await pool.poolCounter();
      expect(counter).to.equal(1);
    });

    it("should emit PoolCreated event", async function () {
      const { pool, owner } = await loadFixture(deployFixture);
      const monthlyAmount = ethers.parseUnits("500000", 18);
      const poolSize = 5;
      const expectedCollateral = (monthlyAmount * BigInt(poolSize) * 125n) / 100n;

      await expect(pool.createPool(monthlyAmount, poolSize))
        .to.emit(pool, "PoolCreated")
        .withArgs(1, owner.address, monthlyAmount, poolSize, expectedCollateral);
    });

    it("should reject invalid pool size", async function () {
      const { pool } = await loadFixture(deployFixture);
      const monthlyAmount = ethers.parseUnits("500000", 18);

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
      const monthlyAmount = ethers.parseUnits("100000", 18);

      await pool.createPool(monthlyAmount, 10);
      const details = await pool.getPoolDetails(1);

      const expected = (monthlyAmount * 10n * 125n) / 100n;
      expect(details[3]).to.equal(expected);
    });

    it("should allow multiple pool creation", async function () {
      const { pool } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("100000", 18);

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

      const monthlyAmount = ethers.parseUnits("100000", 18);
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

      const monthlyAmount = ethers.parseUnits("100000", 18);
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
      const monthlyAmount = ethers.parseUnits("500000", 18);

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
      const monthlyAmount = ethers.parseUnits("100000", 18);

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
      const monthlyAmount = ethers.parseUnits("100000", 18);

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
      const monthlyAmount = ethers.parseUnits("100000", 18);

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
});
