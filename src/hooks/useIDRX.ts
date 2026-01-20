"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { IDRX_ABI, CONTRACTS } from "@/contracts/abis";

export function useIDRXBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.IDRX,
    abi: IDRX_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACTS.IDRX,
    },
  });
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
    },
  });
}

export function useClaimFaucet() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimFaucet = () => {
    if (!CONTRACTS.IDRX) return;
    writeContract({
      address: CONTRACTS.IDRX,
      abi: IDRX_ABI,
      functionName: "faucet",
    });
  };

  return {
    claimFaucet,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useApproveIDRX() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = (spender: `0x${string}`, amount: bigint) => {
    if (!CONTRACTS.IDRX) return;
    writeContract({
      address: CONTRACTS.IDRX,
      abi: IDRX_ABI,
      functionName: "approve",
      args: [spender, amount],
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
