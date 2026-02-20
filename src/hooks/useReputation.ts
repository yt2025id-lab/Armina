"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { ARMINA_REPUTATION_ABI, CONTRACTS } from "@/contracts/abis";
import { ReputationLevel } from "@/types";
import { getReputationLevel } from "@/lib/constants";

export function useHasReputation(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.REPUTATION,
    abi: ARMINA_REPUTATION_ABI,
    functionName: "hasReputation",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACTS.REPUTATION,
      staleTime: 60_000, // 1 minute
    },
  });
}

export function useReputationData(address: `0x${string}` | undefined) {
  const { data, ...rest } = useReadContract({
    address: CONTRACTS.REPUTATION,
    abi: ARMINA_REPUTATION_ABI,
    functionName: "getReputation",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACTS.REPUTATION,
      staleTime: 60_000, // 1 minute
    },
  });

  // Transform the data
  const reputation = data
    ? {
      score: Number(data.score),
      level: getReputationLevel(Number(data.score)) as ReputationLevel,
      totalPoolsCompleted: Number(data.totalPoolsCompleted),
      totalPoolsJoined: Number(data.totalPoolsJoined),
      onTimePayments: Number(data.onTimePayments),
      latePayments: Number(data.latePayments),
      defaults: Number(data.defaults),
      lastUpdated: data.lastUpdated,
    }
    : null;

  return { data: reputation, ...rest };
}

export function useReputationLevel(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.REPUTATION,
    abi: ARMINA_REPUTATION_ABI,
    functionName: "getLevel",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACTS.REPUTATION,
      staleTime: 60_000, // 1 minute
    },
  });
}

export function useCollateralDiscount(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.REPUTATION,
    abi: ARMINA_REPUTATION_ABI,
    functionName: "getCollateralDiscount",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACTS.REPUTATION,
      staleTime: 60_000, // 1 minute
    },
  });
}

export function useMintReputation() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const mint = () => {
    if (!CONTRACTS.REPUTATION) return;
    writeContract({
      address: CONTRACTS.REPUTATION,
      abi: ARMINA_REPUTATION_ABI,
      functionName: "mint",
      chainId: baseSepolia.id,
    });
  };

  return { mint, hash, isPending, isConfirming, isSuccess, error };
}
