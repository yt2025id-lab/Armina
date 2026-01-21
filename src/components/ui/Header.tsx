"use client";

import { useAccount, useDisconnect } from "wagmi";
import { formatUnits } from "viem";
import { formatAddress } from "@/lib/constants";
import { useIDRXBalance } from "@/hooks/useIDRX";
import { usePathname } from "next/navigation";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { Address, Avatar, Name, Identity } from "@coinbase/onchainkit/identity";

export function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance, isLoading } = useIDRXBalance(address);

  const formatBalance = (bal: bigint | undefined) => {
    if (!bal) return "0";
    const value = Number(formatUnits(bal, 18));
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1e2a4a] text-white shadow-lg">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* IDRX Balance */}
          {isConnected && address && (
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold">
                {isLoading ? "..." : formatBalance(balance)}
              </span>
              <span className="text-xs text-white/60">IDRX</span>
            </div>
          )}
        </div>

        {/* Hide connect wallet on homepage - it has its own connect button */}
        {!isHomePage && (
          <div className="flex items-center gap-3">
            {isConnected && address ? (
              <Wallet>
                <WalletDropdown>
                  <Identity address={address} schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9">
                    <Avatar className="w-6 h-6" />
                    <Name className="text-sm text-white" />
                    <Address className="text-xs text-white/70 font-mono" />
                  </Identity>
                  <WalletDropdownDisconnect className="text-xs" />
                </WalletDropdown>
              </Wallet>
            ) : (
              <ConnectWallet>
                <button className="text-xs bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
                  Connect Wallet
                </button>
              </ConnectWallet>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
