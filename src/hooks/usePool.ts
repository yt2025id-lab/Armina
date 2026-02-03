"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ARMINA_FACTORY_ABI, ARMINA_POOL_ABI, CONTRACTS } from "@/contracts/abis";
import { Pool, PoolTier } from "@/types";
import { usePaymasterCapabilities } from "./usePaymaster";

// Tier mapping from contract enum to our types
const TIER_MAP: Record<number, PoolTier> = {
  0: "small",
  1: "medium",
  2: "large",
};

export function usePoolCount() {
  return useReadContract({
    address: CONTRACTS.FACTORY,
    abi: ARMINA_FACTORY_ABI,
    functionName: "poolCount",
    query: {
      enabled: !!CONTRACTS.FACTORY,
    },
  });
}

export function useOpenPools() {
  return useReadContract({
    address: CONTRACTS.FACTORY,
    abi: ARMINA_FACTORY_ABI,
    functionName: "getOpenPools",
    query: {
      enabled: !!CONTRACTS.FACTORY,
    },
  });
}

export function useActivePools() {
  return useReadContract({
    address: CONTRACTS.FACTORY,
    abi: ARMINA_FACTORY_ABI,
    functionName: "getActivePools",
    query: {
      enabled: !!CONTRACTS.FACTORY,
    },
  });
}

export function useUserPools(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.FACTORY,
    abi: ARMINA_FACTORY_ABI,
    functionName: "getUserPools",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACTS.FACTORY,
    },
  });
}

export function usePoolDetails(poolId: bigint | undefined) {
  const { data, ...rest } = useReadContract({
    address: CONTRACTS.FACTORY,
    abi: ARMINA_FACTORY_ABI,
    functionName: "getPoolDetails",
    args: poolId !== undefined ? [poolId] : undefined,
    query: {
      enabled: poolId !== undefined && !!CONTRACTS.FACTORY,
    },
  });

  // Transform the data
  const pool: Pool | null = data
    ? {
        id: poolId!,
        address: data[0] as `0x${string}`,
        tier: TIER_MAP[0] || "small", // Need to determine tier from contribution
        contribution: data[1],
        collateralRequired: (data[1] * BigInt(data[2]) * BigInt(125)) / BigInt(100), // 125%
        maxParticipants: Number(data[2]),
        currentParticipants: Number(data[3]),
        currentRound: Number(data[4]),
        totalRounds: Number(data[2]),
        startTime: BigInt(0),
        isActive: data[5],
        isCompleted: data[6],
        creator: "0x0000000000000000000000000000000000000000" as `0x${string}`,
      }
    : null;

  return { data: pool, ...rest };
}

export function useCreatePool() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const capabilities = usePaymasterCapabilities();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Tier enum mapping
  const TIER_ENUM: Record<PoolTier, number> = {
    small: 0,
    medium: 1,
    large: 2,
  };

  const createPool = (tier: PoolTier, participantCount: number) => {
    if (!CONTRACTS.FACTORY) return;
    writeContract({
      address: CONTRACTS.FACTORY,
      abi: ARMINA_FACTORY_ABI,
      functionName: "createPool",
      args: [TIER_ENUM[tier], BigInt(participantCount)],
      ...(capabilities && { capabilities }),
    } as any);
  };

  return {
    createPool,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Pool contract hooks

export function usePoolData(poolAddress: `0x${string}` | undefined) {
  const enabled = !!poolAddress;

  const contribution = useReadContract({
    address: poolAddress,
    abi: ARMINA_POOL_ABI as any,
    functionName: "contribution",
    query: { enabled },
  });

  const maxParticipants = useReadContract({
    address: poolAddress,
    abi: ARMINA_POOL_ABI as any,
    functionName: "maxParticipants",
    query: { enabled },
  });

  const participantCount = useReadContract({
    address: poolAddress,
    abi: ARMINA_POOL_ABI as any,
    functionName: "getParticipantCount",
    query: { enabled },
  });

  const currentRound = useReadContract({
    address: poolAddress,
    abi: ARMINA_POOL_ABI as any,
    functionName: "currentRound",
    query: { enabled },
  });

  const isActive = useReadContract({
    address: poolAddress,
    abi: ARMINA_POOL_ABI as any,
    functionName: "isActive",
    query: { enabled },
  });

  const isCompleted = useReadContract({
    address: poolAddress,
    abi: ARMINA_POOL_ABI as any,
    functionName: "isCompleted",
    query: { enabled },
  });

  return {
    contribution: contribution.data,
    maxParticipants: maxParticipants.data,
    participantCount: participantCount.data,
    currentRound: currentRound.data,
    isActive: isActive.data,
    isCompleted: isCompleted.data,
    isLoading:
      contribution.isLoading ||
      maxParticipants.isLoading ||
      participantCount.isLoading,
  };
}

export function useCollateralForUser(
  poolAddress: `0x${string}` | undefined,
  userAddress: `0x${string}` | undefined
) {
  return useReadContract({
    address: poolAddress,
    abi: ARMINA_POOL_ABI as any,
    functionName: "getCollateralForUser",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!poolAddress && !!userAddress,
    },
  });
}

export function useJoinPool() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const capabilities = usePaymasterCapabilities();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const joinPool = (poolAddress: `0x${string}`) => {
    writeContract({
      address: poolAddress,
      abi: ARMINA_POOL_ABI as any,
      functionName: "join",
      ...(capabilities && { capabilities }),
    } as any);
  };

  return {
    joinPool,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useContribute() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const capabilities = usePaymasterCapabilities();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const contribute = (poolAddress: `0x${string}`) => {
    writeContract({
      address: poolAddress,
      abi: ARMINA_POOL_ABI as any,
      functionName: "contribute",
      ...(capabilities && { capabilities }),
    } as any);
  };

  return {
    contribute,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useClaimCollateral() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const capabilities = usePaymasterCapabilities();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimCollateral = (poolAddress: `0x${string}`) => {
    writeContract({
      address: poolAddress,
      abi: ARMINA_POOL_ABI as any,
      functionName: "claimCollateral",
      ...(capabilities && { capabilities }),
    } as any);
  };

  return {
    claimCollateral,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
