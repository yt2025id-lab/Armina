"use client";

import type { ReactNode } from "react";
import { PrivyProvider } from "./PrivyProvider";
import { MiniKitProvider } from "./MiniKitProvider";
import { ThemeProvider } from "./ThemeProvider";
import { OnboardingProvider } from "./OnboardingProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider>
      <MiniKitProvider>
        <ThemeProvider>
          <OnboardingProvider>{children}</OnboardingProvider>
        </ThemeProvider>
      </MiniKitProvider>
    </PrivyProvider>
  );
}

export { useTheme } from "./ThemeProvider";
export { useOnboarding } from "./OnboardingProvider";
