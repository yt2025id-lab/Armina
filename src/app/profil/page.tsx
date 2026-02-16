"use client";

import { useState, useEffect } from "react";
import { useBalance } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { useAuth } from "@/hooks/useAuth";
import { formatUnits } from "viem";
import { Button } from "@/components/ui/Button";
import { formatAddress, formatIDRX } from "@/lib/constants";
import { CONTRACTS } from "@/contracts/abis";
import { useOnboarding, useLanguage } from "@/components/providers";
import { ReputationLevel } from "@/types";
import { useIDRXBalance, useClaimFaucet } from "@/hooks/useIDRX";
import { useReputationData, useHasReputation, useCollateralDiscount } from "@/hooks/useReputation";
import { useAllPools, useParticipantInfo } from "@/hooks/usePoolData";
import toast from "react-hot-toast";

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
  const { address } = useAuth();
  const { showOnboarding } = useOnboarding();
  const { t } = useLanguage();

  // Real balance data
  const { data: ethBalance } = useBalance({
    address,
    chainId: baseSepolia.id,
  });
  const { data: idrxBalanceRaw } = useIDRXBalance(address);
  const idrxBalance = idrxBalanceRaw as bigint | undefined;

  // Reputation data (will return null if contract not deployed)
  const { data: reputation } = useReputationData(address);
  const { data: hasNFT } = useHasReputation(address);
  const { data: discountRaw } = useCollateralDiscount(address);
  const discount = discountRaw as number | undefined;

  // Pool data
  const { pools, activePools, completedPools } = useAllPools();

  // Faucet
  const { claimFaucet, isPending: isClaimingFaucet, isSuccess: claimSuccess } = useClaimFaucet();

  useEffect(() => {
    if (claimSuccess) {
      toast.success("Claimed 500,000 IDRX!");
    }
  }, [claimSuccess]);

  const handleClaimFaucet = () => {
    claimFaucet();
  };

  const displayAddress = address || ("0x0000000000000000000000000000000000000000" as `0x${string}`);

  // Derive reputation display from real data or defaults
  const reputationLevel: ReputationLevel = reputation?.level || "bronze";
  const reputationScore = reputation?.score || 0;
  const collateralDiscount = discount || 0;
  const levelColor = LEVEL_COLORS[reputationLevel];

  // Stats from on-chain data
  const poolsActive = activePools.length;
  const poolsCompleted = completedPools.length;

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
              <p className="text-white/70 text-base">{t.walletAddress}</p>
              <p className="font-mono font-semibold text-lg">
                {formatAddress(displayAddress)}
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-base">{t.reputationStatus}</span>
            <span className={`px-3 py-1 ${levelColor.bg} ${levelColor.text} text-sm font-medium rounded-full`}>
              {LEVEL_LABELS[reputationLevel]} · {reputationScore} pts
            </span>
          </div>
          {collateralDiscount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-base">{t.collateralDiscount}</span>
              <span className="text-green-600 font-semibold text-base">
                -{collateralDiscount}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="space-y-3">
        <p className="font-semibold text-slate-900 text-lg">{t.statistics}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-[#1e2a4a]/5 rounded-2xl border border-[#1e2a4a]/10">
            <p className="text-3xl font-bold text-[#1e2a4a]">{poolsActive}</p>
            <p className="text-slate-500 text-base">{t.activePools}</p>
          </div>
          <div className="p-4 bg-[#1e2a4a]/5 rounded-2xl border border-[#1e2a4a]/10">
            <p className="text-3xl font-bold text-[#1e2a4a]">{poolsCompleted}</p>
            <p className="text-slate-500 text-base">{t.completedPools2}</p>
          </div>
        </div>

        {/* Payment Stats from reputation */}
        {reputation && (
          <div className="p-4 border border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-700 font-medium text-base">{t.paymentHistory}</span>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-slate-500 text-base">{t.onTime}</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-1">{reputation.onTimePayments}</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span className="text-slate-500 text-base">{t.late}</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-1">{reputation.latePayments}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Balances */}
      <div className="space-y-3">
        <p className="font-semibold text-slate-900 text-lg">{t.balance}</p>

        {/* Single container with 2 columns */}
        <div className="p-4 border border-slate-200 rounded-2xl">
          <div className="grid grid-cols-2 gap-4 divide-x divide-slate-200">
            {/* ETH Column - Left */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-[#1e2a4a]/5 rounded-full flex items-center justify-center">
                  <span className="text-[#1e2a4a] font-bold text-base">E</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-base">ETH (Base Sepolia)</p>
                  <p className="text-slate-500 text-sm">{t.gasFeeToken}</p>
                </div>
              </div>
              <p className="font-semibold text-slate-900 text-right text-lg">
                {ethBalance
                  ? parseFloat(formatUnits(ethBalance.value, ethBalance.decimals)).toFixed(4)
                  : "0.0000"}{" "}
                ETH
              </p>
            </div>

            {/* IDRX Column - Right */}
            <div className="flex flex-col pl-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-base">I</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-base">IDRX</p>
                  <p className="text-slate-500 text-sm">{t.arisanToken}</p>
                </div>
              </div>
              <p className="font-semibold text-slate-900 text-right text-lg">
                {idrxBalance !== undefined ? formatIDRX(idrxBalance) : "Loading..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Faucet */}
      <div id="faucet" className="p-5 border border-slate-200 rounded-2xl">
        <p className="font-semibold text-slate-900 mb-1 text-lg">{t.idrxFaucet}</p>
        <p className="text-slate-500 text-base mb-4">
          {t.faucetCooldown}
        </p>
        <Button
          className="w-full text-base py-3"
          onClick={handleClaimFaucet}
          isLoading={isClaimingFaucet}
        >
          {t.claimIdrxAmount}
        </Button>
      </div>

      {/* Links */}
      <div className="space-y-3">
        <p className="font-semibold text-slate-900 text-lg">{t.links}</p>

        <button
          onClick={showOnboarding}
          className="block w-full p-4 border border-slate-200 rounded-2xl hover:border-[#1e2a4a] hover:bg-[#1e2a4a]/5 transition-all text-left"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-700 text-base">{t.howToPlay}</span>
            <span className="text-slate-400 text-base">&rarr;</span>
          </div>
        </button>

        <a
          href={`https://sepolia.basescan.org/address/${displayAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 border border-slate-200 rounded-2xl hover:border-[#1e2a4a] hover:bg-[#1e2a4a]/5 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-700 text-base">{t.viewOnBaseScan}</span>
            <span className="text-slate-400 text-base">&rarr;</span>
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
              <span className="text-slate-700 text-base">{t.idrxContract}</span>
              <span className="text-slate-400 text-base">&rarr;</span>
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
        <p className="text-slate-400 text-sm mt-2">v1.0.0 · Base Sepolia</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="text-slate-500 text-sm">Powered by</span>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF" />
              <path d="M55.5 22C73.45 22 88 36.55 88 54.5C88 72.45 73.45 87 55.5 87C37.55 87 23 72.45 23 54.5C23 36.55 37.55 22 55.5 22Z" fill="#0052FF" />
              <path d="M55.5 37C63.51 37 70 43.49 70 51.5V57.5C70 65.51 63.51 72 55.5 72C47.49 72 41 65.51 41 57.5V51.5C41 43.49 47.49 37 55.5 37Z" fill="white" />
            </svg>
            <span className="text-slate-600 text-sm font-medium">Base</span>
          </div>
          <span className="text-slate-400 text-sm">&amp;</span>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">X</span>
            </div>
            <span className="text-slate-600 text-sm font-medium">IDRX</span>
          </div>
        </div>
      </div>
    </div>
  );
}
