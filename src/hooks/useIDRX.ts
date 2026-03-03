"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { IDRX_ABI, CONTRACTS } from "@/contracts/abis";

export function useIDRXDecimals() {
  return useReadContract({
    address: CONTRACTS.IDRX,
    abi: IDRX_ABI,
    functionName: "decimals",
    query: {
      enabled: !!CONTRACTS.IDRX,
      staleTime: Infinity,
    },
  });
}

export function useIDRXBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.IDRX,
    abi: IDRX_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACTS.IDRX,
      staleTime: 10_000,
    },
  });
}

/**
 * Mengembalikan IDRX balance yang sudah dinormalisasi ke 18 desimal.
 *
 * IDRX aslinya punya 2 desimal on-chain, tapi pool amounts disimpan dengan 18 desimal
 * (karena pool dibuat oleh frontend yang pakai parseUnits(..., 18)).
 * Supaya perbandingan `userBalance >= totalNeeded` benar, balance harus discale ke 18 desimal.
 *
 * Contoh:
 *  - Raw balance dari chain: 500_000_000  (= 5.000.000 IDRX × 10^2)
 *  - idrxDecimals dari contract: 2
 *  - normalizedBalance = 500_000_000 × 10^(18-2) = 5 × 10^24
 *  - Pool totalNeeded: 725 × 10^18
 *  - 5 × 10^24 >= 725 × 10^18 → canAfford = true ✅
 */
export function useIDRXBalanceNormalized(address: `0x${string}` | undefined) {
  const { data: rawBalance, isLoading: balLoading } = useIDRXBalance(address);
  const { data: decimals, isLoading: decLoading } = useIDRXDecimals();

  const normalizedBalance: bigint | undefined = (() => {
    if (rawBalance === undefined) return undefined;
    const tokenDecimals = Number(decimals ?? 2); // IDRX = 2 decimals
    const targetDecimals = 18; // Pool amounts pakai 18 decimals
    if (tokenDecimals >= targetDecimals) return rawBalance as bigint;
    // Scale up: multiply by 10^(18 - tokenDecimals)
    const scalingFactor = BigInt(10 ** (targetDecimals - tokenDecimals));
    return (rawBalance as bigint) * scalingFactor;
  })();

  return {
    data: normalizedBalance,
    rawBalance: rawBalance as bigint | undefined,
    isLoading: balLoading || decLoading,
  };
}

export function useIDRXAllowance(
  owner: `0x${string}` | undefined,
  spender: `0x${string}` | undefined
) {
  return useReadContract({
    address: CONTRACTS.IDRX,
    abi: IDRX_ABI,
    functionName: "allowance",
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: !!owner && !!spender && !!CONTRACTS.IDRX,
      staleTime: 10_000,
    },
  });
}

export function useCanClaimFaucet(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.IDRX,
    abi: IDRX_ABI,
    functionName: "canClaimFaucet",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACTS.IDRX,
      staleTime: 10_000,
    },
  });
}

export function useTimeUntilNextClaim(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.IDRX,
    abi: IDRX_ABI,
    functionName: "timeUntilNextClaim",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACTS.IDRX,
      staleTime: 10_000,
    },
  });
}

export function useClaimFaucet() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimFaucet = () => {
    if (!CONTRACTS.IDRX) return;
    writeContract({
      address: CONTRACTS.IDRX,
      abi: IDRX_ABI,
      functionName: "faucet",
      chainId: baseSepolia.id,
    });
  };

  return { claimFaucet, hash, isPending, isConfirming, isSuccess, error };
}

export function useApproveIDRX() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = async (spender: `0x${string}`, amount: bigint, tokenAddress?: `0x${string}`) => {
    const idrxAddr = tokenAddress ?? CONTRACTS.IDRX;
    if (!idrxAddr) return;
    return writeContractAsync({
      address: idrxAddr,
      abi: IDRX_ABI,
      functionName: "approve",
      args: [spender, amount],
      chainId: baseSepolia.id,
    });
  };

  return { approve, hash, isPending, isConfirming, isSuccess, error };
}
