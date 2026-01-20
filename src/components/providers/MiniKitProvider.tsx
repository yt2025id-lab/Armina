"use client";

import { type ReactNode, useEffect, useState } from "react";
import sdk from "@farcaster/frame-sdk";

export function MiniKitProvider({ children }: { children: ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      // Initialize Farcaster Frame SDK context
      const context = await sdk.context;

      // Set safe area insets for proper mobile rendering
      sdk.actions.ready({});

      setIsSDKLoaded(true);

      // Log context for debugging (remove in production)
      if (process.env.NODE_ENV === "development") {
        console.log("Farcaster Frame SDK loaded:", context);
      }
    };

    load();
  }, []);

  // Show loading state while SDK initializes
  if (!isSDKLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1e2a4a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-sm">Loading Armina Mini App...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
