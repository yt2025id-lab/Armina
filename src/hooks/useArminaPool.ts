import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { ARMINA_POOL_ADDRESS } from '@/contracts/config';
import { ARMINA_POOL_ABI } from '@/contracts/abis';

/**
 * Hook untuk membaca dynamic collateral multiplier dari contract.
 * Contract bisa mengembalikan 125 (normal) atau 150 (jika price feed stale >1 jam).
 * Frontend HARUS pakai nilai ini saat approve, bukan hardcode 125.
 */
export function useCollateralMultiplier() {
  const { data, isLoading } = useReadContract({
    address: ARMINA_POOL_ADDRESS,
    abi: ARMINA_POOL_ABI as any,
    functionName: 'getDynamicCollateralMultiplier',
    query: {
      enabled: !!ARMINA_POOL_ADDRESS,
      staleTime: 60_000, // re-fetch setiap 1 menit
      refetchInterval: 60_000,
    },
  });

  // Default ke 150 (lebih aman) jika data belum tersedia
  const multiplier = data ? Number(data as bigint) : 150;

  return { multiplier, isLoading };
}

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
    writeContractAsync({
      address: ARMINA_POOL_ADDRESS,
      abi: ARMINA_POOL_ABI as any,
      functionName: "joinPool",
      args: [poolId],
      chainId: baseSepolia.id,
      // Gas limit manual: bypass Coinbase Wallet estimation yang selalu gagal.
      // Tanpa ini, wallet menampilkan "Unable to estimate" + Confirm disabled.
      // joinPool melakukan: 1 safeTransferFrom + storage writes → ~150K-300K gas
      // 500K adalah batas aman dengan margin cukup.
      gas: 500_000n,
    });

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
