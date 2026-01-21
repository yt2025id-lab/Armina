"use client";

import { useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { formatUnits } from "viem";
import { Button } from "@/components/ui/Button";
import { formatAddress, formatIDRX } from "@/lib/constants";
import { CONTRACTS } from "@/contracts/abis";
import { useOnboarding, useLanguage } from "@/components/providers";
import { ReputationLevel } from "@/types";

// Mock user profile data
const MOCK_USER_PROFILE = {
  hasNFT: true,
  reputationScore: 280,
  reputationLevel: "silver" as ReputationLevel,
  collateralDiscount: 10,
  idrxBalance: BigInt(15500000000), // 15.5M IDRX
  stats: {
    poolsActive: 2,
    poolsCompleted: 3,
    totalEarned: BigInt(1600000000), // 1.6M IDRX
    totalYield: BigInt(48500000), // 48.5K IDRX
    onTimePayments: 18,
    latePayments: 1,
  },
  recentActivity: [
    { type: "payment", description: "Paid contribution Medium Pool", date: "15 Jan 2026", amount: BigInt(50000000) },
    { type: "win", description: "Won drawing Small Pool", date: "20 Dec 2025", amount: BigInt(50000000) },
    { type: "join", description: "Joined Medium Pool", date: "01 Dec 2025", amount: BigInt(-625000000) },
    { type: "complete", description: "Large Pool completed", date: "15 Nov 2025", amount: BigInt(1875000000) },
  ],
};

const LEVEL_COLORS: Record<ReputationLevel, { bg: string; text: string }> = {
  bronze: { bg: "bg-amber-50", text: "text-amber-700" },
  silver: { bg: "bg-slate-100", text: "text-slate-600" },
  gold: { bg: "bg-yellow-50", text: "text-yellow-700" },
  diamond: { bg: "bg-cyan-50", text: "text-cyan-700" },
};

const LEVEL_LABELS: Record<ReputationLevel, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  diamond: "Diamond",
};

