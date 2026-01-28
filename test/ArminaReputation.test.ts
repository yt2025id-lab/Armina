const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ArminaReputation", function () {
  let reputation: any;
  let owner: any, user1: any, user2: any, pool: any;

  beforeEach(async function () {
    [owner, user1, user2, pool] = await ethers.getSigners();
    const Reputation = await ethers.getContractFactory("ArminaReputation");
    reputation = await Reputation.deploy();
    await reputation.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set correct name and symbol", async function () {
      expect(await reputation.name()).to.equal("Armina Reputation");
      expect(await reputation.symbol()).to.equal("AREP");
    });

    it("Should set deployer as owner", async function () {
      expect(await reputation.owner()).to.equal(owner.address);
    });

    it("Should have correct constants", async function () {
      expect(await reputation.ON_TIME_PAYMENT_SCORE()).to.equal(10);
      expect(await reputation.LATE_PAYMENT_PENALTY()).to.equal(20);
      expect(await reputation.DEFAULT_PENALTY()).to.equal(100);
      expect(await reputation.POOL_COMPLETED_SCORE()).to.equal(50);
      expect(await reputation.SILVER_THRESHOLD()).to.equal(100);
      expect(await reputation.GOLD_THRESHOLD()).to.equal(300);
      expect(await reputation.DIAMOND_THRESHOLD()).to.equal(500);
    });
  });

  describe("Minting", function () {
    it("Should mint a reputation NFT", async function () {
      await expect(reputation.connect(user1).mint())
        .to.emit(reputation, "ReputationMinted")
        .withArgs(user1.address, 0);
      expect(await reputation.balanceOf(user1.address)).to.equal(1);
      expect(await reputation.hasReputation(user1.address)).to.be.true;
    });

    it("Should revert if already has reputation", async function () {
      await reputation.connect(user1).mint();
      await expect(reputation.connect(user1).mint())
        .to.be.revertedWithCustomError(reputation, "AlreadyHasReputation");
    });

    it("Should initialize reputation data to zero", async function () {
      await reputation.connect(user1).mint();
      const data = await reputation.getReputation(user1.address);
      expect(data.score).to.equal(0);
      expect(data.totalPoolsCompleted).to.equal(0);
      expect(data.onTimePayments).to.equal(0);
    });
  });

  describe("Soulbound", function () {
    it("Should revert on approve", async function () {
      await expect(
        reputation.connect(user1).approve(user2.address, 0)
      ).to.be.revertedWithCustomError(reputation, "SoulboundTransfer");
    });

    it("Should revert on setApprovalForAll", async function () {
      await expect(
        reputation.connect(user1).setApprovalForAll(user2.address, true)
      ).to.be.revertedWithCustomError(reputation, "SoulboundTransfer");
    });

    it("Should revert on transfer", async function () {
      await reputation.connect(user1).mint();
      await expect(
        reputation.connect(user1).transferFrom(user1.address, user2.address, 0)
      ).to.be.revertedWithCustomError(reputation, "SoulboundTransfer");
    });
  });

  describe("Pool Authorization", function () {
    it("Should authorize pool", async function () {
      await expect(reputation.authorizePool(pool.address))
        .to.emit(reputation, "PoolAuthorized")
        .withArgs(pool.address);
      expect(await reputation.authorizedPools(pool.address)).to.be.true;
    });

    it("Should deauthorize pool", async function () {
      await reputation.authorizePool(pool.address);
      await expect(reputation.deauthorizePool(pool.address))
        .to.emit(reputation, "PoolDeauthorized");
      expect(await reputation.authorizedPools(pool.address)).to.be.false;
    });

    it("Should revert if non-owner authorizes", async function () {
      await expect(reputation.connect(user1).authorizePool(pool.address))
        .to.be.revertedWithCustomError(reputation, "OwnableUnauthorizedAccount");
    });
  });

  describe("Score Recording", function () {
    beforeEach(async function () {
      await reputation.connect(user1).mint();
      await reputation.authorizePool(pool.address);
    });

    it("Should record on-time payment (+10)", async function () {
      await reputation.connect(pool).recordOnTimePayment(user1.address);
      const data = await reputation.getReputation(user1.address);
      expect(data.score).to.equal(10);
      expect(data.onTimePayments).to.equal(1);
    });

    it("Should record late payment (-20)", async function () {
      for (let i = 0; i < 3; i++) {
        await reputation.connect(pool).recordOnTimePayment(user1.address);
      }
      await reputation.connect(pool).recordLatePayment(user1.address);
      const data = await reputation.getReputation(user1.address);
      expect(data.score).to.equal(10);
      expect(data.latePayments).to.equal(1);
    });

    it("Should not underflow score on penalty", async function () {
      await reputation.connect(pool).recordLatePayment(user1.address);
      const data = await reputation.getReputation(user1.address);
      expect(data.score).to.equal(0);
    });

    it("Should record default (-100)", async function () {
      await reputation.connect(pool).recordDefault(user1.address);
      const data = await reputation.getReputation(user1.address);
      expect(data.score).to.equal(0);
      expect(data.defaults).to.equal(1);
    });

    it("Should record pool completed (+50)", async function () {
      await reputation.connect(pool).recordPoolCompleted(user1.address);
      const data = await reputation.getReputation(user1.address);
      expect(data.score).to.equal(50);
      expect(data.totalPoolsCompleted).to.equal(1);
    });

    it("Should record pool joined", async function () {
      await reputation.connect(pool).recordPoolJoined(user1.address);
      const data = await reputation.getReputation(user1.address);
      expect(data.totalPoolsJoined).to.equal(1);
    });

    it("Should revert if unauthorized pool", async function () {
      await expect(
        reputation.connect(user2).recordOnTimePayment(user1.address)
      ).to.be.revertedWithCustomError(reputation, "NotAuthorizedPool");
    });

    it("Should revert if user has no reputation", async function () {
      await expect(
        reputation.connect(pool).recordOnTimePayment(user2.address)
      ).to.be.revertedWithCustomError(reputation, "NoReputationToken");
    });
  });

  describe("Levels & Discounts", function () {
    beforeEach(async function () {
      await reputation.connect(user1).mint();
      await reputation.authorizePool(pool.address);
    });

    it("Should return Bronze (0) for new user", async function () {
      expect(await reputation.getLevel(user1.address)).to.equal(0);
      expect(await reputation.getCollateralDiscount(user1.address)).to.equal(0);
    });

    it("Should return Silver (1) at score 100", async function () {
      for (let i = 0; i < 10; i++) {
        await reputation.connect(pool).recordOnTimePayment(user1.address);
      }
      expect(await reputation.getLevel(user1.address)).to.equal(1);
      expect(await reputation.getCollateralDiscount(user1.address)).to.equal(10);
    });

    it("Should return Gold (2) at score 300", async function () {
      for (let i = 0; i < 6; i++) {
        await reputation.connect(pool).recordPoolCompleted(user1.address);
      }
      expect(await reputation.getLevel(user1.address)).to.equal(2);
      expect(await reputation.getCollateralDiscount(user1.address)).to.equal(20);
    });

    it("Should return Diamond (3) at score 500", async function () {
      for (let i = 0; i < 10; i++) {
        await reputation.connect(pool).recordPoolCompleted(user1.address);
      }
      expect(await reputation.getLevel(user1.address)).to.equal(3);
      expect(await reputation.getCollateralDiscount(user1.address)).to.equal(25);
    });

    it("Should return 0 for user without reputation", async function () {
      expect(await reputation.getLevel(user2.address)).to.equal(0);
      expect(await reputation.getCollateralDiscount(user2.address)).to.equal(0);
    });
  });
});
