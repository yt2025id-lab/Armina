import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ARMINA_POOL_ADDRESS } from '@/contracts/config';
import ArminaPoolABI from '@/contracts/abis/ArminaPool.json';

/**
 * Hook for reading ArminaPool contract data
 */
export function useArminaPool() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Create a new pool
  const createPool = async (monthlyAmount: bigint, poolSize: number) => {
    return writeContractAsync({
      address: ARMINA_POOL_ADDRESS,
      abi: ArminaPoolABI.abi,
      functionName: 'createPool',
      args: [monthlyAmount, poolSize],
    });
  };

  // Join an existing pool
  const joinPool = async (poolId: bigint) => {
    return writeContractAsync({
      address: ARMINA_POOL_ADDRESS,
      abi: ArminaPoolABI.abi,
      functionName: 'joinPool',
      args: [poolId],
    });
  };

  // Process monthly payment
  const processPayment = async (poolId: bigint, month: number) => {
    return writeContractAsync({
      address: ARMINA_POOL_ADDRESS,
      abi: ArminaPoolABI.abi,
      functionName: 'processMonthlyPayment',
      args: [poolId, month],
    });
  };

  // Claim final settlement
  const claimSettlement = async (poolId: bigint) => {
    return writeContractAsync({
      address: ARMINA_POOL_ADDRESS,
      abi: ArminaPoolABI.abi,
      functionName: 'claimFinalSettlement',
      args: [poolId],
    });
  };

  return {
    createPool,
    joinPool,
    processPayment,
    claimSettlement,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}

/**
 * Hook for reading pool information
 */
export function usePoolInfo(poolId: bigint) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: ARMINA_POOL_ADDRESS,
    abi: ArminaPoolABI.abi,
    functionName: 'getPoolInfo',
    args: [poolId],
  });

  return {
    poolInfo: data as any,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for reading participant details
 */
export function useParticipantDetails(poolId: bigint, address: `0x${string}`) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: ARMINA_POOL_ADDRESS,
    abi: ArminaPoolABI.abi,
    functionName: 'getParticipantDetails',
    args: [poolId, address],
  });

  return {
    participant: data as any,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for reading pool counter
 */
export function usePoolCounter() {
  const { data, isLoading, error } = useReadContract({
    address: ARMINA_POOL_ADDRESS,
    abi: ArminaPoolABI.abi,
    functionName: 'poolCounter',
  });

  return {
    poolCounter: data as bigint,
    isLoading,
    error,
  };
}
