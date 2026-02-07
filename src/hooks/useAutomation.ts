"use client";

import { useReadContract } from "wagmi";
import { AUTOMATION_ADDRESS } from "@/contracts/config";
import { ARMINA_AUTOMATION_ABI } from "@/contracts/abis";

/**
 * Read automation interval (seconds between upkeeps)
 */
export function useAutomationInterval() {
  const { data, isLoading, error } = useReadContract({
    address: AUTOMATION_ADDRESS,
    abi: ARMINA_AUTOMATION_ABI as any,
    functionName: "automationInterval",
    query: { enabled: !!AUTOMATION_ADDRESS },
  });

  return {
    interval: data ? Number(data as bigint) : 0,
    intervalHours: data ? Number(data as bigint) / 3600 : 0,
    isLoading,
    error,
  };
}

/**
 * Read total automated draws performed
 */
export function useTotalAutomatedDraws() {
  const { data, isLoading, error } = useReadContract({
    address: AUTOMATION_ADDRESS,
    abi: ARMINA_AUTOMATION_ABI as any,
    functionName: "totalAutomatedDraws",
    query: { enabled: !!AUTOMATION_ADDRESS },
  });

  return {
    totalDraws: data ? Number(data as bigint) : 0,
    isLoading,
    error,
  };
}

/**
 * Read the linked ArminaPool address from automation contract
 */
export function useAutomationPool() {
  const { data, isLoading, error } = useReadContract({
    address: AUTOMATION_ADDRESS,
    abi: ARMINA_AUTOMATION_ABI as any,
    functionName: "arminaPool",
    query: { enabled: !!AUTOMATION_ADDRESS },
  });

  return {
    poolAddress: data as `0x${string}` | undefined,
    isLoading,
    error,
  };
}

/**
 * Read the linked YieldOptimizer address from automation contract
 */
export function useAutomationOptimizer() {
  const { data, isLoading, error } = useReadContract({
    address: AUTOMATION_ADDRESS,
    abi: ARMINA_AUTOMATION_ABI as any,
    functionName: "yieldOptimizer",
    query: { enabled: !!AUTOMATION_ADDRESS },
  });

  return {
    optimizerAddress: data as `0x${string}` | undefined,
    isLoading,
    error,
  };
}

/**
 * Check if upkeep is currently needed
 */
export function useCheckUpkeep() {
  const { data, isLoading, error } = useReadContract({
    address: AUTOMATION_ADDRESS,
    abi: ARMINA_AUTOMATION_ABI as any,
    functionName: "checkUpkeep",
    args: ["0x"],
    query: { enabled: !!AUTOMATION_ADDRESS },
  });

  const result = data as [boolean, string] | undefined;

  return {
    upkeepNeeded: result ? result[0] : false,
    performData: result ? result[1] : "0x",
    isLoading,
    error,
  };
}

/**
 * Read last draw timestamp for a specific pool
 */
export function useLastDrawTimestamp(poolId: number) {
  const { data, isLoading, error } = useReadContract({
    address: AUTOMATION_ADDRESS,
    abi: ARMINA_AUTOMATION_ABI as any,
    functionName: "lastDrawTimestamp",
    args: [BigInt(poolId)],
    query: { enabled: !!AUTOMATION_ADDRESS && poolId >= 0 },
  });

  return {
    lastDrawTimestamp: data ? Number(data as bigint) : 0,
    lastDrawDate: data ? new Date(Number(data as bigint) * 1000) : null,
    isLoading,
    error,
  };
}
