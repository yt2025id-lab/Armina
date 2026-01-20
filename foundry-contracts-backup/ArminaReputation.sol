// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ArminaReputation
 * @notice Soulbound NFT for tracking user reputation in Armina
 * @dev Non-transferable NFT that tracks participation history
 */
contract ArminaReputation is ERC721, Ownable {
    // Reputation data structure
    struct ReputationData {
        uint256 score;
        uint256 totalPoolsCompleted;
        uint256 totalPoolsJoined;
        uint256 onTimePayments;
        uint256 latePayments;
        uint256 defaults;
        uint256 lastUpdated;
    }

    // Token ID counter
    uint256 private _nextTokenId;

    // Mapping from address to token ID
    mapping(address => uint256) public userToTokenId;

    // Mapping from token ID to reputation data
    mapping(uint256 => ReputationData) public reputationData;

    // Authorized pool contracts
    mapping(address => bool) public authorizedPools;

    // Score constants
    uint256 public constant ON_TIME_PAYMENT_SCORE = 10;
    uint256 public constant POOL_COMPLETED_SCORE = 50;
    uint256 public constant LATE_PAYMENT_PENALTY = 20;
    uint256 public constant DEFAULT_PENALTY = 100;

    // Level thresholds
    uint256 public constant SILVER_THRESHOLD = 100;
    uint256 public constant GOLD_THRESHOLD = 300;
    uint256 public constant DIAMOND_THRESHOLD = 500;

    // Events
    event ReputationMinted(address indexed user, uint256 tokenId);
    event ScoreUpdated(address indexed user, uint256 newScore, string reason);
    event PoolAuthorized(address indexed pool);
    event PoolDeauthorized(address indexed pool);

    error AlreadyHasReputation();
    error NoReputationToken();
    error NotAuthorizedPool();
    error SoulboundTransfer();

    constructor() ERC721("Armina Reputation", "AREP") Ownable(msg.sender) {
        _nextTokenId = 1;
    }

    /**
     * @notice Mint a reputation NFT for a new user
     * @dev Free to mint, one per address
     */
    function mint() external {
        if (userToTokenId[msg.sender] != 0) {
            revert AlreadyHasReputation();
        }

        uint256 tokenId = _nextTokenId++;
        userToTokenId[msg.sender] = tokenId;

        _safeMint(msg.sender, tokenId);

        reputationData[tokenId] = ReputationData({
            score: 0,
            totalPoolsCompleted: 0,
            totalPoolsJoined: 0,
            onTimePayments: 0,
            latePayments: 0,
            defaults: 0,
            lastUpdated: block.timestamp
        });

        emit ReputationMinted(msg.sender, tokenId);
    }

    /**
     * @notice Record an on-time payment
     */
    function recordOnTimePayment(address user) external onlyAuthorizedPool {
        uint256 tokenId = userToTokenId[user];
        if (tokenId == 0) revert NoReputationToken();

        ReputationData storage data = reputationData[tokenId];
        data.score += ON_TIME_PAYMENT_SCORE;
        data.onTimePayments++;
        data.lastUpdated = block.timestamp;

        emit ScoreUpdated(user, data.score, "on_time_payment");
    }

    /**
     * @notice Record a late payment
     */
    function recordLatePayment(address user) external onlyAuthorizedPool {
        uint256 tokenId = userToTokenId[user];
        if (tokenId == 0) revert NoReputationToken();

        ReputationData storage data = reputationData[tokenId];
        if (data.score >= LATE_PAYMENT_PENALTY) {
            data.score -= LATE_PAYMENT_PENALTY;
        } else {
            data.score = 0;
        }
        data.latePayments++;
        data.lastUpdated = block.timestamp;

        emit ScoreUpdated(user, data.score, "late_payment");
    }

    /**
     * @notice Record a default (non-payment)
     */
    function recordDefault(address user) external onlyAuthorizedPool {
        uint256 tokenId = userToTokenId[user];
        if (tokenId == 0) revert NoReputationToken();

        ReputationData storage data = reputationData[tokenId];
        if (data.score >= DEFAULT_PENALTY) {
            data.score -= DEFAULT_PENALTY;
        } else {
            data.score = 0;
        }
        data.defaults++;
        data.lastUpdated = block.timestamp;

        emit ScoreUpdated(user, data.score, "default");
    }

    /**
     * @notice Record pool joined
     */
    function recordPoolJoined(address user) external onlyAuthorizedPool {
        uint256 tokenId = userToTokenId[user];
        if (tokenId == 0) revert NoReputationToken();

        ReputationData storage data = reputationData[tokenId];
        data.totalPoolsJoined++;
        data.lastUpdated = block.timestamp;
    }

    /**
     * @notice Record pool completed
     */
    function recordPoolCompleted(address user) external onlyAuthorizedPool {
        uint256 tokenId = userToTokenId[user];
        if (tokenId == 0) revert NoReputationToken();

        ReputationData storage data = reputationData[tokenId];
        data.score += POOL_COMPLETED_SCORE;
        data.totalPoolsCompleted++;
        data.lastUpdated = block.timestamp;

        emit ScoreUpdated(user, data.score, "pool_completed");
    }

    /**
     * @notice Get user's reputation level
     * @return 0 = Bronze, 1 = Silver, 2 = Gold, 3 = Diamond
     */
    function getLevel(address user) external view returns (uint8) {
        uint256 tokenId = userToTokenId[user];
        if (tokenId == 0) return 0;

        uint256 score = reputationData[tokenId].score;

        if (score >= DIAMOND_THRESHOLD) return 3;
        if (score >= GOLD_THRESHOLD) return 2;
        if (score >= SILVER_THRESHOLD) return 1;
        return 0;
    }

    /**
     * @notice Get collateral discount percentage based on reputation
     * @return Discount percentage (0-25)
     */
    function getCollateralDiscount(address user) external view returns (uint8) {
        uint256 tokenId = userToTokenId[user];
        if (tokenId == 0) return 0;

        uint256 score = reputationData[tokenId].score;

        if (score >= DIAMOND_THRESHOLD) return 25;
        if (score >= GOLD_THRESHOLD) return 20;
        if (score >= SILVER_THRESHOLD) return 10;
        return 0;
    }

    /**
     * @notice Get full reputation data for a user
     */
    function getReputation(
        address user
    ) external view returns (ReputationData memory) {
        uint256 tokenId = userToTokenId[user];
        if (tokenId == 0) {
            return
                ReputationData({
                    score: 0,
                    totalPoolsCompleted: 0,
                    totalPoolsJoined: 0,
                    onTimePayments: 0,
                    latePayments: 0,
                    defaults: 0,
                    lastUpdated: 0
                });
        }
        return reputationData[tokenId];
    }

    /**
     * @notice Check if user has a reputation NFT
     */
    function hasReputation(address user) external view returns (bool) {
        return userToTokenId[user] != 0;
    }

    // Admin functions

    function authorizePool(address pool) external onlyOwner {
        authorizedPools[pool] = true;
        emit PoolAuthorized(pool);
    }

    function deauthorizePool(address pool) external onlyOwner {
        authorizedPools[pool] = false;
        emit PoolDeauthorized(pool);
    }

    // Modifier

    modifier onlyAuthorizedPool() {
        if (!authorizedPools[msg.sender]) {
            revert NotAuthorizedPool();
        }
        _;
    }

    // Override transfer functions to make it soulbound

    function transferFrom(
        address,
        address,
        uint256
    ) public pure override {
        revert SoulboundTransfer();
    }

    function safeTransferFrom(
        address,
        address,
        uint256,
        bytes memory
    ) public pure override {
        revert SoulboundTransfer();
    }

    function approve(address, uint256) public pure override {
        revert SoulboundTransfer();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert SoulboundTransfer();
    }
}
