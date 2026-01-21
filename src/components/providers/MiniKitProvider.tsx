"use client";

import { type ReactNode, useEffect } from "react";
import sdk from "@farcaster/frame-sdk";

export function MiniKitProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const load = async () => {
      try {
        // Initialize Farcaster Frame SDK context
        const context = await sdk.context;

        // Set safe area insets for proper mobile rendering
        sdk.actions.ready({});

        // Log context for debugging (remove in production)
        if (process.env.NODE_ENV === "development") {
          console.log("Farcaster Frame SDK loaded:", context);
        }
      } catch (error) {
        // SDK initialization failed (expected when not in Frame context)
        // This is normal when running in regular browser
        console.log("Running outside Frame context");
      }
    };

    load();
  }, []);

  // Render immediately without waiting for SDK
  return <>{children}</>;
}
