"use client";

import { useAccount } from "wagmi";
import { baseSepolia } from "wagmi/chains";

const PAYMASTER_URL = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY
  ? `https://api.developer.coinbase.com/rpc/v1/base-sepolia/${process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}`
  : undefined;

/**
 * Returns wagmi writeContract capabilities for Coinbase Paymaster (gasless transactions).
 * Pass the returned `capabilities` to writeContract() or writeContractAsync().
 *
 * Requires NEXT_PUBLIC_ONCHAINKIT_API_KEY to be set.
 * If not set, returns undefined (transactions will use normal gas).
 */
export function usePaymasterCapabilities() {
  const { connector } = useAccount();

  // Works with Coinbase Smart Wallet (various connector IDs)
  const isCoinbaseWallet =
    connector?.id === "coinbaseWalletSDK" ||
    connector?.id === "com.coinbase.wallet" ||
    connector?.id === "coinbaseWallet" ||
    connector?.name?.toLowerCase().includes("coinbase");

  if (!PAYMASTER_URL || !isCoinbaseWallet) {
    return undefined;
  }

  return {
    [baseSepolia.id]: {
      paymasterService: {
        url: PAYMASTER_URL,
      },
    },
  };
}
