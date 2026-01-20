// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ArminaPool.sol";
import "./ArminaReputation.sol";
import "./IDRX.sol";

/**
 * @title ArminaFactory
 * @notice Factory contract for creating and managing arisan pools
 * @dev Manages pool creation, yield optimizer integration, and tier configurations
 */
contract ArminaFactory is Ownable {
    // Contracts
    IDRX public immutable idrx;
    ArminaReputation public immutable reputation;

    // Yield Optimizer
    address public yieldOptimizer;

    // Pool tier configurations
    struct TierConfig {
        uint256 contribution;
        uint256 minParticipants;
        uint256 maxParticipants;
        bool isActive;
    }

    // Tier enum
    enum Tier {
        SMALL,
        MEDIUM,
        LARGE
    }

    // Pool tracking
    uint256 public poolCount;
    mapping(uint256 => address) public pools;
    mapping(address => uint256[]) public userPools;
    mapping(address => bool) public isPoolRegistered;
    mapping(Tier => TierConfig) public tierConfigs;

    // Constants
    uint256 public constant COLLATERAL_RATIO = 125; // 125%

    // Events
    event PoolCreated(
        uint256 indexed poolId,
        address indexed poolAddress,
        address indexed creator,
        Tier tier,
        uint256 participantCount
    );
    event TierConfigUpdated(Tier tier, TierConfig config);
    event YieldOptimizerUpdated(address indexed newOptimizer);
    event PoolYieldOptimizerSet(address indexed pool, address indexed optimizer);

    // Errors
    error InvalidTier();
    error TierNotActive();
    error InvalidParticipantCount();
    error PoolNotRegistered();

    constructor(address _idrx, address _reputation) Ownable(msg.sender) {
        idrx = IDRX(_idrx);
        reputation = ArminaReputation(_reputation);

        // Initialize tier configs (IDRX has 2 decimals)
        // Small: 100K IDRX = 100000 * 10^2 = 10000000
        tierConfigs[Tier.SMALL] = TierConfig({
            contribution: 10000000, // 100K IDRX
            minParticipants: 3,
            maxParticipants: 5,
            isActive: true
        });

        // Medium: 500K IDRX = 500000 * 10^2 = 50000000
        tierConfigs[Tier.MEDIUM] = TierConfig({
            contribution: 50000000, // 500K IDRX
            minParticipants: 5,
            maxParticipants: 10,
            isActive: true
        });

        // Large: 1M IDRX = 1000000 * 10^2 = 100000000
        tierConfigs[Tier.LARGE] = TierConfig({
            contribution: 100000000, // 1M IDRX
            minParticipants: 10,
            maxParticipants: 20,
            isActive: true
        });
    }

    /**
     * @notice Create a new arisan pool
     * @param tier The pool tier (SMALL, MEDIUM, LARGE)
     * @param participantCount Number of participants for this pool
     */
    function createPool(
        Tier tier,
        uint256 participantCount
    ) external returns (address poolAddress) {
        TierConfig memory config = tierConfigs[tier];

        if (!config.isActive) revert TierNotActive();
        if (
            participantCount < config.minParticipants ||
            participantCount > config.maxParticipants
        ) {
            revert InvalidParticipantCount();
        }

        // Create new pool (removed cycleDays parameter - now hardcoded in ArminaPool)
        ArminaPool pool = new ArminaPool(
            address(idrx),
            address(reputation),
            address(this),
            config.contribution,
            participantCount,
            COLLATERAL_RATIO
        );

        poolAddress = address(pool);
        poolCount++;
        pools[poolCount] = poolAddress;
        userPools[msg.sender].push(poolCount);
        isPoolRegistered[poolAddress] = true;

        // Authorize pool to update reputation
        reputation.authorizePool(poolAddress);

        // Set yield optimizer if available
        if (yieldOptimizer != address(0)) {
            pool.setYieldOptimizer(yieldOptimizer);
            emit PoolYieldOptimizerSet(poolAddress, yieldOptimizer);
        }

        emit PoolCreated(poolCount, poolAddress, msg.sender, tier, participantCount);

        return poolAddress;
    }

    /**
     * @notice Get all pools for a user
     */
    function getUserPools(
        address user
    ) external view returns (uint256[] memory) {
        return userPools[user];
    }

    /**
     * @notice Get pool details with round info
     */
    function getPoolDetails(
        uint256 poolId
    )
        external
        view
        returns (
            address poolAddress,
            uint256 contribution,
            uint256 maxParticipants,
            uint256 currentParticipants,
            uint256 currentRound,
            bool isActive,
            bool isCompleted
        )
    {
        poolAddress = pools[poolId];
        ArminaPool pool = ArminaPool(poolAddress);

        return (
            poolAddress,
            pool.contribution(),
            pool.maxParticipants(),
            pool.getParticipantCount(),
            pool.currentRound(),
            pool.isActive(),
            pool.isCompleted()
        );
    }

    /**
     * @notice Get detailed pool info including round status
     */
    function getPoolDetailedInfo(
        uint256 poolId
    )
        external
        view
        returns (
            address poolAddress,
            uint256 contribution,
            uint256 maxParticipants,
            uint256 currentParticipants,
            uint256 currentRound,
            uint256 daysUntilPaymentDeadline,
            uint256 daysUntilDrawing,
            uint256 contributedCount,
            uint256 potAmount,
            bool isActive,
            bool isCompleted
        )
    {
        poolAddress = pools[poolId];
        ArminaPool pool = ArminaPool(poolAddress);

        (
            currentRound,
            daysUntilPaymentDeadline,
            daysUntilDrawing,
            contributedCount,
            potAmount
        ) = pool.getCurrentRoundStatus();

        return (
            poolAddress,
            pool.contribution(),
            pool.maxParticipants(),
            pool.getParticipantCount(),
            currentRound,
            daysUntilPaymentDeadline,
            daysUntilDrawing,
            contributedCount,
            potAmount,
            pool.isActive(),
            pool.isCompleted()
        );
    }

    /**
     * @notice Get all open pools (not started, not full)
     */
    function getOpenPools()
        external
        view
        returns (uint256[] memory openPoolIds)
    {
        // First pass: count open pools
        uint256 count = 0;
        for (uint256 i = 1; i <= poolCount; i++) {
            ArminaPool pool = ArminaPool(pools[i]);
            if (
                !pool.isActive() &&
                !pool.isCompleted() &&
                pool.getParticipantCount() < pool.maxParticipants()
            ) {
                count++;
            }
        }

        // Second pass: populate array
        openPoolIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= poolCount; i++) {
            ArminaPool pool = ArminaPool(pools[i]);
            if (
                !pool.isActive() &&
                !pool.isCompleted() &&
                pool.getParticipantCount() < pool.maxParticipants()
            ) {
                openPoolIds[index] = i;
                index++;
            }
        }

        return openPoolIds;
    }

    /**
     * @notice Get all active pools
     */
    function getActivePools()
        external
        view
        returns (uint256[] memory activePoolIds)
    {
        uint256 count = 0;
        for (uint256 i = 1; i <= poolCount; i++) {
            ArminaPool pool = ArminaPool(pools[i]);
            if (pool.isActive()) {
                count++;
            }
        }

        activePoolIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= poolCount; i++) {
            ArminaPool pool = ArminaPool(pools[i]);
            if (pool.isActive()) {
                activePoolIds[index] = i;
                index++;
            }
        }

        return activePoolIds;
    }

    /**
     * @notice Get all completed pools
     */
    function getCompletedPools()
        external
        view
        returns (uint256[] memory completedPoolIds)
    {
        uint256 count = 0;
        for (uint256 i = 1; i <= poolCount; i++) {
            ArminaPool pool = ArminaPool(pools[i]);
            if (pool.isCompleted()) {
                count++;
            }
        }

        completedPoolIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= poolCount; i++) {
            ArminaPool pool = ArminaPool(pools[i]);
            if (pool.isCompleted()) {
                completedPoolIds[index] = i;
                index++;
            }
        }

        return completedPoolIds;
    }

    // Admin functions

    /**
     * @notice Set the yield optimizer contract
     */
    function setYieldOptimizer(address _optimizer) external onlyOwner {
        yieldOptimizer = _optimizer;
        emit YieldOptimizerUpdated(_optimizer);
    }

    /**
     * @notice Update yield optimizer for existing pool
     */
    function setPoolYieldOptimizer(uint256 poolId, address _optimizer) external onlyOwner {
        address poolAddress = pools[poolId];
        if (!isPoolRegistered[poolAddress]) revert PoolNotRegistered();

        ArminaPool(poolAddress).setYieldOptimizer(_optimizer);
        emit PoolYieldOptimizerSet(poolAddress, _optimizer);
    }

    function updateTierConfig(
        Tier tier,
        TierConfig calldata config
    ) external onlyOwner {
        tierConfigs[tier] = config;
        emit TierConfigUpdated(tier, config);
    }

    function setTierActive(Tier tier, bool active) external onlyOwner {
        tierConfigs[tier].isActive = active;
    }
}
