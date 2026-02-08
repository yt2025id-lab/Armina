// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/libraries/FunctionsRequest.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IYieldOptimizerRebalance
 * @notice Interface for updating APY and triggering rebalance on yield optimizer
 */
interface IYieldOptimizerRebalance {
    function updateAPY(uint8 protocol, uint256 apy) external;
    function rebalance(address pool) external;
}

/**
 * @title ArminaFunctions
 * @notice Chainlink Functions integration for on-chain DeFi APY data
 * @dev Fetches live APY data from DeFiLlama via Chainlink DON,
 *      replacing the centralized off-chain API dependency with
 *      a verifiable, decentralized oracle computation.
 *
 * Flow:
 * 1. Anyone calls requestAPYUpdate()
 * 2. Chainlink DON executes JavaScript source (fetches DeFiLlama)
 * 3. DON returns best protocol ID + APY
 * 4. fulfillRequest() updates the YieldOptimizer contract
 */
contract ArminaFunctions is FunctionsClient, Ownable {
    using FunctionsRequest for FunctionsRequest.Request;

    // Yield optimizer to update and rebalance
    IYieldOptimizerRebalance public yieldOptimizer;

    // ArminaPool address for rebalance target
    address public arminaPool;

    // APY change threshold to trigger rebalance (basis points, 100 = 1%)
    uint256 public rebalanceThreshold = 100;

    // Chainlink Functions configuration
    uint64 public subscriptionId;
    bytes32 public donId;
    uint32 public gasLimit = 300_000;

    // JavaScript source code executed by DON
    string public source;

    // Last request tracking
    bytes32 public lastRequestId;
    bytes public lastResponse;
    bytes public lastError;
    uint256 public lastUpdated;

    // Decoded results
    uint8 public lastProtocolId;
    uint256 public lastAPY;

    // Request counter
    uint256 public totalRequests;

    // Events
    event APYRequested(bytes32 indexed requestId);
    event APYFetched(bytes32 indexed requestId, uint8 protocol, uint256 apy);
    event RebalanceTriggered(address indexed pool, uint8 protocol, uint256 newAPY);
    event RequestFailed(bytes32 indexed requestId, bytes error);

    constructor(
        address _router,
        uint64 _subscriptionId,
        bytes32 _donId
    ) FunctionsClient(_router) Ownable(msg.sender) {
        subscriptionId = _subscriptionId;
        donId = _donId;

        // Default JavaScript source for DeFiLlama APY fetch
        source = "const r=await Functions.makeHttpRequest({url:'https://yields.llama.fi/pools'});"
            "const pools=r.data.data.filter(p=>p.chain==='Base'&&p.stablecoin&&p.tvlUsd>1e5).sort((a,b)=>b.apy-a.apy);"
            "const m={moonwell:1,'aave-v3':2,'compound-v3':3,morpho:4,'seamless-protocol':5};"
            "const b=pools.find(p=>m[p.project]);"
            "const pid=b?m[b.project]:4;"
            "const apy=b?Math.round(b.apy*100):1400;"
            "return Functions.encodeUint256(BigInt(pid)*BigInt(1e18)+BigInt(apy));";
    }

    /**
     * @notice Request APY update from Chainlink Functions DON
     * @return requestId The Chainlink Functions request ID
     */
    function requestAPYUpdate() external returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);

        requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donId
        );

        lastRequestId = requestId;
        totalRequests++;

        emit APYRequested(requestId);
        return requestId;
    }

    /**
     * @dev Callback from Chainlink DON with APY data
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        lastResponse = response;
        lastError = err;
        lastUpdated = block.timestamp;

        if (response.length > 0 && err.length == 0) {
            // Decode: value = protocolId * 1e18 + apy
            uint256 value = abi.decode(response, (uint256));
            uint8 protocolId = uint8(value / 1e18);
            uint256 apy = value % 1e18;

            // Store previous APY for delta check
            uint256 previousAPY = lastAPY;

            lastProtocolId = protocolId;
            lastAPY = apy;

            // Update yield optimizer
            if (address(yieldOptimizer) != address(0) && protocolId > 0 && protocolId <= 5) {
                try yieldOptimizer.updateAPY(protocolId, apy) {} catch {}

                // Auto-trigger rebalance if APY changed significantly
                if (arminaPool != address(0) && previousAPY > 0) {
                    uint256 apyDiff = apy > previousAPY ? apy - previousAPY : previousAPY - apy;
                    if (apyDiff >= rebalanceThreshold) {
                        try yieldOptimizer.rebalance(arminaPool) {
                            emit RebalanceTriggered(arminaPool, protocolId, apy);
                        } catch {}
                    }
                }
            }

            emit APYFetched(requestId, protocolId, apy);
        } else {
            emit RequestFailed(requestId, err);
        }
    }

    // ============ Admin Functions ============

    function setYieldOptimizer(address _optimizer) external onlyOwner {
        yieldOptimizer = IYieldOptimizerRebalance(_optimizer);
    }

    function setArminaPool(address _pool) external onlyOwner {
        arminaPool = _pool;
    }

    function setRebalanceThreshold(uint256 _threshold) external onlyOwner {
        rebalanceThreshold = _threshold;
    }

    function setSource(string calldata _source) external onlyOwner {
        source = _source;
    }

    function setSubscriptionId(uint64 _subscriptionId) external onlyOwner {
        subscriptionId = _subscriptionId;
    }

    function setDonId(bytes32 _donId) external onlyOwner {
        donId = _donId;
    }

    function setGasLimit(uint32 _gasLimit) external onlyOwner {
        gasLimit = _gasLimit;
    }
}
