// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ArminaReputation.sol";

/**
 * @title ArminaPool
 * @author Armina Team
 * @notice On-chain rotating savings pool (arisan) with collateral protection
 * @dev Handles contributions, winner selection, payouts, and auto-cover from collateral
 *
 * === TIMELINE PER ROUND ===
 * - Day 1-10:  Payment period (on-time)
 * - Day 11-19: Grace period (late penalty)
 * - Day 20:    Drawing day
 * - Day 21-30: Winner receives pot, next round prep
 *
 * === KEY FEATURES ===
 * - 125% collateral requirement
 * - Auto-cover missed payments from collateral
 * - Reputation-based collateral discount
 * - Yield optimization integration
 */
contract ArminaPool is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ POOL CONFIGURATION ============

    IERC20 public immutable idrx;
    ArminaReputation public immutable reputation;
    address public immutable factory;

    uint256 public immutable contribution;
    uint256 public immutable maxParticipants;
    uint256 public immutable collateralRatio;

    // ============ TIMELINE CONSTANTS ============

    uint256 public constant PAYMENT_DEADLINE_DAY = 10;
    uint256 public constant DRAWING_DAY = 20;
    uint256 public constant ROUND_DURATION = 30;

    // ============ POOL STATE ============

    uint256 public currentRound;
    uint256 public startTime;
    uint256 public roundStartTime;
    bool public isActive;
    bool public isCompleted;

    // ============ PARTICIPANT DATA ============

    struct Participant {
        bool hasJoined;
        bool hasReceivedPayout;
        uint256 collateralLocked;
        uint256 collateralUsedForCover;
        uint256 joinedAt;
        mapping(uint256 => bool) roundContributions;
        mapping(uint256 => bool) paidFromCollateral;
    }

    address[] public participants;
    mapping(address => Participant) public participantData;

    // ============ ROUND DATA ============

    struct RoundInfo {
        address winner;
        uint256 potAmount;
        uint256 startTime;
        uint256 paymentDeadline;
        uint256 drawingTime;
        uint256 endTime;
        bool isFinalized;
    }
    mapping(uint256 => RoundInfo) public rounds;

    // ============ YIELD TRACKING ============

    uint256 public totalYieldEarned;
    address public yieldOptimizer;

    // ============ EVENTS ============

    event ParticipantJoined(address indexed participant, uint256 collateralAmount);
    event PoolStarted(uint256 startTime, uint256 firstPaymentDeadline, uint256 firstDrawingTime);
    event ContributionMade(address indexed participant, uint256 round, uint256 amount, bool onTime);
    event ContributionCoveredFromCollateral(address indexed participant, uint256 round, uint256 amount);
    event WinnerSelected(address indexed winner, uint256 round, uint256 amount);
    event CollateralReturned(address indexed participant, uint256 amount);
    event CollateralSlashed(address indexed participant, uint256 amount, string reason);
    event PoolCompleted(uint256 totalDistributed);
    event YieldDistributed(uint256 amount);
    event YieldOptimizerSet(address indexed optimizer);

    // ============ ERRORS ============

    error PoolFull();
    error AlreadyJoined();
    error PoolNotActive();
    error PoolAlreadyActive();
    error PoolIsCompleted();
    error NotParticipant();
    error AlreadyContributed();
    error PaymentPeriodEnded();
    error NotDrawingTime();
    error AlreadyReceivedPayout();
    error InsufficientParticipants();
    error TransferFailed();
    error InsufficientCollateral();
    error NotFactory();
    error RoundNotFinalized();

    // ============ MODIFIERS ============

    modifier onlyFactory() {
        if (msg.sender != factory) revert NotFactory();
        _;
    }

    // ============ CONSTRUCTOR ============

    constructor(
        address _idrx,
        address _reputation,
        address _factory,
        uint256 _contribution,
        uint256 _maxParticipants,
        uint256 _collateralRatio
    ) {
        idrx = IERC20(_idrx);
        reputation = ArminaReputation(_reputation);
        factory = _factory;
        contribution = _contribution;
        maxParticipants = _maxParticipants;
        collateralRatio = _collateralRatio;

        currentRound = 0;
        isActive = false;
        isCompleted = false;
    }

    // ============ MAIN FUNCTIONS ============

    /**
     * @notice Join the pool by locking collateral
     * @dev Collateral is calculated as: base * (100 - reputationDiscount) / 100
     */
    function join() external nonReentrant {
        if (isActive) revert PoolAlreadyActive();
        if (isCompleted) revert PoolIsCompleted();
        if (participants.length >= maxParticipants) revert PoolFull();
        if (participantData[msg.sender].hasJoined) revert AlreadyJoined();

        uint256 baseCollateral = (contribution * maxParticipants * collateralRatio) / 100;
        uint8 discount = reputation.getCollateralDiscount(msg.sender);
        uint256 collateralRequired = baseCollateral - ((baseCollateral * discount) / 100);

        idrx.safeTransferFrom(msg.sender, address(this), collateralRequired);

        Participant storage p = participantData[msg.sender];
        p.hasJoined = true;
        p.collateralLocked = collateralRequired;
        p.collateralUsedForCover = 0;
        p.joinedAt = block.timestamp;

        participants.push(msg.sender);

        if (reputation.hasReputation(msg.sender)) {
            reputation.recordPoolJoined(msg.sender);
        }

        emit ParticipantJoined(msg.sender, collateralRequired);

        if (participants.length == maxParticipants) {
            _startPool();
        }
    }

    /**
     * @notice Make monthly contribution
     * @dev Payment before day 10 is on-time (+10 rep), after is late (-20 rep)
     */
    function contribute() external nonReentrant {
        if (!isActive) revert PoolNotActive();
        if (isCompleted) revert PoolIsCompleted();
        if (!participantData[msg.sender].hasJoined) revert NotParticipant();
        if (participantData[msg.sender].roundContributions[currentRound]) revert AlreadyContributed();

        RoundInfo storage round = rounds[currentRound];

        if (block.timestamp > round.drawingTime) revert PaymentPeriodEnded();

        bool isOnTime = block.timestamp <= round.paymentDeadline;

        idrx.safeTransferFrom(msg.sender, address(this), contribution);

        participantData[msg.sender].roundContributions[currentRound] = true;
        round.potAmount += contribution;

        if (reputation.hasReputation(msg.sender)) {
            if (isOnTime) {
                reputation.recordOnTimePayment(msg.sender);
            } else {
                reputation.recordLatePayment(msg.sender);
            }
        }

        emit ContributionMade(msg.sender, currentRound, contribution, isOnTime);

        if (_allContributed()) {
            _selectWinner();
        }
    }

    /**
     * @notice Finalize round on drawing day (day 20)
     * @dev Auto-covers missing payments from collateral, then selects winner
     */
    function finalizeRound() external {
        if (!isActive) revert PoolNotActive();
        if (isCompleted) revert PoolIsCompleted();

        RoundInfo storage round = rounds[currentRound];

        if (block.timestamp < round.drawingTime) revert NotDrawingTime();
        if (round.isFinalized) revert RoundNotFinalized();

        _coverMissingPayments();
        _selectWinner();
    }

    /**
     * @notice Claim collateral after pool completion
     * @dev Returns remaining collateral (minus used for covers) plus yield share
     */
    function claimCollateral() external nonReentrant {
        if (!isCompleted) revert PoolNotActive();
        if (!participantData[msg.sender].hasJoined) revert NotParticipant();

        Participant storage p = participantData[msg.sender];
        uint256 remainingCollateral = p.collateralLocked - p.collateralUsedForCover;

        if (remainingCollateral == 0) revert TransferFailed();

        p.collateralLocked = 0;
        p.collateralUsedForCover = 0;

        uint256 yieldShare = 0;
        if (totalYieldEarned > 0) {
            yieldShare = totalYieldEarned / participants.length;
            totalYieldEarned -= yieldShare;
        }

        uint256 totalReturn = remainingCollateral + yieldShare;
        idrx.safeTransfer(msg.sender, totalReturn);

        emit CollateralReturned(msg.sender, totalReturn);
    }

    // ============ INTERNAL FUNCTIONS ============

    function _startPool() internal {
        isActive = true;
        startTime = block.timestamp;
        currentRound = 1;
        roundStartTime = block.timestamp;

        _setupRound(currentRound);

        RoundInfo storage round = rounds[currentRound];
        emit PoolStarted(startTime, round.paymentDeadline, round.drawingTime);
    }

    function _setupRound(uint256 roundNum) internal {
        RoundInfo storage round = rounds[roundNum];
        round.startTime = roundStartTime;
        round.paymentDeadline = roundStartTime + (PAYMENT_DEADLINE_DAY * 1 days);
        round.drawingTime = roundStartTime + (DRAWING_DAY * 1 days);
        round.endTime = roundStartTime + (ROUND_DURATION * 1 days);
        round.potAmount = 0;
        round.isFinalized = false;
    }

    /**
     * @dev Auto-cover missed payments from participant's collateral
     * Records default (-100 reputation) for participants who don't pay
     */
    function _coverMissingPayments() internal {
        for (uint256 i = 0; i < participants.length; i++) {
            address participant = participants[i];
            Participant storage p = participantData[participant];

            if (p.roundContributions[currentRound]) continue;

            uint256 availableCollateral = p.collateralLocked - p.collateralUsedForCover;

            if (availableCollateral >= contribution) {
                p.roundContributions[currentRound] = true;
                p.paidFromCollateral[currentRound] = true;
                p.collateralUsedForCover += contribution;
                rounds[currentRound].potAmount += contribution;

                if (reputation.hasReputation(participant)) {
                    reputation.recordDefault(participant);
                }

                emit ContributionCoveredFromCollateral(participant, currentRound, contribution);
                emit CollateralSlashed(participant, contribution, "missed_payment");
            } else {
                if (availableCollateral > 0) {
                    p.collateralUsedForCover += availableCollateral;
                    rounds[currentRound].potAmount += availableCollateral;
                    emit CollateralSlashed(participant, availableCollateral, "partial_cover");
                }

                if (reputation.hasReputation(participant)) {
                    reputation.recordDefault(participant);
                }
            }
        }
    }

    /**
     * @dev Select winner for current round using simple randomness
     * Note: Use Chainlink VRF in production
     */
    function _selectWinner() internal {
        RoundInfo storage round = rounds[currentRound];
        round.isFinalized = true;

        address[] memory eligible = new address[](participants.length);
        uint256 count = 0;

        for (uint256 i = 0; i < participants.length; i++) {
            if (!participantData[participants[i]].hasReceivedPayout) {
                eligible[count] = participants[i];
                count++;
            }
        }

        if (count == 0) {
            _completePool();
            return;
        }

        uint256 randomIndex = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    currentRound,
                    round.potAmount
                )
            )
        ) % count;

        address winner = eligible[randomIndex];
        participantData[winner].hasReceivedPayout = true;
        round.winner = winner;

        uint256 potAmount = round.potAmount;
        if (potAmount > 0) {
            idrx.safeTransfer(winner, potAmount);
        }

        emit WinnerSelected(winner, currentRound, potAmount);

        if (currentRound >= maxParticipants) {
            _completePool();
        } else {
            currentRound++;
            roundStartTime = block.timestamp;
            _setupRound(currentRound);
        }
    }

    function _completePool() internal {
        isActive = false;
        isCompleted = true;

        for (uint256 i = 0; i < participants.length; i++) {
            if (reputation.hasReputation(participants[i])) {
                reputation.recordPoolCompleted(participants[i]);
            }
        }

        uint256 totalDistributed = contribution * maxParticipants * maxParticipants;
        emit PoolCompleted(totalDistributed);
    }

    function _allContributed() internal view returns (bool) {
        for (uint256 i = 0; i < participants.length; i++) {
            if (!participantData[participants[i]].roundContributions[currentRound]) {
                return false;
            }
        }
        return true;
    }

    // ============ YIELD OPTIMIZER INTEGRATION ============

    function setYieldOptimizer(address _optimizer) external onlyFactory {
        yieldOptimizer = _optimizer;
        emit YieldOptimizerSet(_optimizer);
    }

    function depositToYield(uint256 amount) external onlyFactory {
        if (yieldOptimizer == address(0)) return;
        idrx.safeTransfer(yieldOptimizer, amount);
    }

    function recordYield(uint256 amount) external {
        if (msg.sender != yieldOptimizer) revert NotFactory();
        totalYieldEarned += amount;
        emit YieldDistributed(amount);
    }

    // ============ VIEW FUNCTIONS ============

    function getParticipants() external view returns (address[] memory) {
        return participants;
    }

    function getParticipantCount() external view returns (uint256) {
        return participants.length;
    }

    function hasContributed(address participant, uint256 round) external view returns (bool) {
        return participantData[participant].roundContributions[round];
    }

    function wasCoveredFromCollateral(address participant, uint256 round) external view returns (bool) {
        return participantData[participant].paidFromCollateral[round];
    }

    function getCollateralRequired() external view returns (uint256) {
        return (contribution * maxParticipants * collateralRatio) / 100;
    }

    function getCollateralForUser(address user) external view returns (uint256) {
        uint256 baseCollateral = (contribution * maxParticipants * collateralRatio) / 100;
        uint8 discount = reputation.getCollateralDiscount(user);
        return baseCollateral - ((baseCollateral * discount) / 100);
    }

    function getRemainingCollateral(address user) external view returns (uint256) {
        Participant storage p = participantData[user];
        return p.collateralLocked - p.collateralUsedForCover;
    }

    function getRoundInfo(uint256 round) external view returns (
        address winner,
        uint256 potAmount,
        uint256 startTime_,
        uint256 paymentDeadline,
        uint256 drawingTime,
        uint256 endTime,
        bool isFinalized
    ) {
        RoundInfo storage r = rounds[round];
        return (
            r.winner,
            r.potAmount,
            r.startTime,
            r.paymentDeadline,
            r.drawingTime,
            r.endTime,
            r.isFinalized
        );
    }

    function getCurrentRoundStatus() external view returns (
        uint256 round,
        uint256 daysUntilPaymentDeadline,
        uint256 daysUntilDrawing,
        uint256 contributedCount,
        uint256 potAmount
    ) {
        if (!isActive) return (0, 0, 0, 0, 0);

        RoundInfo storage r = rounds[currentRound];

        uint256 paymentDaysLeft = 0;
        if (block.timestamp < r.paymentDeadline) {
            paymentDaysLeft = (r.paymentDeadline - block.timestamp) / 1 days;
        }

        uint256 drawingDaysLeft = 0;
        if (block.timestamp < r.drawingTime) {
            drawingDaysLeft = (r.drawingTime - block.timestamp) / 1 days;
        }

        uint256 contributed = 0;
        for (uint256 i = 0; i < participants.length; i++) {
            if (participantData[participants[i]].roundContributions[currentRound]) {
                contributed++;
            }
        }

        return (currentRound, paymentDaysLeft, drawingDaysLeft, contributed, r.potAmount);
    }
}
