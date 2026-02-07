// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title IArminaYieldOptimizer
 * @notice Interface for the yield optimizer contract
 */
interface IArminaYieldOptimizer {
    function deposit(uint256 amount, bool isCollateral) external;
    function withdraw(uint256 amount) external returns (uint256 totalWithdrawn);
    function getPoolYieldStatus(address pool) external view returns (
        uint256 totalDeposit,
        uint256 currentYield,
        uint8 currentProtocol,
        uint256 currentAPY,
        uint256 lastRebalance
    );
    function getAccruedYield(address pool) external view returns (uint256);
    function getBestAPY() external view returns (uint8 protocol, uint256 apy);
}

/**
 * @title IArminaReputation
 * @notice Interface for the reputation NFT contract
 */
interface IArminaReputation {
    function getCollateralDiscount(address user) external view returns (uint8);
    function hasReputation(address user) external view returns (bool);
    function recordOnTimePayment(address user) external;
    function recordLatePayment(address user) external;
    function recordPoolJoined(address user) external;
    function recordPoolCompleted(address user) external;
}

/**
 * @title ArminaPool
 * @notice Decentralized Arisan (ROSCA) with AI-optimized yield generation
 * @dev Integrates with ArminaYieldOptimizer for real yield and ArminaReputation for collateral discounts
 */
