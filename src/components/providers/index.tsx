"use client";

import type { ReactNode } from "react";
import { OnchainKitProvider } from "./OnchainKitProvider";
import { MiniKitProvider } from "./MiniKitProvider";
import { ThemeProvider } from "./ThemeProvider";
import { OnboardingProvider } from "./OnboardingProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MiniKitProvider>
      <OnchainKitProvider>
        <ThemeProvider>
          <OnboardingProvider>{children}</OnboardingProvider>
        </ThemeProvider>
      </OnchainKitProvider>
    </MiniKitProvider>
  );
}

export { useTheme } from "./ThemeProvider";
export { useOnboarding } from "./OnboardingProvider";
