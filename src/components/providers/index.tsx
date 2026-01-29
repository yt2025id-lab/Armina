"use client";

import type { ReactNode } from "react";
import { PrivyProvider } from "./PrivyProvider";
import { OnchainKitProvider } from "./OnchainKitProvider";
import { MiniKitProvider } from "./MiniKitProvider";
import { ThemeProvider } from "./ThemeProvider";
import { OnboardingProvider } from "./OnboardingProvider";
import { LanguageProvider } from "./LanguageProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider>
      <MiniKitProvider>
        <OnchainKitProvider>
          <ThemeProvider>
            <LanguageProvider>
              <OnboardingProvider>{children}</OnboardingProvider>
            </LanguageProvider>
          </ThemeProvider>
        </OnchainKitProvider>
      </MiniKitProvider>
    </PrivyProvider>
  );
}

export { useTheme } from "./ThemeProvider";
export { useOnboarding } from "./OnboardingProvider";
export { useLanguage } from "./LanguageProvider";
