"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useAuth } from "@/hooks/useAuth";

interface ConnectButtonProps {
  className?: string;
  variant?: "primary" | "header";
  children?: React.ReactNode;
}

export function ConnectButton({ className, variant = "primary", children }: ConnectButtonProps) {
  const { login } = usePrivy();
  const { isConnected } = useAuth();

  // If already connected via Privy or wagmi, don't show connect options
  if (isConnected) {
    return null;
  }

  if (variant === "header") {
    return (
      <button
        onClick={login}
        className={className || "px-5 py-2 rounded-lg text-base font-medium bg-white/80 text-[#1e2a4a] shadow-sm backdrop-blur-sm hover:bg-white transition-colors"}
      >
        {children || "Connect"}
      </button>
    );
  }

  // Primary variant (for homepage)
  return (
    <div className="w-full max-w-xs">
      <button
        onClick={login}
        className={className || "w-full py-4 px-8 bg-white text-[#1d2856] rounded-2xl text-center font-bold text-xl hover:bg-slate-50 transition-all shadow-xl cursor-pointer border-4 border-[#1d2856]/20"}
      >
        {children || "Connect"}
      </button>
    </div>
  );
}
