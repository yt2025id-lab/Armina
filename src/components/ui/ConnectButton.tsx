"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectWallet, Wallet } from "@coinbase/onchainkit/wallet";

interface ConnectButtonProps {
  className?: string;
  variant?: "primary" | "header";
  children?: React.ReactNode;
}

export function ConnectButton({ className, variant = "primary", children }: ConnectButtonProps) {
  const [showOptions, setShowOptions] = useState(false);
  const { login, authenticated, ready } = usePrivy();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // If already connected via Privy or wagmi, don't show connect options
  if (authenticated || isConnected) {
    return null;
  }

  const handlePrivyLogin = () => {
    setShowOptions(false);
    login();
  };

  if (variant === "header") {
    return (
      <div className="relative">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className={className || "text-xs bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"}
        >
          {children || "Connect"}
        </button>

        {showOptions && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowOptions(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
              <div className="p-2">
                <p className="text-xs text-slate-500 px-3 py-2 font-medium">Login dengan:</p>

                {/* Privy - Email/Google */}
                <button
                  onClick={handlePrivyLogin}
                  className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-50 rounded-lg transition-colors text-left"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Email / Google</p>
                    <p className="text-xs text-slate-500">Untuk mobile & desktop</p>
                  </div>
                </button>

                <div className="h-px bg-slate-100 my-1" />

                {/* Coinbase Smart Wallet */}
                <Wallet>
                  <ConnectWallet className="w-full">
                    <div className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-50 rounded-lg transition-colors text-left cursor-pointer">
                      <div className="w-8 h-8 bg-[#0052FF] rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 32 32" fill="currentColor">
                          <path d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0zm0 22.5c-3.59 0-6.5-2.91-6.5-6.5s2.91-6.5 6.5-6.5 6.5 2.91 6.5 6.5-2.91 6.5-6.5 6.5z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">Coinbase Wallet</p>
                        <p className="text-xs text-slate-500">Smart Wallet / Extension</p>
                      </div>
                    </div>
                  </ConnectWallet>
                </Wallet>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Primary variant (for homepage)
  return (
    <div className="w-full max-w-xs">
      {!showOptions ? (
        <button
          onClick={() => setShowOptions(true)}
          className={className || "w-full py-4 px-8 bg-white text-[#1d2856] rounded-2xl text-center font-bold text-lg hover:bg-slate-50 transition-all shadow-xl cursor-pointer border-4 border-[#1d2856]/20"}
        >
          {children || "Connect"}
        </button>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-[#1d2856]/20">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-700">Pilih metode login:</p>
              <button
                onClick={() => setShowOptions(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Privy - Email/Google */}
            <button
              onClick={handlePrivyLogin}
              className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-xl transition-colors text-left mb-2 border border-blue-100"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Email / Google</p>
                <p className="text-xs text-slate-500">Untuk mobile & desktop</p>
              </div>
            </button>

            {/* Coinbase Smart Wallet */}
            <Wallet>
              <ConnectWallet className="w-full">
                <div className="w-full flex items-center gap-3 p-3 bg-[#0052FF]/5 hover:bg-[#0052FF]/10 rounded-xl transition-colors text-left cursor-pointer border border-[#0052FF]/20">
                  <div className="w-10 h-10 bg-[#0052FF] rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 32 32" fill="currentColor">
                      <path d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0zm0 22.5c-3.59 0-6.5-2.91-6.5-6.5s2.91-6.5 6.5-6.5 6.5 2.91 6.5 6.5-2.91 6.5-6.5 6.5z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Coinbase Wallet</p>
                    <p className="text-xs text-slate-500">Smart Wallet / Extension</p>
                  </div>
                </div>
              </ConnectWallet>
            </Wallet>
          </div>
        </div>
      )}
    </div>
  );
}
