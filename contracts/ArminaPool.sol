// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

/**
 * @title ArminaPool
 * @notice Decentralized Arisan (ROSCA) with AI-optimized yield generation
 * @dev Implements wallet-based payments with collateral backup mechanism
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

    // ============ Structs ============

    enum PoolStatus { Open, Full, Active, Completed, Cancelled }
    enum PaymentSource { Wallet, Collateral }

    struct Pool {
        uint256 id;
        uint256 monthlyAmount; // in IDRX wei
        uint8 poolSize; // 5, 10, 15, or 20
        uint256 collateralRequired; // poolSize × monthlyAmount
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
        pool.collateralRequired = monthlyAmount * poolSize;
        pool.currentParticipants = 0;
        pool.status = PoolStatus.Open;
        pool.drawingDay = 10; // Default to 10th of month
        pool.currentMonth = 0;
        pool.creator = msg.sender;

        emit PoolCreated(poolId, msg.sender, monthlyAmount, poolSize, pool.collateralRequired);

        return poolId;
    }

    /**
     * @notice Join an existing pool
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

        uint256 totalRequired = pool.collateralRequired + pool.monthlyAmount;

        // Transfer collateral + first month payment
        bool success = idrxToken.transferFrom(msg.sender, address(this), totalRequired);
        if (!success) {
            revert InsufficientPayment();
        }

        // Initialize participant
        Participant storage participant = participants[poolId][msg.sender];
        participant.userAddress = msg.sender;
        participant.collateralDeposited = pool.collateralRequired;
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

        emit ParticipantJoined(poolId, msg.sender, pool.collateralRequired, pool.monthlyAmount);

        // Check if pool is full
        if (pool.currentParticipants == pool.poolSize) {
            pool.status = PoolStatus.Full;
            _startPool(poolId);
        }
    }

    /**
     * @dev Internal function to start the pool
     */
    function _startPool(uint256 poolId) private {
        Pool storage pool = pools[poolId];
        pool.status = PoolStatus.Active;
        pool.startDate = block.timestamp;
        pool.currentMonth = 1;

        // Deploy collateral to yield optimizer
        // TODO: Integrate with yield optimizer contract

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
        } else {
            // Wallet insufficient, use collateral
            source = PaymentSource.Collateral;
            participant.collateralUsedForPayments += amount;
            participant.missedPayments++;

            // Apply penalty
            penalty = (amount * PENALTY_RATE) / 100;
            participant.totalPenalties += penalty;
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
            } else {
                // Use collateral
                source = PaymentSource.Collateral;
                participant.collateralUsedForPayments += amount;
                participant.missedPayments++;
                penalty = (amount * PENALTY_RATE) / 100;
                participant.totalPenalties += penalty;
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
    function requestWinnerDraw(uint256 poolId) external onlyOwner returns (uint256) {
        Pool storage pool = pools[poolId];

        if (pool.status != PoolStatus.Active) {
            revert PoolNotActive();
        }

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
        idrxToken.transfer(owner(), platformFee);

        emit WinnerDrawn(poolId, pool.currentMonth, winner, potAmount, potYield);

        // Move to next month
        pool.currentMonth++;

        // Check if pool completed
        if (pool.currentMonth > pool.poolSize) {
            pool.status = PoolStatus.Completed;
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
     * TODO: Integrate with actual yield optimizer
     */
    function _calculateCollateralYield(
        uint256 poolId,
        address participantAddr
    ) private view returns (uint256) {
        Participant storage participant = participants[poolId][participantAddr];

        // Placeholder: 8% APY over 10 months
        // Real implementation will query yield optimizer contract
        uint256 apy = 8;
        uint256 months = 10;
        uint256 yield = (participant.collateralDeposited * apy * months) / (100 * 12);

        return yield;
    }

    /**
     * @dev Calculate pot yield for a specific month
     */
    function _calculatePotYieldForMonth(
        uint256 poolId,
        uint8 month
    ) private view returns (uint256) {
        Pool storage pool = pools[poolId];

        // Pot accumulates each month
        uint256 potAmount = pool.monthlyAmount * pool.poolSize;

        // Placeholder: 8% APY
        uint256 apy = 8;
        uint256 yield = (potAmount * apy * month) / (100 * 12);

        return yield;
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
        return (
            participant.collateralDeposited,
            participant.collateralYieldEarned,
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
}