contract ArminaPool is ReentrancyGuard, Ownable, VRFConsumerBaseV2 {
    // ============ State Variables ============

    IERC20 public immutable idrxToken;
    VRFCoordinatorV2Interface public immutable vrfCoordinator;

    uint64 public subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit = 100000;
    uint16 public requestConfirmations = 3;

    uint256 public poolCounter;
    uint256 public constant PENALTY_RATE = 10; // 10% penalty per missed payment
    uint256 public constant PLATFORM_FEE = 10; // 10% of yield

    // External contract integrations
    IArminaYieldOptimizer public yieldOptimizer;
    IArminaReputation public reputationContract;

    // Chainlink Data Feed (ETH/USD price oracle)
    AggregatorV3Interface public priceFeed;

    // Chainlink Automation contract (authorized to trigger draws)
    address public automationContract;

    // ============ Structs ============

    enum PoolStatus { Open, Full, Active, Completed, Cancelled }
    enum PaymentSource { Wallet, Collateral }

    struct Pool {
        uint256 id;
        uint256 monthlyAmount; // in IDRX wei
        uint8 poolSize; // 5, 10, 15, or 20
        uint256 collateralRequired; // 125% x (poolSize x monthlyAmount)
        uint8 currentParticipants;
        PoolStatus status;
        uint8 drawingDay; // Day of month (e.g., 10)
        uint256 startDate;
        uint8 currentMonth; // 1 to poolSize
        address creator;
        mapping(uint256 => address) winners; // month => winner address
        mapping(address => bool) hasWon;
    }

    struct Participant {
        address userAddress;
        uint256 collateralDeposited;
        uint256 collateralYieldEarned;
        uint256 collateralUsedForPayments;
        uint8 missedPayments;
        uint256 totalPenalties;
        bool hasWon;
        uint8 wonAtMonth;
        uint256 potReceived;
        uint256 potYieldReceived;
        bool hasJoined;
        uint256 joinedAt;
    }

    struct Payment {
        uint8 month;
        uint256 amount;
        PaymentSource source;
        uint256 penaltyApplied;
        uint256 timestamp;
    }

    // ============ Mappings ============

    mapping(uint256 => Pool) public pools;
    mapping(uint256 => mapping(address => Participant)) public participants;
    mapping(uint256 => mapping(address => Payment[])) public paymentHistory;
    mapping(uint256 => address[]) public poolParticipants;
    mapping(uint256 => uint256) public vrfRequestToPoolId;

    // Yield optimizer integration
    mapping(uint256 => uint256) public poolCollateralYield; // Total yield for pool's collateral
    mapping(uint256 => uint256) public poolPotYield; // Total yield for pool's pot

    // ============ Events ============

    event PoolCreated(
        uint256 indexed poolId,
        address indexed creator,
        uint256 monthlyAmount,
        uint8 poolSize,
        uint256 collateralRequired
    );

    event ParticipantJoined(
        uint256 indexed poolId,
        address indexed participant,
        uint256 collateralPaid,
        uint256 firstPayment
    );

    event PoolStarted(uint256 indexed poolId, uint256 startDate);

    event PaymentProcessed(
        uint256 indexed poolId,
        address indexed participant,
        uint8 month,
        uint256 amount,
        PaymentSource source,
        uint256 penalty
    );

    event WinnerDrawn(
        uint256 indexed poolId,
        uint8 month,
        address indexed winner,
        uint256 potAmount,
        uint256 potYield
    );

    event FinalSettlement(
        uint256 indexed poolId,
        address indexed participant,
        uint256 finalPayout
    );

    event YieldUpdated(
        uint256 indexed poolId,
        uint256 collateralYield,
        uint256 potYield
    );

    event YieldOptimizerUpdated(address indexed optimizer);
    event ReputationContractUpdated(address indexed reputation);
    event SubscriptionIdUpdated(uint64 newSubscriptionId);
    event PriceFeedUpdated(address indexed feed);
    event AutomationContractUpdated(address indexed automation);

    // ============ Errors ============

    error InvalidPoolSize();
    error InvalidMonthlyAmount();
    error PoolNotOpen();
    error PoolNotActive();
    error AlreadyJoined();
    error InsufficientPayment();
    error PaymentAlreadyProcessed();
    error NotParticipant();
    error PoolNotCompleted();
    error NoEligibleParticipants();

    // ============ Constructor ============

    constructor(
        address _idrxToken,
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash
    ) VRFConsumerBaseV2(_vrfCoordinator) Ownable(msg.sender) {
        idrxToken = IERC20(_idrxToken);
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
    }

    // ============ Admin Setters ============

    /**
     * @notice Set the yield optimizer contract address
     * @param _optimizer Address of ArminaYieldOptimizer
     */
    function setYieldOptimizer(address _optimizer) external onlyOwner {
        yieldOptimizer = IArminaYieldOptimizer(_optimizer);
        emit YieldOptimizerUpdated(_optimizer);
    }

    /**
     * @notice Set the reputation contract address
     * @param _reputation Address of ArminaReputation
     */
    function setReputationContract(address _reputation) external onlyOwner {
        reputationContract = IArminaReputation(_reputation);
        emit ReputationContractUpdated(_reputation);
    }

    /**
     * @notice Update VRF subscription ID without redeployment
     * @param _subscriptionId New Chainlink VRF subscription ID
     */
    function setSubscriptionId(uint64 _subscriptionId) external onlyOwner {
        subscriptionId = _subscriptionId;
        emit SubscriptionIdUpdated(_subscriptionId);
    }

    /**
     * @notice Set the Chainlink Data Feed for ETH/USD price oracle
     * @param _feed Address of AggregatorV3Interface price feed
     */
    function setPriceFeed(address _feed) external onlyOwner {
        priceFeed = AggregatorV3Interface(_feed);
        emit PriceFeedUpdated(_feed);
    }

    /**
     * @notice Set the Chainlink Automation contract authorized to trigger draws
     * @param _automation Address of ArminaAutomation contract
     */
    function setAutomationContract(address _automation) external onlyOwner {
        automationContract = _automation;
        emit AutomationContractUpdated(_automation);
    }

    // ============ Pool Management Functions ============

    /**
     * @notice Create a new arisan pool
     * @param monthlyAmount Monthly contribution amount in IDRX wei
     * @param poolSize Number of participants (5, 10, 15, or 20)
     */
    function createPool(
        uint256 monthlyAmount,
        uint8 poolSize
    ) external returns (uint256) {
        if (poolSize != 5 && poolSize != 10 && poolSize != 15 && poolSize != 20) {
            revert InvalidPoolSize();
        }
        if (monthlyAmount == 0) {
            revert InvalidMonthlyAmount();
        }

        uint256 poolId = ++poolCounter;
        Pool storage pool = pools[poolId];

        pool.id = poolId;
        pool.monthlyAmount = monthlyAmount;
        pool.poolSize = poolSize;
        pool.collateralRequired = (monthlyAmount * poolSize * 125) / 100; // 125%
        pool.currentParticipants = 0;
        pool.status = PoolStatus.Open;
        pool.drawingDay = 10; // Default to 10th of month
        pool.currentMonth = 0;
        pool.creator = msg.sender;

        emit PoolCreated(poolId, msg.sender, monthlyAmount, poolSize, pool.collateralRequired);

        return poolId;
    }

    /**
     * @notice Join an existing pool with reputation-based collateral discount
     * @param poolId ID of the pool to join
     */
    function joinPool(uint256 poolId) external nonReentrant {
        Pool storage pool = pools[poolId];

        if (pool.status != PoolStatus.Open) {
            revert PoolNotOpen();
        }
        if (participants[poolId][msg.sender].hasJoined) {
            revert AlreadyJoined();
        }

        // Calculate collateral with reputation discount
        uint256 collateral = pool.collateralRequired;
        if (address(reputationContract) != address(0)) {
            uint8 discount = reputationContract.getCollateralDiscount(msg.sender);
            if (discount > 0) {
                collateral = collateral - (collateral * discount / 100);
            }
        }

        uint256 totalRequired = collateral + pool.monthlyAmount;

        // Transfer collateral + first month payment
        bool success = idrxToken.transferFrom(msg.sender, address(this), totalRequired);
        if (!success) {
            revert InsufficientPayment();
        }

        // Initialize participant
        Participant storage participant = participants[poolId][msg.sender];
        participant.userAddress = msg.sender;
        participant.collateralDeposited = collateral;
        participant.hasJoined = true;
        participant.joinedAt = block.timestamp;

        // Record first payment
        Payment memory firstPayment = Payment({
            month: 1,
            amount: pool.monthlyAmount,
            source: PaymentSource.Wallet,
            penaltyApplied: 0,
            timestamp: block.timestamp
        });
        paymentHistory[poolId][msg.sender].push(firstPayment);

        // Add to participants list
        poolParticipants[poolId].push(msg.sender);
        pool.currentParticipants++;

        // Record pool join in reputation (if user has reputation NFT)
        if (address(reputationContract) != address(0)) {
            if (reputationContract.hasReputation(msg.sender)) {
                try reputationContract.recordPoolJoined(msg.sender) {} catch {}
            }
        }

        emit ParticipantJoined(poolId, msg.sender, collateral, pool.monthlyAmount);

        // Check if pool is full
        if (pool.currentParticipants == pool.poolSize) {
            pool.status = PoolStatus.Full;
            _startPool(poolId);
        }
    }

    /**
     * @dev Internal function to start the pool and deploy collateral to yield optimizer
     */
    function _startPool(uint256 poolId) private {
        Pool storage pool = pools[poolId];
        pool.status = PoolStatus.Active;
        pool.startDate = block.timestamp;
        pool.currentMonth = 1;

        // Deploy total pool collateral to yield optimizer
        if (address(yieldOptimizer) != address(0)) {
            uint256 totalCollateral = 0;
            address[] storage allParticipants = poolParticipants[poolId];
            for (uint i = 0; i < allParticipants.length; i++) {
                totalCollateral += participants[poolId][allParticipants[i]].collateralDeposited;
            }

            if (totalCollateral > 0) {
                // Approve and deposit to yield optimizer
                idrxToken.approve(address(yieldOptimizer), totalCollateral);
                yieldOptimizer.deposit(totalCollateral, true);
            }
        }

        emit PoolStarted(poolId, pool.startDate);
    }

    // ============ Payment Processing Functions ============

    /**
     * @notice Process monthly payment for a participant
     * @param poolId ID of the pool
     * @param month Month number (2 to poolSize)
     */
    function processMonthlyPayment(
        uint256 poolId,
        uint8 month
    ) external nonReentrant {
        Pool storage pool = pools[poolId];
        Participant storage participant = participants[poolId][msg.sender];

        if (pool.status != PoolStatus.Active) {
            revert PoolNotActive();
        }
        if (!participant.hasJoined) {
            revert NotParticipant();
        }

        // Check if payment already made for this month
        Payment[] storage payments = paymentHistory[poolId][msg.sender];
        for (uint i = 0; i < payments.length; i++) {
            if (payments[i].month == month) {
                revert PaymentAlreadyProcessed();
            }
        }

        uint256 amount = pool.monthlyAmount;
        PaymentSource source;
        uint256 penalty = 0;

        // Try to deduct from wallet first
        bool walletSuccess = idrxToken.transferFrom(msg.sender, address(this), amount);

        if (walletSuccess) {
            source = PaymentSource.Wallet;

            // Record on-time payment in reputation
            if (address(reputationContract) != address(0)) {
                if (reputationContract.hasReputation(msg.sender)) {
                    try reputationContract.recordOnTimePayment(msg.sender) {} catch {}
                }
            }
        } else {
            // Wallet insufficient, use collateral
            source = PaymentSource.Collateral;
            participant.collateralUsedForPayments += amount;
            participant.missedPayments++;

            // Apply penalty
            penalty = (amount * PENALTY_RATE) / 100;
            participant.totalPenalties += penalty;

            // Record late payment in reputation
            if (address(reputationContract) != address(0)) {
                if (reputationContract.hasReputation(msg.sender)) {
                    try reputationContract.recordLatePayment(msg.sender) {} catch {}
                }
            }
        }

        // Record payment
        Payment memory payment = Payment({
            month: month,
            amount: amount,
            source: source,
            penaltyApplied: penalty,
            timestamp: block.timestamp
        });
        payments.push(payment);

        emit PaymentProcessed(poolId, msg.sender, month, amount, source, penalty);
    }

    /**
     * @notice Admin function to process all payments for a month
     * @param poolId ID of the pool
     * @param month Month number
     */
    function batchProcessPayments(
        uint256 poolId,
        uint8 month
    ) external onlyOwner {
        Pool storage pool = pools[poolId];
        address[] storage participants_ = poolParticipants[poolId];

        for (uint i = 0; i < participants_.length; i++) {
            address participantAddr = participants_[i];
            Participant storage participant = participants[poolId][participantAddr];

            // Skip if already paid
            Payment[] storage payments = paymentHistory[poolId][participantAddr];
            bool alreadyPaid = false;
            for (uint j = 0; j < payments.length; j++) {
                if (payments[j].month == month) {
                    alreadyPaid = true;
                    break;
                }
            }
            if (alreadyPaid) continue;

            uint256 amount = pool.monthlyAmount;
            PaymentSource source;
            uint256 penalty = 0;

            // Try wallet first
            bool walletSuccess = idrxToken.transferFrom(participantAddr, address(this), amount);

            if (walletSuccess) {
                source = PaymentSource.Wallet;

                // Record on-time payment in reputation
                if (address(reputationContract) != address(0)) {
                    if (reputationContract.hasReputation(participantAddr)) {
                        try reputationContract.recordOnTimePayment(participantAddr) {} catch {}
                    }
                }
            } else {
                // Use collateral
                source = PaymentSource.Collateral;
                participant.collateralUsedForPayments += amount;
                participant.missedPayments++;
                penalty = (amount * PENALTY_RATE) / 100;
                participant.totalPenalties += penalty;

                // Record late payment in reputation
                if (address(reputationContract) != address(0)) {
                    if (reputationContract.hasReputation(participantAddr)) {
                        try reputationContract.recordLatePayment(participantAddr) {} catch {}
                    }
                }
            }

            Payment memory payment = Payment({
                month: month,
                amount: amount,
                source: source,
                penaltyApplied: penalty,
                timestamp: block.timestamp
            });
            payments.push(payment);

            emit PaymentProcessed(poolId, participantAddr, month, amount, source, penalty);
        }
    }

    // ============ Winner Selection Functions ============

    /**
     * @notice Request random number from Chainlink VRF for winner selection
     * @param poolId ID of the pool
     */
    function requestWinnerDraw(uint256 poolId) external returns (uint256) {
        Pool storage pool = pools[poolId];

        if (pool.status != PoolStatus.Active) {
            revert PoolNotActive();
        }

        // Allow owner, pool creator, or automation contract to trigger draw
        require(
            msg.sender == owner() || msg.sender == pool.creator || msg.sender == automationContract,
            "Only owner, creator, or automation can draw"
        );

        uint256 requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            1 // numWords
        );

        vrfRequestToPoolId[requestId] = poolId;

        return requestId;
    }

    /**
     * @dev Callback function for Chainlink VRF
     */
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        uint256 poolId = vrfRequestToPoolId[requestId];
        Pool storage pool = pools[poolId];

        // Get eligible participants (who haven't won yet)
        address[] memory eligible = new address[](pool.poolSize);
        uint8 eligibleCount = 0;

        address[] storage allParticipants = poolParticipants[poolId];
        for (uint i = 0; i < allParticipants.length; i++) {
            if (!pool.hasWon[allParticipants[i]]) {
                eligible[eligibleCount] = allParticipants[i];
                eligibleCount++;
            }
        }

        if (eligibleCount == 0) revert NoEligibleParticipants();

        // Select winner
        uint256 winnerIndex = randomWords[0] % eligibleCount;
        address winner = eligible[winnerIndex];

        // Update winner status
        pool.winners[pool.currentMonth] = winner;
        pool.hasWon[winner] = true;

        Participant storage winnerParticipant = participants[poolId][winner];
        winnerParticipant.hasWon = true;
        winnerParticipant.wonAtMonth = pool.currentMonth;

        // Calculate pot and pot yield
        uint256 potAmount = pool.monthlyAmount * pool.poolSize;
        uint256 potYield = _calculatePotYieldForMonth(poolId, pool.currentMonth);

        winnerParticipant.potReceived = potAmount;
        winnerParticipant.potYieldReceived = potYield;

        // Transfer pot + pot yield to winner
        uint256 totalPayout = potAmount + potYield;
        uint256 platformFee = (potYield * PLATFORM_FEE) / 100;
        uint256 winnerPayout = totalPayout - platformFee;

        idrxToken.transfer(winner, winnerPayout);
        if (platformFee > 0) {
            idrxToken.transfer(owner(), platformFee);
        }

        // Update pool yield tracking
        poolPotYield[poolId] += potYield;
        emit YieldUpdated(poolId, poolCollateralYield[poolId], poolPotYield[poolId]);

        emit WinnerDrawn(poolId, pool.currentMonth, winner, potAmount, potYield);

        // Move to next month
        pool.currentMonth++;

        // Check if pool completed
        if (pool.currentMonth > pool.poolSize) {
            pool.status = PoolStatus.Completed;

            // Record pool completion in reputation for all participants
            if (address(reputationContract) != address(0)) {
                for (uint i = 0; i < allParticipants.length; i++) {
                    if (reputationContract.hasReputation(allParticipants[i])) {
                        try reputationContract.recordPoolCompleted(allParticipants[i]) {} catch {}
                    }
                }
            }
        }
    }

    // ============ Settlement Functions ============

    /**
     * @notice Claim final settlement after pool completion
     * @param poolId ID of the pool
     */
    function claimFinalSettlement(uint256 poolId) external nonReentrant {
        Pool storage pool = pools[poolId];
        Participant storage participant = participants[poolId][msg.sender];

        if (pool.status != PoolStatus.Completed) {
            revert PoolNotCompleted();
        }
        if (!participant.hasJoined) {
            revert NotParticipant();
        }

        // Calculate final payout
        uint256 finalPayout = _calculateFinalPayout(poolId, msg.sender);

        // If yield optimizer is set, withdraw collateral + yield from optimizer
        if (address(yieldOptimizer) != address(0)) {
            // The optimizer tracks pool-level deposits, individual claims
            // are handled by the pool contract's internal accounting
        }

        // Transfer final payout
        if (finalPayout > 0) {
            idrxToken.transfer(msg.sender, finalPayout);
        }

        emit FinalSettlement(poolId, msg.sender, finalPayout);
    }

    /**
     * @dev Calculate final payout for a participant
     * Formula: Collateral + Collateral Yield - Missed Payments - Penalties
     */
    function _calculateFinalPayout(
        uint256 poolId,
        address participantAddr
    ) private view returns (uint256) {
        Participant storage participant = participants[poolId][participantAddr];

        uint256 collateralYield = _calculateCollateralYield(poolId, participantAddr);

        uint256 total = participant.collateralDeposited + collateralYield;
        uint256 deductions = participant.collateralUsedForPayments + participant.totalPenalties;

        if (total > deductions) {
            return total - deductions;
        }
        return 0;
    }

    // ============ Yield Calculation Functions ============

    /**
     * @dev Calculate collateral yield for a participant
     * Uses actual yield from optimizer if available, falls back to estimated APY
     */
    function _calculateCollateralYield(
        uint256 poolId,
        address participantAddr
    ) private view returns (uint256) {
        Participant storage participant = participants[poolId][participantAddr];
        Pool storage pool = pools[poolId];

        // If yield optimizer is connected, use real yield data
        if (address(yieldOptimizer) != address(0)) {
            (,uint256 totalYield,,,) = yieldOptimizer.getPoolYieldStatus(address(this));

            if (totalYield > 0) {
                // Calculate this participant's proportional share of yield
                uint256 totalCollateral = 0;
                address[] storage allParticipants = poolParticipants[poolId];
                for (uint i = 0; i < allParticipants.length; i++) {
                    totalCollateral += participants[poolId][allParticipants[i]].collateralDeposited;
                }

                if (totalCollateral > 0) {
                    return (totalYield * participant.collateralDeposited) / totalCollateral;
                }
            }

            // If optimizer has no yield yet, estimate using best APY
            (, uint256 bestAPY) = yieldOptimizer.getBestAPY();
            if (bestAPY > 0) {
                return (participant.collateralDeposited * bestAPY * pool.poolSize) / (10000 * 12);
            }
        }

        // Fallback: estimate using live DeFi rates (12.5% default from DeFiLlama)
        return (participant.collateralDeposited * 1250 * pool.poolSize) / (10000 * 12);
    }

    /**
     * @dev Calculate pot yield for a specific month
     * Uses optimizer APY if available
     */
    function _calculatePotYieldForMonth(
        uint256 poolId,
        uint8 month
    ) private view returns (uint256) {
        Pool storage pool = pools[poolId];
        uint256 potAmount = pool.monthlyAmount * pool.poolSize;

        uint256 apy = 1250; // Default 12.5% in basis points

        // Use real APY from optimizer if available
        if (address(yieldOptimizer) != address(0)) {
            (, uint256 bestAPY) = yieldOptimizer.getBestAPY();
            if (bestAPY > 0) {
                apy = bestAPY;
            }
        }

        return (potAmount * apy * month) / (10000 * 12);
    }

    // ============ View Functions ============

    function getPoolDetails(uint256 poolId) external view returns (
        uint256 id,
        uint256 monthlyAmount,
        uint8 poolSize,
        uint256 collateralRequired,
        uint8 currentParticipants,
        PoolStatus status,
        uint256 startDate,
        uint8 currentMonth
    ) {
        Pool storage pool = pools[poolId];
        return (
            pool.id,
            pool.monthlyAmount,
            pool.poolSize,
            pool.collateralRequired,
            pool.currentParticipants,
            pool.status,
            pool.startDate,
            pool.currentMonth
        );
    }

    function getParticipantDetails(uint256 poolId, address participantAddr) external view returns (
        uint256 collateralDeposited,
        uint256 collateralYieldEarned,
        uint256 collateralUsedForPayments,
        uint8 missedPayments,
        uint256 totalPenalties,
        bool hasWon,
        uint256 potReceived
    ) {
        Participant storage participant = participants[poolId][participantAddr];
        uint256 yieldEarned = participant.collateralYieldEarned;

        // If optimizer is connected, show live estimated yield
        if (participant.hasJoined && address(yieldOptimizer) != address(0)) {
            yieldEarned = _calculateCollateralYield(poolId, participantAddr);
        }

        return (
            participant.collateralDeposited,
            yieldEarned,
            participant.collateralUsedForPayments,
            participant.missedPayments,
            participant.totalPenalties,
            participant.hasWon,
            participant.potReceived
        );
    }

    function getPaymentHistory(
        uint256 poolId,
        address participantAddr
    ) external view returns (Payment[] memory) {
        return paymentHistory[poolId][participantAddr];
    }

    function calculateProjectedPayout(
        uint256 poolId,
        address participantAddr
    ) external view returns (uint256) {
        return _calculateFinalPayout(poolId, participantAddr);
    }

    /**
     * @notice Get the current best APY from yield optimizer
     * @return apy The best APY in basis points (1250 = 12.5%)
     */
    function getCurrentAPY() external view returns (uint256 apy) {
        if (address(yieldOptimizer) != address(0)) {
            (, apy) = yieldOptimizer.getBestAPY();
            if (apy > 0) return apy;
        }
        return 1250; // Default 12.5%
    }

    /**
     * @notice Get the winner for a specific month in a pool
     */
    function getPoolWinner(uint256 poolId, uint8 month) external view returns (address) {
        return pools[poolId].winners[month];
    }

    /**
     * @notice Get collateral discount for a user from reputation
     */
    function getCollateralDiscountForUser(address user) external view returns (uint8) {
        if (address(reputationContract) == address(0)) return 0;
        return reputationContract.getCollateralDiscount(user);
    }

    // ============ Chainlink Data Feed Functions ============

    /**
     * @notice Get latest ETH/USD price from Chainlink Data Feed
     * @return price The latest ETH/USD price (8 decimals)
     */
    function getLatestETHPrice() external view returns (int256 price) {
        if (address(priceFeed) == address(0)) return 0;
        (, price, , , ) = priceFeed.latestRoundData();
    }

    /**
     * @notice Get collateral value in USD using Chainlink price feed
     * @param poolId ID of the pool
     * @param participant Address of the participant
     * @return idrxAmount Collateral in IDRX
     * @return ethUsdPrice Current ETH/USD price
     * @return usdValue Estimated USD value (IDRX pegged ~1 IDR, 1 USD ≈ 16,000 IDR)
     */
    function getCollateralValueUSD(uint256 poolId, address participant)
        external view returns (uint256 idrxAmount, int256 ethUsdPrice, uint256 usdValue)
    {
        idrxAmount = participants[poolId][participant].collateralDeposited;

        if (address(priceFeed) != address(0)) {
            (, ethUsdPrice, , , ) = priceFeed.latestRoundData();
        }

        // IDRX uses 2 decimals; 1 IDRX = 1 IDR; 1 USD ≈ 16,000 IDR
        // usdValue = idrxAmount / 10^2 / 16000
        usdValue = idrxAmount / 1_600_000;
    }

    /**
     * @notice Get dynamic collateral multiplier based on price feed freshness
     * @return multiplier Collateral multiplier (125 = 125%, 150 = 150% if stale)
     */
    function getDynamicCollateralMultiplier() public view returns (uint256) {
        if (address(priceFeed) == address(0)) return 125;

        (, , , uint256 updatedAt, ) = priceFeed.latestRoundData();

        // If price feed is stale (>1 hour), increase collateral requirement
        if (block.timestamp - updatedAt > 3600) return 150;

        return 125;
    }
}
