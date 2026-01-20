"use client";

import { type ReactNode, useEffect } from "react";

// MiniKit types
declare global {
  interface Window {
    MiniKit?: {
      install: () => void;
      isInstalled: () => boolean;
    };
  }
}

export function MiniKitProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // MiniKit auto-installs when running inside Coinbase Wallet
    // This is a fallback for development/testing
    if (typeof window !== "undefined" && window.MiniKit) {
      window.MiniKit.install();
    }
  }, []);

  return <>{children}</>;
}
