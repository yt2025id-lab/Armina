"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { ARMINA_POOL_ABI, CONTRACTS } from "@/contracts/abis";

export function useCurrentAPY() {
  return useReadContract({
    address: CONTRACTS.ARMINA_POOL,
    abi: ARMINA_POOL_ABI,
    functionName: "getCurrentAPY",
    query: {
      enabled: !!CONTRACTS.ARMINA_POOL,
    },
  });
}

export function useCreatePool() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createPool = (monthlyAmount: bigint, poolSize: number) => {
    if (!CONTRACTS.ARMINA_POOL) return;
    writeContract({
      address: CONTRACTS.ARMINA_POOL,
      abi: ARMINA_POOL_ABI,
      functionName: "createPool",
      args: [monthlyAmount, poolSize],
      chainId: baseSepolia.id,
    });
  };

  return { createPool, hash, isPending, isConfirming, isSuccess, error };
}

export function useJoinPool() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const joinPool = (poolId: bigint) => {
    if (!CONTRACTS.ARMINA_POOL) return;
    writeContract({
      address: CONTRACTS.ARMINA_POOL,
      abi: ARMINA_POOL_ABI,
      functionName: "joinPool",
      args: [poolId],
      chainId: baseSepolia.id,
    });
  };

  return { joinPool, hash, isPending, isConfirming, isSuccess, error };
}

export function useProcessPayment() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const processPayment = (poolId: bigint, month: number) => {
    if (!CONTRACTS.ARMINA_POOL) return;
    writeContract({
      address: CONTRACTS.ARMINA_POOL,
      abi: ARMINA_POOL_ABI,
      functionName: "processMonthlyPayment",
      args: [poolId, month],
      chainId: baseSepolia.id,
    });
  };

  return { processPayment, hash, isPending, isConfirming, isSuccess, error };
}

export function useClaimSettlement() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimSettlement = (poolId: bigint) => {
    if (!CONTRACTS.ARMINA_POOL) return;
    writeContract({
      address: CONTRACTS.ARMINA_POOL,
      abi: ARMINA_POOL_ABI,
      functionName: "claimFinalSettlement",
      args: [poolId],
      chainId: baseSepolia.id,
    });
  };

  return { claimSettlement, hash, isPending, isConfirming, isSuccess, error };
}
