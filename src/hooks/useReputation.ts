"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useWriteContracts } from "wagmi/experimental";
import { ARMINA_REPUTATION_ABI, CONTRACTS } from "@/contracts/abis";
import { ReputationLevel } from "@/types";
import { getReputationLevel } from "@/lib/constants";
import { usePaymasterCapabilities } from "./usePaymaster";

export function useHasReputation(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.REPUTATION,
    abi: ARMINA_REPUTATION_ABI,
    functionName: "hasReputation",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACTS.REPUTATION,
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
    },
  });
}

export function useMintReputation() {
  const capabilities = usePaymasterCapabilities();
  const { writeContracts, data: batchId, isPending: isPendingBatch, error: batchError } = useWriteContracts();
  const { writeContract, data: hash, isPending: isPendingSingle, error: singleError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const mint = () => {
    if (!CONTRACTS.REPUTATION) return;

    if (capabilities) {
      writeContracts({
        contracts: [{
          address: CONTRACTS.REPUTATION,
          abi: ARMINA_REPUTATION_ABI,
          functionName: "mint",
        }],
        capabilities,
      } as any);
    } else {
      writeContract({
        address: CONTRACTS.REPUTATION,
        abi: ARMINA_REPUTATION_ABI,
        functionName: "mint",
      });
    }
  };

  return {
    mint,
    hash: hash || batchId,
    isPending: isPendingSingle || isPendingBatch,
    isConfirming,
    isSuccess,
    error: singleError || batchError,
  };
}
