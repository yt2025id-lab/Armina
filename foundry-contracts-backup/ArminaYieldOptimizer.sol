// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ArminaYieldOptimizer
 * @notice AI-driven yield optimizer for Armina pools
 * @dev Manages collateral and pot deposits across multiple lending protocols
 *
 * Supported Protocols (on Base):
 * - Moonwell
 * - Aave v3
 * - Compound v3
 * - Morpho
 * - Seamless
 *
 * The AI agent (off-chain) monitors APYs and calls rebalance() to move funds
 * to the highest yielding protocol.
 */
contract ArminaYieldOptimizer is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Token
    IERC20 public immutable idrx;

    // Protocol enum
    enum Protocol {
        NONE,
        MOONWELL,
        AAVE,
        COMPOUND,
        MORPHO,
        SEAMLESS
    }

    // Protocol info
    struct ProtocolInfo {
        address pool;           // Lending pool/market address
        address aToken;         // Receipt token (aToken, cToken, etc.)
        uint256 currentAPY;     // Current APY in basis points (100 = 1%)
        uint256 deposited;      // Amount currently deposited
        bool isActive;          // Whether protocol is enabled
    }

    // Pool deposits tracking
    struct PoolDeposit {
        uint256 collateralDeposited;
        uint256 potDeposited;
        uint256 totalYieldEarned;
        Protocol currentProtocol;
        uint256 lastRebalance;
    }

    // State
    mapping(Protocol => ProtocolInfo) public protocols;
    mapping(address => PoolDeposit) public poolDeposits;
    mapping(address => bool) public authorizedPools;

    address public factory;
    address public aiAgent; // Off-chain AI agent that monitors and triggers rebalance

    uint256 public totalDeposited;
    uint256 public totalYieldGenerated;

    // Events
    event ProtocolUpdated(Protocol indexed protocol, address pool, uint256 apy);
    event Deposited(address indexed pool, uint256 amount, Protocol protocol);
    event Withdrawn(address indexed pool, uint256 amount, uint256 yield);
    event Rebalanced(address indexed pool, Protocol fromProtocol, Protocol toProtocol, uint256 amount);
    event YieldHarvested(address indexed pool, uint256 amount);
    event AIAgentUpdated(address indexed newAgent);
    event PoolAuthorized(address indexed pool);

    // Errors
    error NotAuthorized();
    error ProtocolNotActive();
    error InsufficientBalance();
    error InvalidProtocol();
    error NoDeposit();

    modifier onlyAuthorizedPool() {
        if (!authorizedPools[msg.sender]) revert NotAuthorized();
        _;
    }

    modifier onlyAIAgent() {
        if (msg.sender != aiAgent && msg.sender != owner()) revert NotAuthorized();
        _;
    }

    constructor(address _idrx, address _factory) Ownable(msg.sender) {
        idrx = IERC20(_idrx);
        factory = _factory;
        aiAgent = msg.sender; // Initially owner is AI agent

        // Initialize protocols (addresses to be set by owner)
        protocols[Protocol.MOONWELL] = ProtocolInfo({
            pool: address(0),
            aToken: address(0),
            currentAPY: 1250, // 12.5% default
            deposited: 0,
            isActive: false
        });

        protocols[Protocol.AAVE] = ProtocolInfo({
            pool: address(0),
            aToken: address(0),
            currentAPY: 1100, // 11%
            deposited: 0,
            isActive: false
        });

        protocols[Protocol.COMPOUND] = ProtocolInfo({
            pool: address(0),
            aToken: address(0),
            currentAPY: 1050, // 10.5%
            deposited: 0,
            isActive: false
        });

        protocols[Protocol.MORPHO] = ProtocolInfo({
            pool: address(0),
            aToken: address(0),
            currentAPY: 1400, // 14%
            deposited: 0,
            isActive: false
        });

        protocols[Protocol.SEAMLESS] = ProtocolInfo({
            pool: address(0),
            aToken: address(0),
            currentAPY: 1200, // 12%
            deposited: 0,
            isActive: false
        });
    }

    /**
     * @notice Deposit funds from pool to yield optimizer
     * @param amount Amount to deposit
     * @param isCollateral Whether this is collateral or pot deposit
     */
    function deposit(uint256 amount, bool isCollateral) external onlyAuthorizedPool nonReentrant {
        if (amount == 0) return;

        idrx.safeTransferFrom(msg.sender, address(this), amount);

        PoolDeposit storage pd = poolDeposits[msg.sender];
        if (isCollateral) {
            pd.collateralDeposited += amount;
        } else {
            pd.potDeposited += amount;
        }

        totalDeposited += amount;

        // Find best protocol and deposit
        Protocol bestProtocol = _findBestProtocol();
        if (bestProtocol != Protocol.NONE) {
            _depositToProtocol(bestProtocol, amount);
            pd.currentProtocol = bestProtocol;
        }

        emit Deposited(msg.sender, amount, bestProtocol);
    }

    /**
     * @notice Withdraw funds back to pool
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external onlyAuthorizedPool nonReentrant returns (uint256 totalWithdrawn) {
        PoolDeposit storage pd = poolDeposits[msg.sender];
        uint256 totalPoolDeposit = pd.collateralDeposited + pd.potDeposited;

        if (totalPoolDeposit == 0) revert NoDeposit();
        if (amount > totalPoolDeposit) revert InsufficientBalance();

        // Calculate proportional yield
        uint256 yieldShare = 0;
        if (pd.totalYieldEarned > 0) {
            yieldShare = (pd.totalYieldEarned * amount) / totalPoolDeposit;
            pd.totalYieldEarned -= yieldShare;
        }

        // Withdraw from protocol
        if (pd.currentProtocol != Protocol.NONE) {
            _withdrawFromProtocol(pd.currentProtocol, amount);
        }

        // Update balances
        if (amount <= pd.potDeposited) {
            pd.potDeposited -= amount;
        } else {
            uint256 remaining = amount - pd.potDeposited;
            pd.potDeposited = 0;
            pd.collateralDeposited -= remaining;
        }

        totalDeposited -= amount;
        totalWithdrawn = amount + yieldShare;

        idrx.safeTransfer(msg.sender, totalWithdrawn);

        emit Withdrawn(msg.sender, amount, yieldShare);
        return totalWithdrawn;
    }

    /**
     * @notice Rebalance pool funds to highest APY protocol
     * @dev Called by AI agent when better opportunity is found
     */
    function rebalance(address pool) external onlyAIAgent nonReentrant {
        PoolDeposit storage pd = poolDeposits[pool];
        uint256 totalAmount = pd.collateralDeposited + pd.potDeposited;

        if (totalAmount == 0) return;

        Protocol bestProtocol = _findBestProtocol();
        if (bestProtocol == Protocol.NONE || bestProtocol == pd.currentProtocol) return;

        // Harvest yield before moving
        _harvestYield(pool);

        // Withdraw from current protocol
        if (pd.currentProtocol != Protocol.NONE) {
            _withdrawFromProtocol(pd.currentProtocol, totalAmount);
        }

        // Deposit to new protocol
        _depositToProtocol(bestProtocol, totalAmount);

        emit Rebalanced(pool, pd.currentProtocol, bestProtocol, totalAmount);

        pd.currentProtocol = bestProtocol;
        pd.lastRebalance = block.timestamp;
    }

    /**
     * @notice Harvest yield from current protocol
     */
    function harvestYield(address pool) external onlyAIAgent {
        _harvestYield(pool);
    }

    /**
     * @notice Get current best APY
     */
    function getBestAPY() external view returns (Protocol protocol, uint256 apy) {
        protocol = _findBestProtocol();
        if (protocol != Protocol.NONE) {
            apy = protocols[protocol].currentAPY;
        }
        return (protocol, apy);
    }

    /**
     * @notice Get pool's current yield status
     */
    function getPoolYieldStatus(address pool) external view returns (
        uint256 totalDeposit,
        uint256 currentYield,
        Protocol currentProtocol,
        uint256 currentAPY,
        uint256 lastRebalance
    ) {
        PoolDeposit storage pd = poolDeposits[pool];
        totalDeposit = pd.collateralDeposited + pd.potDeposited;
        currentYield = pd.totalYieldEarned;
        currentProtocol = pd.currentProtocol;
        if (currentProtocol != Protocol.NONE) {
            currentAPY = protocols[currentProtocol].currentAPY;
        }
        lastRebalance = pd.lastRebalance;
    }

    // Internal functions

    function _findBestProtocol() internal view returns (Protocol) {
        Protocol best = Protocol.NONE;
        uint256 bestAPY = 0;

        for (uint8 i = 1; i <= 5; i++) {
            Protocol p = Protocol(i);
            if (protocols[p].isActive && protocols[p].currentAPY > bestAPY) {
                bestAPY = protocols[p].currentAPY;
                best = p;
            }
        }

        return best;
    }

    function _depositToProtocol(Protocol protocol, uint256 amount) internal {
        ProtocolInfo storage info = protocols[protocol];
        if (!info.isActive) revert ProtocolNotActive();

        // In production, this would call the actual protocol's deposit function
        // For hackathon, we simulate by tracking internally
        info.deposited += amount;

        // Example for Moonwell:
        // IMoonwell(info.pool).mint(amount);

        // Example for Aave:
        // IPool(info.pool).supply(address(idrx), amount, address(this), 0);
    }

    function _withdrawFromProtocol(Protocol protocol, uint256 amount) internal {
        ProtocolInfo storage info = protocols[protocol];

        // In production, this would call the actual protocol's withdraw function
        if (info.deposited >= amount) {
            info.deposited -= amount;
        } else {
            info.deposited = 0;
        }

        // Example for Moonwell:
        // IMoonwell(info.pool).redeem(amount);

        // Example for Aave:
        // IPool(info.pool).withdraw(address(idrx), amount, address(this));
    }

    function _harvestYield(address pool) internal {
        PoolDeposit storage pd = poolDeposits[pool];
        if (pd.currentProtocol == Protocol.NONE) return;

        // Calculate accrued yield based on time and APY
        // In production, this would claim actual yield from protocol
        uint256 totalAmount = pd.collateralDeposited + pd.potDeposited;
        uint256 apy = protocols[pd.currentProtocol].currentAPY;

        // Simple yield calculation (per day, for demo)
        // In production, use actual accrued interest from protocol
        uint256 daysSinceRebalance = (block.timestamp - pd.lastRebalance) / 1 days;
        if (daysSinceRebalance > 0) {
            uint256 yieldAmount = (totalAmount * apy * daysSinceRebalance) / (365 * 10000);
            pd.totalYieldEarned += yieldAmount;
            totalYieldGenerated += yieldAmount;

            emit YieldHarvested(pool, yieldAmount);
        }
    }

    // Admin functions

    function authorizePool(address pool) external {
        if (msg.sender != factory && msg.sender != owner()) revert NotAuthorized();
        authorizedPools[pool] = true;
        emit PoolAuthorized(pool);
    }

    function setAIAgent(address _agent) external onlyOwner {
        aiAgent = _agent;
        emit AIAgentUpdated(_agent);
    }

    function setProtocol(
        Protocol protocol,
        address pool,
        address aToken,
        uint256 apy,
        bool isActive
    ) external onlyOwner {
        if (protocol == Protocol.NONE) revert InvalidProtocol();

        protocols[protocol] = ProtocolInfo({
            pool: pool,
            aToken: aToken,
            currentAPY: apy,
            deposited: protocols[protocol].deposited,
            isActive: isActive
        });

        emit ProtocolUpdated(protocol, pool, apy);
    }

    function updateAPY(Protocol protocol, uint256 apy) external onlyAIAgent {
        if (protocol == Protocol.NONE) revert InvalidProtocol();
        protocols[protocol].currentAPY = apy;
        emit ProtocolUpdated(protocol, protocols[protocol].pool, apy);
    }

    function setFactory(address _factory) external onlyOwner {
        factory = _factory;
    }

    // Emergency functions

    function emergencyWithdraw(Protocol protocol) external onlyOwner {
        ProtocolInfo storage info = protocols[protocol];
        if (info.deposited > 0) {
            _withdrawFromProtocol(protocol, info.deposited);
        }
    }

    function emergencyRecoverTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}
