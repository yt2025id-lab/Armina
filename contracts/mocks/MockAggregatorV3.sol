// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockAggregatorV3
 * @notice Mock Chainlink Data Feed for testing
 */
contract MockAggregatorV3 {
    int256 private _price;
    uint256 private _updatedAt;
    uint8 private _decimals;

    constructor(int256 initialPrice, uint8 decimals_) {
        _price = initialPrice;
        _decimals = decimals_;
        _updatedAt = block.timestamp;
    }

    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (1, _price, _updatedAt, _updatedAt, 1);
    }

    function decimals() external view returns (uint8) {
        return _decimals;
    }

    // Test helpers
    function setPrice(int256 price) external {
        _price = price;
        _updatedAt = block.timestamp;
    }

    function setStalePrice(int256 price, uint256 staleTime) external {
        _price = price;
        _updatedAt = block.timestamp - staleTime;
    }
}
