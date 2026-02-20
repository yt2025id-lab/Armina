import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { ARMINA_POOL_ADDRESS } from '@/contracts/config';
import { ARMINA_POOL_ABI } from '@/contracts/abis';

/**
 * Hook for writing to ArminaPool contract
 */
export function useArminaPool() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const writePool = (functionName: string, args: any[]) =>
    writeContractAsync({
      address: ARMINA_POOL_ADDRESS,
      abi: ARMINA_POOL_ABI as any,
      functionName,
      args,
      chainId: baseSepolia.id,
    });

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
    abi: ARMINA_POOL_ABI as any,
    functionName: 'getPoolDetails',
    args: [poolId],
    chainId: baseSepolia.id,
  });

  return {
    poolInfo: data as any,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Note: useParticipantDetails (as useParticipantInfo) and usePoolCounter
 * are defined in usePoolData.ts to avoid duplicate exports.
 */
