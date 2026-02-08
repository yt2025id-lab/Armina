// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IArminaPoolAutomation
 * @notice Minimal interface for automation interactions with ArminaPool
 */
interface IArminaPoolAutomation {
    function poolCounter() external view returns (uint256);
    function getPoolDetails(uint256 poolId) external view returns (
        uint256 id,
        uint256 monthlyAmount,
        uint8 poolSize,
        uint256 collateralRequired,
        uint8 currentParticipants,
        uint8 status, // 0=Open, 1=Full, 2=Active, 3=Completed, 4=Cancelled
        uint256 startDate,
        uint8 currentMonth
    );
    function requestWinnerDraw(uint256 poolId) external returns (uint256);
}

/**
 * @title IYieldOptimizerAutomation
 * @notice Minimal interface for yield optimizer automation
 */
interface IYieldOptimizerAutomation {
    function harvestYield(address pool) external;
}

/**
 * @title IArminaFunctionsAutomation
 * @notice Minimal interface for triggering Functions APY refresh
 */
interface IArminaFunctionsAutomation {
    function requestAPYUpdate() external returns (bytes32);
}

/**
 * @title ArminaAutomation
 * @notice Chainlink Automation compatible contract for autonomous pool operations
 * @dev Automatically triggers monthly winner draws and yield harvesting
 *
 * Chainlink Automation checks this contract periodically:
 * - checkUpkeep() identifies active pools that need a monthly draw
 * - performUpkeep() triggers the VRF winner draw + yield harvest
 *
 * This eliminates manual intervention — pools run fully autonomously.
 */
contract ArminaAutomation is AutomationCompatibleInterface, Ownable {
    IArminaPoolAutomation public arminaPool;
    IYieldOptimizerAutomation public yieldOptimizer;
    IArminaFunctionsAutomation public arminaFunctions;

    // Automation interval (seconds between draws per pool)
    uint256 public automationInterval;

    // Whether to trigger APY update as part of monthly cycle
    bool public triggerAPYUpdateOnCycle = true;

    // Track last draw timestamp per pool
    mapping(uint256 => uint256) public lastDrawTimestamp;

    // Counters for monitoring
    uint256 public totalAutomatedDraws;

    // Events
    event AutomatedDraw(uint256 indexed poolId, uint256 timestamp);
    event AutomatedHarvest(address indexed pool, uint256 timestamp);
    event AutomatedAPYUpdate(uint256 indexed poolId, uint256 timestamp);
    event IntervalUpdated(uint256 newInterval);

    constructor(
        address _pool,
        address _optimizer,
        uint256 _interval
    ) Ownable(msg.sender) {
        arminaPool = IArminaPoolAutomation(_pool);
        yieldOptimizer = IYieldOptimizerAutomation(_optimizer);
        automationInterval = _interval;
    }

    /**
     * @notice Chainlink Automation: check if any pool needs a draw
     * @dev Called off-chain by Chainlink Automation nodes
     * @return upkeepNeeded True if a pool needs a winner draw
     * @return performData Encoded pool ID to draw
     */
    function checkUpkeep(bytes calldata /* checkData */)
        external view override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        uint256 poolCount = arminaPool.poolCounter();

        for (uint256 i = 1; i <= poolCount; i++) {
            (,,,, , uint8 status, uint256 startDate, ) =
                arminaPool.getPoolDetails(i);

            // Status 2 = Active
            if (status == 2) {
                uint256 lastDraw = lastDrawTimestamp[i];
                if (lastDraw == 0) lastDraw = startDate;

                if (block.timestamp >= lastDraw + automationInterval) {
                    return (true, abi.encode(i));
                }
            }
        }

        return (false, "");
    }

    /**
     * @notice Chainlink Automation: perform the upkeep (trigger draw)
     * @dev Called on-chain by Chainlink Automation when checkUpkeep returns true
     * @param performData Encoded pool ID
     */
    function performUpkeep(bytes calldata performData) external override {
        uint256 poolId = abi.decode(performData, (uint256));

        // Re-validate on-chain
        (,,,, , uint8 status, uint256 startDate, ) =
            arminaPool.getPoolDetails(poolId);
        require(status == 2, "Pool not active");

        uint256 lastDraw = lastDrawTimestamp[poolId];
        if (lastDraw == 0) lastDraw = startDate;
        require(block.timestamp >= lastDraw + automationInterval, "Too early");

        // Step 1: Trigger Functions APY refresh (CRE orchestration)
        if (triggerAPYUpdateOnCycle && address(arminaFunctions) != address(0)) {
            try arminaFunctions.requestAPYUpdate() {
                emit AutomatedAPYUpdate(poolId, block.timestamp);
            } catch {}
        }

        // Step 2: Harvest yield before draw
        if (address(yieldOptimizer) != address(0)) {
            try yieldOptimizer.harvestYield(address(arminaPool)) {
                emit AutomatedHarvest(address(arminaPool), block.timestamp);
            } catch {}
        }

        // Step 3: Trigger VRF winner draw
        arminaPool.requestWinnerDraw(poolId);

        lastDrawTimestamp[poolId] = block.timestamp;
        totalAutomatedDraws++;

        emit AutomatedDraw(poolId, block.timestamp);
    }

    // ============ Admin Functions ============

    function setInterval(uint256 _interval) external onlyOwner {
        automationInterval = _interval;
        emit IntervalUpdated(_interval);
    }

    function setPool(address _pool) external onlyOwner {
        arminaPool = IArminaPoolAutomation(_pool);
    }

    function setOptimizer(address _optimizer) external onlyOwner {
        yieldOptimizer = IYieldOptimizerAutomation(_optimizer);
    }

    function setFunctions(address _functions) external onlyOwner {
        arminaFunctions = IArminaFunctionsAutomation(_functions);
    }

    function setTriggerAPYUpdate(bool _trigger) external onlyOwner {
        triggerAPYUpdateOnCycle = _trigger;
    }
}
