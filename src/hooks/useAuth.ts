"use client";

import { useAccount, useDisconnect } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";

/**
 * Unified auth hook that combines Privy (email/Google) and wagmi (wallet) state.
 * Use this instead of raw useAccount() to properly detect Privy email logins.
 */
export function useAuth() {
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { authenticated, user, ready, logout, login } = usePrivy();
  const { disconnect: wagmiDisconnect } = useDisconnect();

  // Use Privy embedded wallet address as fallback
  const address = wagmiAddress || (user?.wallet?.address as `0x${string}` | undefined);
  const isConnected = ready && (authenticated || wagmiConnected);

  const disconnect = () => {
    wagmiDisconnect();
    logout();
  };

  return {
    address,
    isConnected,
    ready,
    authenticated,
    wagmiConnected,
    login,
    disconnect,
  };
}
