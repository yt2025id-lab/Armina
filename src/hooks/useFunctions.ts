"use client";

import { useReadContract } from "wagmi";
import { FUNCTIONS_ADDRESS } from "@/contracts/config";
import { ARMINA_FUNCTIONS_ABI } from "@/contracts/abis";

const PROTOCOL_NAMES: Record<number, string> = {
  0: "None",
  1: "Moonwell",
  2: "Aave V3",
  3: "Compound V3",
  4: "Morpho",
  5: "Seamless",
};

/**
 * Read last APY fetched by Chainlink Functions
 */
export function useFunctionsLastAPY() {
  const { data, isLoading, error } = useReadContract({
    address: FUNCTIONS_ADDRESS,
    abi: ARMINA_FUNCTIONS_ABI as any,
    functionName: "lastAPY",
    query: { enabled: !!FUNCTIONS_ADDRESS },
  });

  return {
    lastAPY: data ? Number(data as bigint) : 0,
    lastAPYPercent: data ? Number(data as bigint) / 100 : 0,
    isLoading,
    error,
  };
}

/**
 * Read last protocol ID that was fetched
 */
export function useFunctionsLastProtocol() {
  const { data, isLoading, error } = useReadContract({
    address: FUNCTIONS_ADDRESS,
    abi: ARMINA_FUNCTIONS_ABI as any,
    functionName: "lastProtocolId",
    query: { enabled: !!FUNCTIONS_ADDRESS },
  });

  const protocolId = data ? Number(data) : 0;

  return {
    protocolId,
    protocolName: PROTOCOL_NAMES[protocolId] || "Unknown",
    isLoading,
    error,
  };
}

/**
 * Read last update timestamp
 */
export function useFunctionsLastUpdated() {
  const { data, isLoading, error } = useReadContract({
    address: FUNCTIONS_ADDRESS,
    abi: ARMINA_FUNCTIONS_ABI as any,
    functionName: "lastUpdated",
    query: { enabled: !!FUNCTIONS_ADDRESS },
  });

  return {
    lastUpdated: data ? Number(data as bigint) : 0,
    lastUpdatedDate: data ? new Date(Number(data as bigint) * 1000) : null,
    isLoading,
    error,
  };
}

/**
 * Read total requests made to Chainlink Functions
 */
export function useFunctionsTotalRequests() {
  const { data, isLoading, error } = useReadContract({
    address: FUNCTIONS_ADDRESS,
    abi: ARMINA_FUNCTIONS_ABI as any,
    functionName: "totalRequests",
    query: { enabled: !!FUNCTIONS_ADDRESS },
  });

  return {
    totalRequests: data ? Number(data as bigint) : 0,
    isLoading,
    error,
  };
}

/**
 * Read last request ID
 */
export function useFunctionsLastRequestId() {
  const { data, isLoading, error } = useReadContract({
    address: FUNCTIONS_ADDRESS,
    abi: ARMINA_FUNCTIONS_ABI as any,
    functionName: "lastRequestId",
    query: { enabled: !!FUNCTIONS_ADDRESS },
  });

  return {
    lastRequestId: data as `0x${string}` | undefined,
    isLoading,
    error,
  };
}

/**
 * Read subscription ID
 */
export function useFunctionsSubscriptionId() {
  const { data, isLoading, error } = useReadContract({
    address: FUNCTIONS_ADDRESS,
    abi: ARMINA_FUNCTIONS_ABI as any,
    functionName: "subscriptionId",
    query: { enabled: !!FUNCTIONS_ADDRESS },
  });

  return {
    subscriptionId: data ? Number(data) : 0,
    isLoading,
    error,
  };
}

/**
 * Read gas limit setting
 */
export function useFunctionsGasLimit() {
  const { data, isLoading, error } = useReadContract({
    address: FUNCTIONS_ADDRESS,
    abi: ARMINA_FUNCTIONS_ABI as any,
    functionName: "gasLimit",
    query: { enabled: !!FUNCTIONS_ADDRESS },
  });

  return {
    gasLimit: data ? Number(data) : 0,
    isLoading,
    error,
  };
}

/**
 * Read the JavaScript source code stored on-chain
 */
export function useFunctionsSource() {
  const { data, isLoading, error } = useReadContract({
    address: FUNCTIONS_ADDRESS,
    abi: ARMINA_FUNCTIONS_ABI as any,
    functionName: "source",
    query: { enabled: !!FUNCTIONS_ADDRESS },
  });

  return {
    source: data as string | undefined,
    isLoading,
    error,
  };
}

export { PROTOCOL_NAMES as FUNCTIONS_PROTOCOL_NAMES };
