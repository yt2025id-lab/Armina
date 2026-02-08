// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Client
 * @notice Chainlink CCIP message types
 */
library Client {
    struct EVMTokenAmount {
        address token;
        uint256 amount;
    }

    struct Any2EVMMessage {
        bytes32 messageId;
        uint64 sourceChainSelector;
        bytes sender;
        bytes data;
        EVMTokenAmount[] destTokenAmounts;
    }

    struct EVM2AnyMessage {
        bytes receiver;
        bytes data;
        EVMTokenAmount[] tokenAmounts;
        address feeToken;
        bytes extraArgs;
    }
}

/**
 * @title IRouterClient
 * @notice Chainlink CCIP router interface
 */
interface IRouterClient {
    function getFee(
        uint64 destinationChainSelector,
        Client.EVM2AnyMessage memory message
    ) external view returns (uint256 fee);

    function ccipSend(
        uint64 destinationChainSelector,
        Client.EVM2AnyMessage calldata message
    ) external payable returns (bytes32);
}

/**
 * @title CCIPReceiver
 * @notice Abstract base contract for receiving CCIP messages
 */
abstract contract CCIPReceiver {
    address internal immutable i_ccipRouter;

    constructor(address router) {
        i_ccipRouter = router;
    }

    function ccipReceive(Client.Any2EVMMessage calldata message) external {
        require(msg.sender == i_ccipRouter, "Invalid CCIP router");
        _ccipReceive(message);
    }

    function _ccipReceive(Client.Any2EVMMessage memory message) internal virtual;

    function getRouter() public view returns (address) {
        return i_ccipRouter;
    }
}
