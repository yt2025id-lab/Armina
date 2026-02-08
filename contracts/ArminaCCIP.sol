// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ccip/CCIPInterfaces.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IArminaPoolCCIP
 * @notice Minimal interface for cross-chain pool joining
 */
interface IArminaPoolCCIP {
    function joinPoolFor(uint256 poolId, address participant) external;
}

/**
 * @title ArminaCCIP
 * @notice Chainlink CCIP receiver for cross-chain pool participation
 * @dev Receives CCIP messages from other chains (e.g., Ethereum Sepolia)
 *      and calls ArminaPool.joinPoolFor() to register cross-chain participants.
 *
 * Flow:
 * 1. User on Ethereum Sepolia sends CCIP message with (poolId, participant, amount)
 * 2. Chainlink CCIP delivers message to this contract on Base Sepolia
 * 3. This contract approves tokens and calls ArminaPool.joinPoolFor()
 * 4. Participant is registered in the pool on Base
 *
 * Security:
 * - Only allowed source chains can send messages
 * - Only allowed sender contracts on those chains are accepted
 * - Only the CCIP router can call ccipReceive()
 */
contract ArminaCCIP is CCIPReceiver, Ownable {
    IArminaPoolCCIP public arminaPool;
    IERC20 public idrxToken;

    // Allowed source chains
    mapping(uint64 => bool) public allowedSourceChains;
    // Allowed sender contracts on source chains
    mapping(uint64 => mapping(address => bool)) public allowedSenders;

    // Cross-chain join tracking
    struct CrossChainJoin {
        bytes32 messageId;
        uint64 sourceChain;
        address participant;
        uint256 poolId;
        uint256 amount;
        uint256 timestamp;
        bool processed;
    }

    mapping(bytes32 => CrossChainJoin) public crossChainJoins;
    bytes32[] public joinMessageIds;

    uint256 public totalCrossChainJoins;

    // Events
    event CrossChainJoinReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address participant,
        uint256 poolId,
        uint256 amount
    );
    event CrossChainJoinProcessed(
        bytes32 indexed messageId,
        uint256 poolId,
        address participant
    );
    event SourceChainAllowed(uint64 chainSelector, bool allowed);
    event SenderAllowed(uint64 chainSelector, address sender, bool allowed);

    // Errors
    error SourceChainNotAllowed(uint64 sourceChainSelector);
    error SenderNotAllowed(address sender);

    constructor(
        address _router,
        address _pool,
        address _idrx
    ) CCIPReceiver(_router) Ownable(msg.sender) {
        arminaPool = IArminaPoolCCIP(_pool);
        idrxToken = IERC20(_idrx);
    }

    /**
     * @dev Internal handler for incoming CCIP messages
     * @param message The cross-chain message containing pool join data
     */
    function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
        uint64 sourceChain = message.sourceChainSelector;

        // Validate source chain
        if (!allowedSourceChains[sourceChain]) {
            revert SourceChainNotAllowed(sourceChain);
        }

        // Validate sender
        address sender = abi.decode(message.sender, (address));
        if (!allowedSenders[sourceChain][sender]) {
            revert SenderNotAllowed(sender);
        }

        // Decode message: (poolId, participant, contributionAmount)
        (uint256 poolId, address participant, uint256 contributionAmount) =
            abi.decode(message.data, (uint256, address, uint256));

        // Record the cross-chain join
        CrossChainJoin storage join = crossChainJoins[message.messageId];
        join.messageId = message.messageId;
        join.sourceChain = sourceChain;
        join.participant = participant;
        join.poolId = poolId;
        join.amount = contributionAmount;
        join.timestamp = block.timestamp;
        joinMessageIds.push(message.messageId);

        emit CrossChainJoinReceived(
            message.messageId,
            sourceChain,
            participant,
            poolId,
            contributionAmount
        );

        // Approve tokens for pool contract
        if (idrxToken.balanceOf(address(this)) >= contributionAmount) {
            idrxToken.approve(address(arminaPool), contributionAmount);
        }

        // Process: call joinPoolFor on ArminaPool
        try arminaPool.joinPoolFor(poolId, participant) {
            join.processed = true;
            totalCrossChainJoins++;
            emit CrossChainJoinProcessed(message.messageId, poolId, participant);
        } catch {
            // If join fails, tokens remain in this contract for manual recovery
            join.processed = false;
        }
    }

    // ============ Admin Functions ============

    function allowSourceChain(uint64 _chainSelector, bool _allowed) external onlyOwner {
        allowedSourceChains[_chainSelector] = _allowed;
        emit SourceChainAllowed(_chainSelector, _allowed);
    }

    function allowSender(uint64 _chainSelector, address _sender, bool _allowed) external onlyOwner {
        allowedSenders[_chainSelector][_sender] = _allowed;
        emit SenderAllowed(_chainSelector, _sender, _allowed);
    }

    function setArminaPool(address _pool) external onlyOwner {
        arminaPool = IArminaPoolCCIP(_pool);
    }

    // ============ View Functions ============

    function getCrossChainJoin(bytes32 messageId) external view returns (CrossChainJoin memory) {
        return crossChainJoins[messageId];
    }

    function getTotalJoinMessages() external view returns (uint256) {
        return joinMessageIds.length;
    }

    // ============ Emergency Recovery ============

    function recoverTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
}
