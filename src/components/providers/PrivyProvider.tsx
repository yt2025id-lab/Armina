"use client";

import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth";
import { WagmiProvider as PrivyWagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { baseSepolia } from "viem/chains";
import { createConfig, http } from "wagmi";

const wagmiConfig = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org"
    ),
  },
});

export function PrivyProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    console.warn("NEXT_PUBLIC_PRIVY_APP_ID not set, using placeholder");
  }

  return (
    <PrivyProviderBase
      appId={appId || "placeholder-app-id"}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#1e2a4a",
          logo: "/logo.png",
          showWalletLoginFirst: false,
        },
        loginMethods: ["email", "google", "wallet"],
        defaultChain: baseSepolia,
        supportedChains: [baseSepolia],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <PrivyWagmiProvider config={wagmiConfig}>
          {children}
        </PrivyWagmiProvider>
      </QueryClientProvider>
    </PrivyProviderBase>
  );
}
