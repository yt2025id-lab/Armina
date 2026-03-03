"use client";

import { useAccount, useDisconnect, useConnect } from "wagmi";
import { coinbaseWallet } from "wagmi/connectors";

/**
 * Simple auth hook using wagmi only (Coinbase Wallet EOA).
 * Privy sudah dihapus — tidak diperlukan untuk hackathon ini.
 */
export function useAuth() {
  const { address, isConnected, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect } = useConnect();

  const login = () =>
    connect({
      connector: coinbaseWallet({
        appName: "Armina - Arisan Mini App",
        preference: "eoaOnly",
      }),
    });

  return {
    address,
    isConnected,
    ready: !isConnecting,
    authenticated: isConnected,
    wagmiConnected: isConnected,
    login,
    disconnect,
  };
}
