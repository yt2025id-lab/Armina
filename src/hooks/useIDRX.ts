"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useWriteContracts } from "wagmi/experimental";
import { IDRX_ABI, CONTRACTS } from "@/contracts/abis";
import { usePaymasterCapabilities } from "./usePaymaster";

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
  const capabilities = usePaymasterCapabilities();

  // Use EIP-5792 writeContracts for paymaster support
  const { writeContracts, data: id, isPending: isPendingBatch, error: batchError } = useWriteContracts();

  // Fallback to regular writeContract when paymaster not available
  const { writeContract, data: hash, isPending: isPendingSingle, error: singleError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimFaucet = () => {
    if (!CONTRACTS.IDRX) return;

    if (capabilities) {
      // Gasless via paymaster (EIP-5792)
      writeContracts({
        contracts: [{
          address: CONTRACTS.IDRX,
          abi: IDRX_ABI,
          functionName: "faucet",
        }],
        capabilities,
      } as any);
    } else {
      // Regular transaction
      writeContract({
        address: CONTRACTS.IDRX,
        abi: IDRX_ABI,
        functionName: "faucet",
      });
    }
  };

  return {
    claimFaucet,
    hash: hash || id,
    isPending: isPendingSingle || isPendingBatch,
    isConfirming,
    isSuccess,
    error: singleError || batchError,
  };
}

export function useApproveIDRX() {
  const capabilities = usePaymasterCapabilities();
  const { writeContracts, data: id, isPending: isPendingBatch, error: batchError } = useWriteContracts();
  const { writeContract, data: hash, isPending: isPendingSingle, error: singleError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = (spender: `0x${string}`, amount: bigint) => {
    if (!CONTRACTS.IDRX) return;

    if (capabilities) {
      writeContracts({
        contracts: [{
          address: CONTRACTS.IDRX,
          abi: IDRX_ABI,
          functionName: "approve",
          args: [spender, amount],
        }],
        capabilities,
      } as any);
    } else {
      writeContract({
        address: CONTRACTS.IDRX,
        abi: IDRX_ABI,
        functionName: "approve",
        args: [spender, amount],
      });
    }
  };

  return {
    approve,
    hash: hash || id,
    isPending: isPendingSingle || isPendingBatch,
    isConfirming,
    isSuccess,
    error: singleError || batchError,
  };
}
