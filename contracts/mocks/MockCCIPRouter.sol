// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../ccip/CCIPInterfaces.sol";

/**
 * @title MockCCIPRouter
 * @notice Mock CCIP router for testing cross-chain message reception
 */
contract MockCCIPRouter {
    event MessageSent(uint64 destinationChainSelector, bytes32 messageId);

    uint256 private _messageCounter;

    function ccipSend(
        uint64 destinationChainSelector,
        Client.EVM2AnyMessage calldata /* message */
    ) external payable returns (bytes32) {
        bytes32 messageId = keccak256(
            abi.encodePacked(block.timestamp, msg.sender, _messageCounter++)
        );
        emit MessageSent(destinationChainSelector, messageId);
        return messageId;
    }

    function getFee(
        uint64 /* destinationChainSelector */,
        Client.EVM2AnyMessage memory /* message */
    ) external pure returns (uint256) {
        return 0.01 ether;
    }

    /**
     * @notice Simulate receiving a CCIP message on a receiver contract
     * @dev This contract must be set as the router for the receiver
     */
    function simulateReceive(
        address receiver,
        bytes32 messageId,
        uint64 sourceChainSelector,
        address sender,
        bytes calldata data,
        Client.EVMTokenAmount[] calldata tokenAmounts
    ) external {
        Client.Any2EVMMessage memory message = Client.Any2EVMMessage({
            messageId: messageId,
            sourceChainSelector: sourceChainSelector,
            sender: abi.encode(sender),
            data: data,
            destTokenAmounts: tokenAmounts
        });

        CCIPReceiver(receiver).ccipReceive(message);
    }
}
