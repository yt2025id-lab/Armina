"use client";

import type { ReactNode } from "react";
import { WagmiProvider } from "./WagmiProvider";
import { OnchainKitProvider } from "./OnchainKitProvider";
import { MiniKitProvider } from "./MiniKitProvider";
import { ThemeProvider } from "./ThemeProvider";
import { OnboardingProvider } from "./OnboardingProvider";
import { LanguageProvider } from "./LanguageProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider>
      <MiniKitProvider>
        <OnchainKitProvider>
          <ThemeProvider>
            <LanguageProvider>
              <OnboardingProvider>{children}</OnboardingProvider>
            </LanguageProvider>
          </ThemeProvider>
        </OnchainKitProvider>
      </MiniKitProvider>
    </WagmiProvider>
  );
}

export { useTheme } from "./ThemeProvider";
export { useOnboarding } from "./OnboardingProvider";
export { useLanguage } from "./LanguageProvider";
