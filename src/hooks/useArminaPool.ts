import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useWriteContracts } from 'wagmi/experimental';
import { ARMINA_POOL_ADDRESS } from '@/contracts/config';
import ArminaPoolABI from '@/contracts/abis/ArminaPool.json';
import { usePaymasterCapabilities } from './usePaymaster';

/**
 * Hook for writing to ArminaPool contract (with paymaster support)
 */
export function useArminaPool() {
  const capabilities = usePaymasterCapabilities();

  // EIP-5792 for paymaster
  const { writeContractsAsync, data: batchId, isPending: isPendingBatch } = useWriteContracts();

  // Regular fallback
  const { writeContractAsync, data: hash, isPending: isPendingSingle } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const writePool = async (functionName: string, args: any[]) => {
    if (capabilities) {
      return writeContractsAsync({
        contracts: [{
          address: ARMINA_POOL_ADDRESS,
          abi: ArminaPoolABI as any,
          functionName,
          args,
        }],
        capabilities,
      } as any);
    } else {
      return writeContractAsync({
        address: ARMINA_POOL_ADDRESS,
        abi: ArminaPoolABI as any,
        functionName,
        args,
      });
    }
  };

  const createPool = (monthlyAmount: bigint, poolSize: number) =>
    writePool('createPool', [monthlyAmount, poolSize]);

  const joinPool = (poolId: bigint) =>
    writePool('joinPool', [poolId]);

  const processPayment = (poolId: bigint, month: number) =>
    writePool('processMonthlyPayment', [poolId, month]);

  const claimSettlement = (poolId: bigint) =>
    writePool('claimFinalSettlement', [poolId]);

  const requestWinnerDraw = (poolId: bigint) =>
    writePool('requestWinnerDraw', [poolId]);

  return {
    createPool,
    joinPool,
    processPayment,
    claimSettlement,
    requestWinnerDraw,
    isPending: isPendingSingle || isPendingBatch,
    isConfirming,
    isSuccess,
    hash: hash || batchId,
  };
}

/**
 * Hook for reading pool information
 */
export function usePoolInfo(poolId: bigint) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: ARMINA_POOL_ADDRESS,
    abi: ArminaPoolABI as any,
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
    abi: ArminaPoolABI as any,
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
    abi: ArminaPoolABI as any,
    functionName: 'poolCounter',
  });

  return {
    poolCounter: data as bigint,
    isLoading,
    error,
  };
}
