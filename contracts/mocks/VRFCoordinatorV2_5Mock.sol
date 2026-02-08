// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/dev/vrf/libraries/VRFV2PlusClient.sol";

/**
 * @title VRFCoordinatorV2_5Mock
 * @notice Mock VRF Coordinator V2.5 for testing ArminaPool with VRFConsumerBaseV2Plus
 */
contract VRFCoordinatorV2_5Mock {
    uint256 private _nextRequestId = 1;
    uint256 private _nextSubId = 1;

    struct Subscription {
        address owner;
        address[] consumers;
        bool exists;
    }

    mapping(uint256 => Subscription) public subscriptions;
    mapping(uint256 => address) public requestConsumer;

    event RandomWordsRequested(
        bytes32 keyHash,
        uint256 requestId,
        uint256 subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords,
        address sender
    );

    event SubscriptionCreated(uint256 indexed subId, address owner);

    function createSubscription() external returns (uint256 subId) {
        subId = _nextSubId++;
        subscriptions[subId].owner = msg.sender;
        subscriptions[subId].exists = true;
        emit SubscriptionCreated(subId, msg.sender);
    }

    function addConsumer(uint256 subId, address consumer) external {
        subscriptions[subId].consumers.push(consumer);
    }

    function fundSubscription(uint256 /* subId */, uint256 /* amount */) external pure {
        // No-op for testing
    }

    function requestRandomWords(
        VRFV2PlusClient.RandomWordsRequest calldata req
    ) external returns (uint256 requestId) {
        requestId = _nextRequestId++;
        requestConsumer[requestId] = msg.sender;

        emit RandomWordsRequested(
            req.keyHash,
            requestId,
            req.subId,
            req.requestConfirmations,
            req.callbackGasLimit,
            req.numWords,
            msg.sender
        );
    }

    /**
     * @notice Simulate VRF callback — call rawFulfillRandomWords on the consumer
     */
    function fulfillRandomWords(uint256 requestId, address consumer) external {
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = uint256(keccak256(abi.encodePacked(requestId, block.timestamp, block.prevrandao)));

        // Call rawFulfillRandomWords on the consumer
        (bool success, ) = consumer.call(
            abi.encodeWithSignature("rawFulfillRandomWords(uint256,uint256[])", requestId, randomWords)
        );
        require(success, "fulfillRandomWords failed");
    }

    /**
     * @notice Simulate VRF callback with specific random words
     */
    function fulfillRandomWordsWithOverride(
        uint256 requestId,
        address consumer,
        uint256[] memory randomWords
    ) external {
        (bool success, ) = consumer.call(
            abi.encodeWithSignature("rawFulfillRandomWords(uint256,uint256[])", requestId, randomWords)
        );
        require(success, "fulfillRandomWords failed");
    }
}
