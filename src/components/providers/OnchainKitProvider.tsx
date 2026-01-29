"use client";

import { ReactNode } from "react";
import { OnchainKitProvider as OnchainKitBase } from "@coinbase/onchainkit";
import { baseSepolia } from "wagmi/chains";

// Note: WagmiProvider and QueryClientProvider are handled by PrivyProvider
// This component only wraps OnchainKit for UI components
export function OnchainKitProvider({ children }: { children: ReactNode }) {
  return (
    <OnchainKitBase
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={baseSepolia}
    >
      {children}
    </OnchainKitBase>
  );
}
