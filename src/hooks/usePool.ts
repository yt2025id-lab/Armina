"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ARMINA_POOL_ABI, CONTRACTS } from "@/contracts/abis";
import { usePaymasterCapabilities } from "./usePaymaster";

/**
 * Read current APY from ArminaPool contract.
 * Note: usePoolCounter, usePoolDetails, useParticipantDetails, usePaymentHistory
 * are defined in usePoolData.ts to avoid duplicate exports.
 */
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
  const capabilities = usePaymasterCapabilities();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createPool = (monthlyAmount: bigint, poolSize: number) => {
    if (!CONTRACTS.ARMINA_POOL) return;
    writeContract({
      address: CONTRACTS.ARMINA_POOL,
      abi: ARMINA_POOL_ABI,
      functionName: "createPool",
      args: [monthlyAmount, poolSize],
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

export function useJoinPool() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const capabilities = usePaymasterCapabilities();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const joinPool = (poolId: bigint) => {
    if (!CONTRACTS.ARMINA_POOL) return;
    writeContract({
      address: CONTRACTS.ARMINA_POOL,
      abi: ARMINA_POOL_ABI,
      functionName: "joinPool",
      args: [poolId],
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

export function useProcessPayment() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const capabilities = usePaymasterCapabilities();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const processPayment = (poolId: bigint, month: number) => {
    if (!CONTRACTS.ARMINA_POOL) return;
    writeContract({
      address: CONTRACTS.ARMINA_POOL,
      abi: ARMINA_POOL_ABI,
      functionName: "processMonthlyPayment",
      args: [poolId, month],
      ...(capabilities && { capabilities }),
    } as any);
  };

  return {
    processPayment,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useClaimSettlement() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const capabilities = usePaymasterCapabilities();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimSettlement = (poolId: bigint) => {
    if (!CONTRACTS.ARMINA_POOL) return;
    writeContract({
      address: CONTRACTS.ARMINA_POOL,
      abi: ARMINA_POOL_ABI,
      functionName: "claimFinalSettlement",
      args: [poolId],
      ...(capabilities && { capabilities }),
    } as any);
  };

  return {
    claimSettlement,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
