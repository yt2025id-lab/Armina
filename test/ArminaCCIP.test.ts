const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("ArminaCCIP — Cross-Chain Pool Joining", function () {
  // Ethereum Sepolia chain selector
  const ETH_SEPOLIA_SELECTOR = BigInt("16015286601757825753");

  async function deployFixture() {
    const [owner, user1, user2, sender1] = await ethers.getSigners();

    // Deploy IDRX
    const IDRX = await ethers.getContractFactory("IDRX");
    const idrx = await IDRX.deploy();

    // Deploy mock VRF coordinator
    const VRFMock = await ethers.getContractFactory("VRFCoordinatorV2_5Mock");
    const vrfMock = await VRFMock.deploy();
    await vrfMock.createSubscription();
    const subId = 1;
    await vrfMock.fundSubscription(subId, ethers.parseEther("10"));

    // Deploy ArminaPool
    const ArminaPool = await ethers.getContractFactory("ArminaPool");
    const pool = await ArminaPool.deploy(
      await idrx.getAddress(),
      await vrfMock.getAddress(),
      subId,
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc"
    );
    await vrfMock.addConsumer(subId, await pool.getAddress());

    // Deploy MockCCIPRouter
    const MockRouter = await ethers.getContractFactory("MockCCIPRouter");
    const router = await MockRouter.deploy();

    // Deploy ArminaCCIP
    const ArminaCCIP = await ethers.getContractFactory("ArminaCCIP");
    const ccip = await ArminaCCIP.deploy(
      await router.getAddress(),
      await pool.getAddress(),
      await idrx.getAddress()
    );

    // Link: set CCIP contract on pool
    await pool.setCCIPContract(await ccip.getAddress());

    // Allow Ethereum Sepolia chain + sender
    await ccip.allowSourceChain(ETH_SEPOLIA_SELECTOR, true);
    await ccip.allowSender(ETH_SEPOLIA_SELECTOR, sender1.address, true);

    // Fund CCIP contract with IDRX (simulates bridged tokens)
    await idrx.faucet(); // owner gets 500K
    await idrx.transfer(await ccip.getAddress(), ethers.parseUnits("200000", 2));

    // Fund users
    await idrx.connect(user1).faucet();
    await idrx.connect(user2).faucet();

    return { owner, user1, user2, sender1, idrx, pool, vrfMock, router, ccip };
  }

  // ============ Deployment ============

  describe("Deployment", function () {
    it("should deploy with correct router, pool, and token addresses", async function () {
      const { ccip, router, pool, idrx } = await loadFixture(deployFixture);
      expect(await ccip.getRouter()).to.equal(await router.getAddress());
      expect(await ccip.arminaPool()).to.equal(await pool.getAddress());
      expect(await ccip.idrxToken()).to.equal(await idrx.getAddress());
    });

    it("should return the router address via getRouter()", async function () {
      const { ccip, router } = await loadFixture(deployFixture);
      expect(await ccip.getRouter()).to.equal(await router.getAddress());
    });
  });

  // ============ Source Chain Management ============

  describe("Source Chain Management", function () {
    it("should allow source chain (only owner)", async function () {
      const { ccip, user1 } = await loadFixture(deployFixture);
      await expect(
        ccip.connect(user1).allowSourceChain(ETH_SEPOLIA_SELECTOR, true)
      ).to.be.revertedWithCustomError(ccip, "OwnableUnauthorizedAccount");
    });

    it("should emit SourceChainAllowed event", async function () {
      const { ccip } = await loadFixture(deployFixture);
      const arbitrumSelector = BigInt("3478487238524512106");
      await expect(ccip.allowSourceChain(arbitrumSelector, true))
        .to.emit(ccip, "SourceChainAllowed")
        .withArgs(arbitrumSelector, true);
    });

    it("should disallow source chain", async function () {
      const { ccip } = await loadFixture(deployFixture);
      await ccip.allowSourceChain(ETH_SEPOLIA_SELECTOR, false);
      expect(await ccip.allowedSourceChains(ETH_SEPOLIA_SELECTOR)).to.equal(false);
    });
  });

  // ============ Sender Management ============

  describe("Sender Management", function () {
    it("should allow sender for a chain (only owner)", async function () {
      const { ccip, user1 } = await loadFixture(deployFixture);
      await expect(
        ccip.connect(user1).allowSender(ETH_SEPOLIA_SELECTOR, user1.address, true)
      ).to.be.revertedWithCustomError(ccip, "OwnableUnauthorizedAccount");
    });

    it("should emit SenderAllowed event", async function () {
      const { ccip, user2 } = await loadFixture(deployFixture);
      await expect(ccip.allowSender(ETH_SEPOLIA_SELECTOR, user2.address, true))
        .to.emit(ccip, "SenderAllowed")
        .withArgs(ETH_SEPOLIA_SELECTOR, user2.address, true);
    });
  });

  // ============ Cross-Chain Join Reception ============

  describe("Cross-Chain Join Reception", function () {
    it("should receive and process CCIP message for pool join", async function () {
      const { pool, ccip, router, idrx, user1, user2, sender1 } = await loadFixture(deployFixture);

      // Create a pool
      const monthlyAmount = ethers.parseUnits("10000", 2);
      await pool.connect(user1).createPool(monthlyAmount, 5);

      // user1 joins normally
      const collateral = monthlyAmount * BigInt(5) * BigInt(125) / BigInt(100);
      const totalRequired = collateral + monthlyAmount;
      await idrx.connect(user1).approve(await pool.getAddress(), totalRequired);
      await pool.connect(user1).joinPool(1);

      // user2 joins via CCIP
      const messageId = ethers.keccak256(ethers.toUtf8Bytes("test-message-1"));
      const data = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "address", "uint256"],
        [1, user2.address, totalRequired]
      );

      await router.simulateReceive(
        await ccip.getAddress(),
        messageId,
        ETH_SEPOLIA_SELECTOR,
        sender1.address,
        data,
        [] // no token amounts in this test
      );

      // Verify participant joined
      const participant = await pool.participants(1, user2.address);
      expect(participant.hasJoined).to.equal(true);
      expect(await ccip.totalCrossChainJoins()).to.equal(1);
    });

    it("should reject message from disallowed source chain", async function () {
      const { ccip, router, sender1 } = await loadFixture(deployFixture);

      const badChainSelector = BigInt("99999999999");
      const messageId = ethers.keccak256(ethers.toUtf8Bytes("bad-chain"));
      const data = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "address", "uint256"],
        [1, sender1.address, 1000]
      );

      await expect(
        router.simulateReceive(
          await ccip.getAddress(),
          messageId,
          badChainSelector,
          sender1.address,
          data,
          []
        )
      ).to.be.revertedWithCustomError(ccip, "SourceChainNotAllowed");
    });

    it("should reject message from disallowed sender", async function () {
      const { ccip, router, user2 } = await loadFixture(deployFixture);

      const messageId = ethers.keccak256(ethers.toUtf8Bytes("bad-sender"));
      const data = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "address", "uint256"],
        [1, user2.address, 1000]
      );

      // user2 is not an allowed sender
      await expect(
        router.simulateReceive(
          await ccip.getAddress(),
          messageId,
          ETH_SEPOLIA_SELECTOR,
          user2.address,
          data,
          []
        )
      ).to.be.revertedWithCustomError(ccip, "SenderNotAllowed");
    });

    it("should reject message from non-router caller", async function () {
      const { ccip, user1 } = await loadFixture(deployFixture);

      // Try to call ccipReceive directly (not from router)
      const message = {
        messageId: ethers.keccak256(ethers.toUtf8Bytes("direct")),
        sourceChainSelector: ETH_SEPOLIA_SELECTOR,
        sender: ethers.AbiCoder.defaultAbiCoder().encode(["address"], [user1.address]),
        data: "0x",
        destTokenAmounts: [],
      };

      await expect(
        ccip.connect(user1).ccipReceive(message)
      ).to.be.revertedWith("Invalid CCIP router");
    });

    it("should track cross-chain join details", async function () {
      const { pool, ccip, router, idrx, user1, user2, sender1 } = await loadFixture(deployFixture);

      const monthlyAmount = ethers.parseUnits("10000", 2);
      await pool.connect(user1).createPool(monthlyAmount, 5);
      const collateral = monthlyAmount * BigInt(5) * BigInt(125) / BigInt(100);
      const totalRequired = collateral + monthlyAmount;
      await idrx.connect(user1).approve(await pool.getAddress(), totalRequired);
      await pool.connect(user1).joinPool(1);

      const messageId = ethers.keccak256(ethers.toUtf8Bytes("tracking-test"));
      const data = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "address", "uint256"],
        [1, user2.address, totalRequired]
      );

      await router.simulateReceive(
        await ccip.getAddress(),
        messageId,
        ETH_SEPOLIA_SELECTOR,
        sender1.address,
        data,
        []
      );

      const join = await ccip.getCrossChainJoin(messageId);
      expect(join.messageId).to.equal(messageId);
      expect(join.sourceChain).to.equal(ETH_SEPOLIA_SELECTOR);
      expect(join.participant).to.equal(user2.address);
      expect(join.poolId).to.equal(1);
      expect(join.processed).to.equal(true);
    });
  });

  // ============ View Functions ============

  describe("View Functions", function () {
    it("should return total join messages count", async function () {
      const { ccip } = await loadFixture(deployFixture);
      expect(await ccip.getTotalJoinMessages()).to.equal(0);
    });
  });

  // ============ Emergency Recovery ============

  describe("Emergency Recovery", function () {
    it("should recover tokens (only owner)", async function () {
      const { ccip, idrx, owner, user1 } = await loadFixture(deployFixture);

      const ccipBalance = await idrx.balanceOf(await ccip.getAddress());
      expect(ccipBalance).to.be.gt(0);

      await ccip.recoverTokens(await idrx.getAddress(), ccipBalance);

      expect(await idrx.balanceOf(await ccip.getAddress())).to.equal(0);
    });

    it("should reject non-owner token recovery", async function () {
      const { ccip, idrx, user1 } = await loadFixture(deployFixture);
      await expect(
        ccip.connect(user1).recoverTokens(await idrx.getAddress(), 100)
      ).to.be.revertedWithCustomError(ccip, "OwnableUnauthorizedAccount");
    });
  });
});
