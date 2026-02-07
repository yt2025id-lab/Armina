"use client";

import { useReadContract } from "wagmi";
import { ARMINA_POOL_ABI } from "@/contracts/abis";
import { ARMINA_POOL_ADDRESS } from "@/contracts/config";

/**
 * Chainlink Data Feeds - Read the current APY from ArminaPool
 * The pool contract internally uses Chainlink Price Feeds (ETH/USD)
 * for collateral valuation and yield calculations.
 *
 * This hook reads the on-chain APY which is influenced by price feed data.
 */
export function useChainlinkPriceFeed() {
  const { data, isLoading, error } = useReadContract({
    address: ARMINA_POOL_ADDRESS,
    abi: ARMINA_POOL_ABI as any,
    functionName: "getCurrentAPY",
    query: { enabled: !!ARMINA_POOL_ADDRESS },
  });

  return {
    currentAPY: data ? Number(data as bigint) : 0,
    currentAPYPercent: data ? Number(data as bigint) / 100 : 0,
    isLoading,
    error,
  };
}

/**
 * Read the VRF coordinator address from the pool contract
 * (indicates Chainlink VRF integration)
 */
export function useVRFCoordinator() {
  const { data, isLoading, error } = useReadContract({
    address: ARMINA_POOL_ADDRESS,
    abi: ARMINA_POOL_ABI as any,
    functionName: "vrfCoordinator",
    query: { enabled: !!ARMINA_POOL_ADDRESS },
  });

  return {
    vrfCoordinator: data as `0x${string}` | undefined,
    isLoading,
    error,
  };
}

/**
 * Read VRF key hash from pool contract
 */
export function useVRFKeyHash() {
  const { data, isLoading, error } = useReadContract({
    address: ARMINA_POOL_ADDRESS,
    abi: ARMINA_POOL_ABI as any,
    functionName: "keyHash",
    query: { enabled: !!ARMINA_POOL_ADDRESS },
  });

  return {
    keyHash: data as `0x${string}` | undefined,
    isLoading,
    error,
  };
}

/**
 * Read VRF subscription ID from pool contract
 */
export function useVRFSubscriptionId() {
  const { data, isLoading, error } = useReadContract({
    address: ARMINA_POOL_ADDRESS,
    abi: ARMINA_POOL_ABI as any,
    functionName: "subscriptionId",
    query: { enabled: !!ARMINA_POOL_ADDRESS },
  });

  return {
    subscriptionId: data ? Number(data) : 0,
    isLoading,
    error,
  };
}

/**
 * Read VRF callback gas limit from pool contract
 */
export function useVRFCallbackGasLimit() {
  const { data, isLoading, error } = useReadContract({
    address: ARMINA_POOL_ADDRESS,
    abi: ARMINA_POOL_ABI as any,
    functionName: "callbackGasLimit",
    query: { enabled: !!ARMINA_POOL_ADDRESS },
  });

  return {
    callbackGasLimit: data ? Number(data) : 0,
    isLoading,
    error,
  };
}
