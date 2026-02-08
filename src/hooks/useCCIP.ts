"use client";

import { useReadContract } from "wagmi";
import { ARMINA_CCIP_ABI } from "@/contracts/abis";

const CCIP_ADDRESS = process.env.NEXT_PUBLIC_CCIP_ADDRESS as `0x${string}`;

export function useCCIPTotalJoins() {
  const { data, isLoading, error } = useReadContract({
    address: CCIP_ADDRESS,
    abi: ARMINA_CCIP_ABI as any,
    functionName: "totalCrossChainJoins",
    query: { enabled: !!CCIP_ADDRESS },
  });

  return {
    totalJoins: data ? Number(data) : 0,
    isLoading,
    error,
  };
}

export function useCCIPTotalMessages() {
  const { data, isLoading, error } = useReadContract({
    address: CCIP_ADDRESS,
    abi: ARMINA_CCIP_ABI as any,
    functionName: "getTotalJoinMessages",
    query: { enabled: !!CCIP_ADDRESS },
  });

  return {
    totalMessages: data ? Number(data) : 0,
    isLoading,
    error,
  };
}

export function useCCIPRouter() {
  const { data, isLoading, error } = useReadContract({
    address: CCIP_ADDRESS,
    abi: ARMINA_CCIP_ABI as any,
    functionName: "getRouter",
    query: { enabled: !!CCIP_ADDRESS },
  });

  return {
    router: data as `0x${string}` | undefined,
    isLoading,
    error,
  };
}
