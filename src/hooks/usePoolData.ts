"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { ARMINA_POOL_ADDRESS } from "@/contracts/config";
import { ARMINA_POOL_ABI } from "@/contracts/abis";
import { Pool } from "@/types";

const abi = ARMINA_POOL_ABI;
const address = ARMINA_POOL_ADDRESS;

/**
 * Read pool counter from contract
 */
export function usePoolCounter() {
  return useReadContract({
    address,
    abi,
    functionName: "poolCounter",
    query: { enabled: !!address },
  });
}

/**
 * Read a single pool's details from contract
 */
export function usePoolDetails(poolId: bigint | undefined) {
  const { data, ...rest } = useReadContract({
    address,
    abi,
    functionName: "getPoolDetails",
    args: poolId !== undefined ? [poolId] : undefined,
    query: { enabled: poolId !== undefined && !!address },
  });

  const pool: Pool | null =
    data && poolId !== undefined
      ? {
          id: poolId,
          address: address,
          tier:
            Number((data as any)[2]) <= 5
              ? "small"
              : Number((data as any)[2]) <= 10
              ? "medium"
              : "large",
          contribution: (data as any)[1] as bigint,
          collateralRequired:
            (((data as any)[1] as bigint) *
              BigInt(Number((data as any)[2])) *
              BigInt(125)) /
            BigInt(100),
          maxParticipants: Number((data as any)[2]),
          currentParticipants: Number((data as any)[4]),
          currentRound: Number((data as any)[7]),
          totalRounds: Number((data as any)[2]),
          startTime: (data as any)[6] as bigint,
          isActive: Number((data as any)[5]) === 2, // PoolStatus.Active
          isCompleted: Number((data as any)[5]) === 3, // PoolStatus.Completed
          creator: "0x0000000000000000000000000000000000000000" as `0x${string}`,
        }
      : null;

  return { data: pool, raw: data, ...rest };
}

/**
 * Fetch all pools by iterating poolCounter
 * Returns categorized pools: open, active, completed
 */
export function useAllPools() {
  const { data: poolCount, isLoading: isCountLoading } = usePoolCounter();
  const count = poolCount ? Number(poolCount as bigint) : 0;

  // Build array of contract calls for each pool
  const contracts = Array.from({ length: count }, (_, i) => ({
    address: address as `0x${string}`,
    abi: abi as any,
    functionName: "getPoolDetails" as const,
    args: [BigInt(i + 1)],
  }));

  const { data: poolsData, isLoading: isPoolsLoading, refetch } = useReadContracts({
    contracts: contracts.length > 0 ? contracts : undefined,
    query: { enabled: count > 0 },
  });

  const pools: Pool[] = [];
  if (poolsData) {
    for (let i = 0; i < poolsData.length; i++) {
      const result = poolsData[i];
      if (result.status === "success" && result.result) {
        const d = result.result as any;
        const poolSize = Number(d[2]);
        const statusEnum = Number(d[5]);
        pools.push({
          id: BigInt(i + 1),
          address: address,
          tier: poolSize <= 5 ? "small" : poolSize <= 10 ? "medium" : "large",
          contribution: d[1] as bigint,
          collateralRequired:
            ((d[1] as bigint) * BigInt(poolSize) * BigInt(125)) / BigInt(100),
          maxParticipants: poolSize,
          currentParticipants: Number(d[4]),
          currentRound: Number(d[7]),
          totalRounds: poolSize,
          startTime: d[6] as bigint,
          isActive: statusEnum === 2,
          isCompleted: statusEnum === 3,
          creator: "0x0000000000000000000000000000000000000000" as `0x${string}`,
        });
      }
    }
  }

  const openPools = pools.filter((p) => !p.isActive && !p.isCompleted && p.currentParticipants < p.maxParticipants);
  const activePools = pools.filter((p) => p.isActive && !p.isCompleted);
  const completedPools = pools.filter((p) => p.isCompleted);

  return {
    pools,
    openPools,
    activePools,
    completedPools,
    poolCount: count,
    isLoading: isCountLoading || isPoolsLoading,
    refetch,
  };
}

/**
 * Get participant details for a pool
 */
export function useParticipantInfo(poolId: bigint | undefined, userAddress: `0x${string}` | undefined) {
  const { data, ...rest } = useReadContract({
    address,
    abi,
    functionName: "getParticipantDetails",
    args: poolId !== undefined && userAddress ? [poolId, userAddress] : undefined,
    query: { enabled: poolId !== undefined && !!userAddress && !!address },
  });

  const participant = data
    ? {
        collateralDeposited: (data as any)[0] as bigint,
        collateralYieldEarned: (data as any)[1] as bigint,
        collateralUsedForPayments: (data as any)[2] as bigint,
        missedPayments: Number((data as any)[3]),
        totalPenalties: (data as any)[4] as bigint,
        hasWon: (data as any)[5] as boolean,
        potReceived: (data as any)[6] as bigint,
      }
    : null;

  return { data: participant, ...rest };
}

/**
 * Get payment history for a participant in a pool
 */
export function usePaymentHistory(poolId: bigint | undefined, userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address,
    abi,
    functionName: "getPaymentHistory",
    args: poolId !== undefined && userAddress ? [poolId, userAddress] : undefined,
    query: { enabled: poolId !== undefined && !!userAddress && !!address },
  });
}

/**
 * Get projected payout for a participant
 */
export function useProjectedPayout(poolId: bigint | undefined, userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address,
    abi,
    functionName: "calculateProjectedPayout",
    args: poolId !== undefined && userAddress ? [poolId, userAddress] : undefined,
    query: { enabled: poolId !== undefined && !!userAddress && !!address },
  });
}

/**
 * Get pools where user is a participant by checking events
 * Since there's no getUserPools on ArminaPool, we iterate and check
 */
export function useUserPools(userAddress: `0x${string}` | undefined) {
  const { pools, isLoading: allLoading, refetch } = useAllPools();

  // We can't check on-chain participation without calling getParticipantDetails for each pool
  // For now, return all pools - the dashboard page will filter after checking participation
  return {
    allPools: pools,
    isLoading: allLoading,
    refetch,
  };
}
