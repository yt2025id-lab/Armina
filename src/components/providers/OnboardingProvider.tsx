"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { OnboardingSlides } from "@/components/onboarding/OnboardingSlides";

interface OnboardingContextType {
  showOnboarding: () => void;
  isComplete: boolean;
}

const OnboardingContext = createContext<OnboardingContextType>({
  showOnboarding: () => {},
  isComplete: false,
});

export function useOnboarding() {
  return useContext(OnboardingContext);
}

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [showSlides, setShowSlides] = useState(false);
  const [isComplete, setIsComplete] = useState(true); // Default true to prevent flash
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check localStorage after mount
    const completed = localStorage.getItem("armina_onboarding_complete");
    if (!completed) {
      setShowSlides(true);
      setIsComplete(false);
    }
    setIsLoaded(true);
  }, []);

  const handleComplete = () => {
    setShowSlides(false);
    setIsComplete(true);
  };

  const showOnboarding = () => {
    setShowSlides(true);
  };

  // Don't render anything until we've checked localStorage
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#1e2a4a] flex items-center justify-center">
        <div className="w-16 h-16 relative animate-pulse">
          <div className="w-full h-full bg-white/20 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <OnboardingContext.Provider value={{ showOnboarding, isComplete }}>
      {showSlides && <OnboardingSlides onComplete={handleComplete} />}
      {children}
    </OnboardingContext.Provider>
  );
}
