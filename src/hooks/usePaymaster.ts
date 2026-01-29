"use client";

import { useAccount } from "wagmi";

const PAYMASTER_URL = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY
  ? `https://api.developer.coinbase.com/rpc/v1/base-sepolia/${process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}`
  : undefined;

/**
 * Returns paymaster capabilities for EIP-5792 writeContracts (wagmi/experimental).
 * Use with useWriteContracts from 'wagmi/experimental'.
 */
export function usePaymasterCapabilities() {
  const { connector } = useAccount();

  const isCoinbaseWallet =
    connector?.id === "coinbaseWalletSDK" ||
    connector?.id === "com.coinbase.wallet" ||
    connector?.id === "coinbaseWallet" ||
    connector?.name?.toLowerCase().includes("coinbase");

  if (!PAYMASTER_URL || !isCoinbaseWallet) {
    return undefined;
  }

  return {
    paymasterService: {
      url: PAYMASTER_URL,
    },
  };
}
