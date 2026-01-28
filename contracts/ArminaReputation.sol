// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ArminaReputation
 * @notice Soulbound NFT for tracking user reputation in the Armina protocol
 * @dev Non-transferable ERC721. One token per address. Score updated by authorized pool contracts.
 */
contract ArminaReputation is ERC721, Ownable {
    // ── Errors ──
    error AlreadyHasReputation();
    error NoReputationToken();
    error NotAuthorizedPool();
    error SoulboundTransfer();

    // ── Events ──
    event ReputationMinted(address indexed user, uint256 tokenId);
    event ScoreUpdated(address indexed user, uint256 newScore, string reason);
    event PoolAuthorized(address indexed pool);
    event PoolDeauthorized(address indexed pool);

    // ── Scoring constants ──
    uint256 public constant ON_TIME_PAYMENT_SCORE = 10;
    uint256 public constant LATE_PAYMENT_PENALTY = 20;
    uint256 public constant DEFAULT_PENALTY = 100;
    uint256 public constant POOL_COMPLETED_SCORE = 50;

    // ── Level thresholds ──
    uint256 public constant SILVER_THRESHOLD = 100;
    uint256 public constant GOLD_THRESHOLD = 300;
    uint256 public constant DIAMOND_THRESHOLD = 500;

    // ── Data ──
    struct ReputationData {
        uint256 score;
        uint256 totalPoolsCompleted;
        uint256 totalPoolsJoined;
        uint256 onTimePayments;
        uint256 latePayments;
        uint256 defaults;
        uint256 lastUpdated;
    }

    uint256 private _nextTokenId;
    mapping(address => uint256) public userToTokenId;
    mapping(uint256 => ReputationData) public reputationData;
    mapping(address => bool) public authorizedPools;

    constructor() ERC721("Armina Reputation", "AREP") Ownable(msg.sender) {}

    // ── Soulbound: block all transfers (except minting) ──

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        // Allow minting (from == address(0)), block all transfers
        if (from != address(0) && to != address(0)) {
            revert SoulboundTransfer();
        }
        return super._update(to, tokenId, auth);
    }

    function approve(address, uint256) public pure override {
        revert SoulboundTransfer();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert SoulboundTransfer();
    }

    // ── Mint ──

    function mint() external {
        if (balanceOf(msg.sender) > 0) revert AlreadyHasReputation();

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        userToTokenId[msg.sender] = tokenId;
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

    // ── Pool authorization ──

    function authorizePool(address pool) external onlyOwner {
        authorizedPools[pool] = true;
        emit PoolAuthorized(pool);
    }

    function deauthorizePool(address pool) external onlyOwner {
        authorizedPools[pool] = false;
        emit PoolDeauthorized(pool);
    }

    modifier onlyAuthorizedPool() {
        if (!authorizedPools[msg.sender]) revert NotAuthorizedPool();
        _;
    }

    // ── Record functions (called by authorized pools) ──

    function recordOnTimePayment(address user) external onlyAuthorizedPool {
        _requireReputation(user);
        uint256 tokenId = userToTokenId[user];
        reputationData[tokenId].onTimePayments++;
        reputationData[tokenId].score += ON_TIME_PAYMENT_SCORE;
        reputationData[tokenId].lastUpdated = block.timestamp;
        emit ScoreUpdated(user, reputationData[tokenId].score, "on_time_payment");
    }

    function recordLatePayment(address user) external onlyAuthorizedPool {
        _requireReputation(user);
        uint256 tokenId = userToTokenId[user];
        reputationData[tokenId].latePayments++;
        if (reputationData[tokenId].score >= LATE_PAYMENT_PENALTY) {
            reputationData[tokenId].score -= LATE_PAYMENT_PENALTY;
        } else {
            reputationData[tokenId].score = 0;
        }
        reputationData[tokenId].lastUpdated = block.timestamp;
        emit ScoreUpdated(user, reputationData[tokenId].score, "late_payment");
    }

    function recordDefault(address user) external onlyAuthorizedPool {
        _requireReputation(user);
        uint256 tokenId = userToTokenId[user];
        reputationData[tokenId].defaults++;
        if (reputationData[tokenId].score >= DEFAULT_PENALTY) {
            reputationData[tokenId].score -= DEFAULT_PENALTY;
        } else {
            reputationData[tokenId].score = 0;
        }
        reputationData[tokenId].lastUpdated = block.timestamp;
        emit ScoreUpdated(user, reputationData[tokenId].score, "default");
    }

    function recordPoolCompleted(address user) external onlyAuthorizedPool {
        _requireReputation(user);
        uint256 tokenId = userToTokenId[user];
        reputationData[tokenId].totalPoolsCompleted++;
        reputationData[tokenId].score += POOL_COMPLETED_SCORE;
        reputationData[tokenId].lastUpdated = block.timestamp;
        emit ScoreUpdated(user, reputationData[tokenId].score, "pool_completed");
    }

    function recordPoolJoined(address user) external onlyAuthorizedPool {
        _requireReputation(user);
        uint256 tokenId = userToTokenId[user];
        reputationData[tokenId].totalPoolsJoined++;
        reputationData[tokenId].lastUpdated = block.timestamp;
        emit ScoreUpdated(user, reputationData[tokenId].score, "pool_joined");
    }

    // ── View functions ──

    function hasReputation(address user) external view returns (bool) {
        return balanceOf(user) > 0;
    }

    function getReputation(address user) external view returns (ReputationData memory) {
        if (balanceOf(user) == 0) revert NoReputationToken();
        return reputationData[userToTokenId[user]];
    }

    function getLevel(address user) external view returns (uint8) {
        if (balanceOf(user) == 0) return 0;
        uint256 score = reputationData[userToTokenId[user]].score;
        if (score >= DIAMOND_THRESHOLD) return 3; // Diamond
        if (score >= GOLD_THRESHOLD) return 2;    // Gold
        if (score >= SILVER_THRESHOLD) return 1;  // Silver
        return 0; // Bronze
    }

    function getCollateralDiscount(address user) external view returns (uint8) {
        if (balanceOf(user) == 0) return 0;
        uint256 score = reputationData[userToTokenId[user]].score;
        if (score >= DIAMOND_THRESHOLD) return 25;
        if (score >= GOLD_THRESHOLD) return 20;
        if (score >= SILVER_THRESHOLD) return 10;
        return 0;
    }

    // ── Internal ──

    function _requireReputation(address user) internal view {
        if (balanceOf(user) == 0) revert NoReputationToken();
    }
}