export default function ProfilPage() {
  const { address } = useAccount();
  const [isClaimingFaucet, setIsClaimingFaucet] = useState(false);
  const { showOnboarding } = useOnboarding();
  const { t } = useLanguage();

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address,
    chainId: baseSepolia.id,
  });

  // Use mock data
  const userProfile = MOCK_USER_PROFILE;
  const idrxBalance = userProfile.idrxBalance;
  const levelColor = LEVEL_COLORS[userProfile.reputationLevel];

  const handleClaimFaucet = async () => {
    setIsClaimingFaucet(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsClaimingFaucet(false);
  };

  // For demo purposes, use mock address if not connected
  const displayAddress = address || "0xDemo1234567890abcdef1234567890abcdef12" as `0x${string}`;

  return (
    <div className="px-5 py-8 space-y-6 bg-white min-h-screen">
      {/* Profile Header */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <div className="bg-[#1e2a4a] p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {displayAddress.slice(2, 4).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-white/70 text-sm">{t.walletAddress}</p>
              <p className="font-mono font-semibold">
                {formatAddress(displayAddress)}
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm">{t.reputationStatus}</span>
            <span className={`px-3 py-1 ${levelColor.bg} ${levelColor.text} text-xs font-medium rounded-full`}>
              {LEVEL_LABELS[userProfile.reputationLevel]} · {userProfile.reputationScore} pts
            </span>
          </div>
          {userProfile.collateralDiscount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm">{t.collateralDiscount}</span>
              <span className="text-green-600 font-semibold text-sm">
                -{userProfile.collateralDiscount}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="space-y-3">
        <p className="font-semibold text-slate-900">{t.statistics}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-[#1e2a4a]/5 rounded-2xl border border-[#1e2a4a]/10">
            <p className="text-2xl font-bold text-[#1e2a4a]">{userProfile.stats.poolsActive}</p>
            <p className="text-slate-500 text-sm">{t.activePools}</p>
          </div>
          <div className="p-4 bg-[#1e2a4a]/5 rounded-2xl border border-[#1e2a4a]/10">
            <p className="text-2xl font-bold text-[#1e2a4a]">{userProfile.stats.poolsCompleted}</p>
            <p className="text-slate-500 text-sm">{t.completedPools2}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
            <p className="text-2xl font-bold text-green-600">{formatIDRX(userProfile.stats.totalEarned)}</p>
            <p className="text-slate-500 text-sm">{t.totalPotReceived}</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <p className="text-2xl font-bold text-emerald-600">+{formatIDRX(userProfile.stats.totalYield)}</p>
            <p className="text-slate-500 text-sm">{t.totalYield}</p>
          </div>
        </div>

        {/* Payment Stats */}
        <div className="p-4 border border-slate-200 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-700 font-medium">{t.paymentHistory}</span>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-500 text-sm">{t.onTime}</span>
              </div>
              <p className="text-xl font-bold text-slate-900 mt-1">{userProfile.stats.onTimePayments}</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-slate-500 text-sm">{t.late}</span>
              </div>
              <p className="text-xl font-bold text-slate-900 mt-1">{userProfile.stats.latePayments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Balances */}
      <div className="space-y-3">
        <p className="font-semibold text-slate-900">{t.balance}</p>

        <div className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1e2a4a]/5 rounded-full flex items-center justify-center">
              <span className="text-[#1e2a4a] font-bold">E</span>
            </div>
            <div>
              <p className="font-medium text-slate-900">ETH (Base Sepolia)</p>
              <p className="text-slate-500 text-xs">{t.gasFeeToken}</p>
            </div>
          </div>
          <p className="font-semibold text-slate-900">
            {ethBalance
              ? parseFloat(formatUnits(ethBalance.value, ethBalance.decimals)).toFixed(4)
              : "0.0000"}{" "}
            ETH
          </p>
        </div>

        <div className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold">I</span>
            </div>
            <div>
              <p className="font-medium text-slate-900">IDRX</p>
              <p className="text-slate-500 text-xs">{t.arisanToken}</p>
            </div>
          </div>
          <p className="font-semibold text-slate-900">{formatIDRX(idrxBalance)}</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-3">
        <p className="font-semibold text-slate-900">{t.recentActivity}</p>
        <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100">
          {userProfile.recentActivity.map((activity, index) => (
            <div key={index} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.type === "win" ? "bg-green-100" :
                  activity.type === "payment" ? "bg-blue-100" :
                  activity.type === "join" ? "bg-purple-100" :
                  "bg-emerald-100"
                }`}>
                  <span className={`font-bold text-sm ${
                    activity.type === "win" ? "text-green-600" :
                    activity.type === "payment" ? "text-blue-600" :
                    activity.type === "join" ? "text-purple-600" :
                    "text-emerald-600"
                  }`}>
                    {activity.type === "win" ? "W" :
                     activity.type === "payment" ? "P" :
                     activity.type === "join" ? "J" : "C"}
                  </span>
                </div>
                <div>
                  <p className="text-slate-900 text-sm font-medium">{activity.description}</p>
                  <p className="text-slate-400 text-xs">{activity.date}</p>
                </div>
              </div>
              <span className={`font-semibold text-sm ${
                activity.amount > 0 ? "text-green-600" : "text-slate-500"
              }`}>
                {activity.amount > 0 ? "+" : ""}{formatIDRX(activity.amount < 0 ? -activity.amount : activity.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Faucet */}
      <div className="p-5 border border-slate-200 rounded-2xl">
        <p className="font-semibold text-slate-900 mb-1">{t.idrxFaucet}</p>
        <p className="text-slate-500 text-sm mb-4">
          {t.faucetCooldown}
        </p>
        <Button
          className="w-full"
          onClick={handleClaimFaucet}
          isLoading={isClaimingFaucet}
        >
          {t.claimIdrxAmount}
        </Button>
      </div>

      {/* Links */}
      <div className="space-y-3">
        <p className="font-semibold text-slate-900">{t.links}</p>

        <button
          onClick={showOnboarding}
          className="block w-full p-4 border border-slate-200 rounded-2xl hover:border-[#1e2a4a] hover:bg-[#1e2a4a]/5 transition-all text-left"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-700">{t.howToPlay}</span>
            <span className="text-slate-400 text-sm">→</span>
          </div>
        </button>

        <a
          href={`https://sepolia.basescan.org/address/${displayAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 border border-slate-200 rounded-2xl hover:border-[#1e2a4a] hover:bg-[#1e2a4a]/5 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-700">{t.viewOnBaseScan}</span>
            <span className="text-slate-400 text-sm">→</span>
          </div>
        </a>

        {CONTRACTS.IDRX && (
          <a
            href={`https://sepolia.basescan.org/address/${CONTRACTS.IDRX}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 border border-slate-200 rounded-2xl hover:border-[#1e2a4a] hover:bg-[#1e2a4a]/5 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-700">{t.idrxContract}</span>
              <span className="text-slate-400 text-sm">→</span>
            </div>
          </a>
        )}
      </div>

      {/* App Info */}
      <div className="p-6 bg-slate-50 rounded-2xl text-center">
        <img
          src="/logo.png"
          alt="Armina Logo"
          className="w-24 h-24 mx-auto mb-3 object-contain"
        />
        <p className="text-slate-400 text-xs mt-2">v1.0.0 · Base Sepolia</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="text-slate-500 text-xs">Powered by</span>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF"/>
              <path d="M55.5 22C73.45 22 88 36.55 88 54.5C88 72.45 73.45 87 55.5 87C37.55 87 23 72.45 23 54.5C23 36.55 37.55 22 55.5 22Z" fill="#0052FF"/>
              <path d="M55.5 37C63.51 37 70 43.49 70 51.5V57.5C70 65.51 63.51 72 55.5 72C47.49 72 41 65.51 41 57.5V51.5C41 43.49 47.49 37 55.5 37Z" fill="white"/>
            </svg>
            <span className="text-slate-600 text-xs font-medium">Base</span>
          </div>
          <span className="text-slate-400 text-xs">&</span>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">X</span>
            </div>
            <span className="text-slate-600 text-xs font-medium">IDRX</span>
          </div>
        </div>
      </div>
    </div>
  );
}
