"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ReputationLevel } from "@/types";
import { Button } from "@/components/ui/Button";
import { REPUTATION_LEVELS } from "@/lib/constants";
import { formatAddress } from "@/lib/constants";
import { useReputationData, useHasReputation, useMintReputation } from "@/hooks/useReputation";
import toast from "react-hot-toast";
import { useLanguage } from "@/components/providers";

const LEVEL_COLORS: Record<ReputationLevel, { bg: string; text: string; border: string }> = {
  bronze: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  silver: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-300" },
  gold: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300" },
  diamond: { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-300" },
};

const LEVEL_LABELS: Record<ReputationLevel, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  diamond: "Diamond",
};

export default function PeringkatPage() {
  const { address, isConnected } = useAuth();
  const [activeTab, setActiveTab] = useState<"leaderboard" | "score">("leaderboard");
  const { t } = useLanguage();

  // Real reputation data
  const { data: reputation } = useReputationData(address);
  const { data: hasNFTRaw } = useHasReputation(address);
  const hasNFT = hasNFTRaw as boolean | undefined;
  const { mint, isPending: isMinting, isSuccess: mintSuccess } = useMintReputation();

  const userScore = reputation?.score || 0;
  const userLevel: ReputationLevel = reputation?.level || "bronze";

  const handleMintNFT = () => {
    mint();
    if (mintSuccess) {
      toast.success("Reputation NFT minted!");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="bg-[#1e2a4a] px-5 pt-6 pb-10 text-white">
        <div className="mb-4">
          <h1 className="text-xl font-bold">{t.rankingTitle}</h1>
          <p className="text-white/60 text-sm">{t.leaderboardScore}</p>
        </div>

        {/* User Rank Card */}
        {isConnected && hasNFT ? (
          <div className="p-4 bg-white/10 backdrop-blur rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold">
                    {LEVEL_LABELS[userLevel].charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-white/60">{t.yourLevel}</p>
                  <p className="font-semibold">{address ? formatAddress(address) : "-"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/60">{t.scoreLabel}</p>
                <p className="font-bold text-2xl text-green-400">{userScore}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white/10 backdrop-blur rounded-2xl text-center">
            <p className="text-white/70 text-sm">
              {isConnected ? t.mintNftToJoin : t.connectToSeeRanking}
            </p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-5 py-6 space-y-6 -mt-4 bg-white rounded-t-3xl">
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === "leaderboard"
                ? "bg-[#1e2a4a] text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t.leaderboard}
          </button>
          <button
            onClick={() => setActiveTab("score")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === "score"
                ? "bg-[#1e2a4a] text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t.scoreSystem}
          </button>
        </div>

        {activeTab === "leaderboard" ? (
          <>
            {/* Info about leaderboard */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <p className="text-sm text-slate-600">
                {t.leaderboardOnChainInfo}
                {!hasNFT && isConnected && ` ${t.mintNftToEarnScore}`}
                {!isConnected && ` ${t.connectToParticipate}`}
              </p>
            </div>

            {/* Your Stats */}
            {isConnected && reputation && (
              <div className="p-5 border border-slate-200 rounded-2xl">
                <p className="font-semibold text-slate-900 mb-4">{t.yourStats}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500">{t.scoreLabel}</p>
                    <p className="text-xl font-bold text-[#1e2a4a]">{reputation.score}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500">{t.levelLabel}</p>
                    <p className="text-xl font-bold text-[#1e2a4a]">{LEVEL_LABELS[reputation.level as ReputationLevel]}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl">
                    <p className="text-xs text-slate-500">{t.onTimePaymentsLabel2}</p>
                    <p className="text-xl font-bold text-green-600">{reputation.onTimePayments}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500">{t.poolsCompletedLabel2}</p>
                    <p className="text-xl font-bold text-[#1e2a4a]">{reputation.totalPoolsCompleted}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Mint NFT CTA (if not minted) */}
            {isConnected && !hasNFT && (
              <div className="p-5 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold">NFT</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{t.mintReputationNft}</p>
                    <p className="text-white/70 text-sm">{t.mintReputationNftDesc}</p>
                  </div>
                </div>
                <Button
                  onClick={handleMintNFT}
                  isLoading={isMinting}
                  className="w-full mt-4 bg-white text-[#1e2a4a] hover:bg-white/90"
                >
                  {t.mintFreeNft}
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Score System Tab */}
            <div className="space-y-4">
              {/* How to Earn Points */}
              <div className="p-5 border border-slate-200 rounded-2xl">
                <p className="font-semibold text-slate-900 mb-4">{t.howToEarnPoints}</p>
                <div className="space-y-3">
                  <ScoreItem label={t.payContributionOnTime} points="+10" isPositive />
                  <ScoreItem label={t.completePoolUntilEnd} points="+50" isPositive />
                  <ScoreItem label={t.winDrawing} points="+5" isPositive />
                  <ScoreItem label={t.latePaymentScore} points="-20" isPositive={false} />
                  <ScoreItem label={t.defaultNoPayment} points="-100" isPositive={false} />
                </div>
              </div>

              {/* Level Benefits */}
              <div className="p-5 border border-slate-200 rounded-2xl">
                <p className="font-semibold text-slate-900 mb-4">{t.levelsAndBenefits}</p>
                <div className="space-y-3">
                  {(["bronze", "silver", "gold", "diamond"] as ReputationLevel[]).map((level) => {
                    const colors = LEVEL_COLORS[level];
                    const threshold = REPUTATION_LEVELS[level];
                    const discount = level === "bronze" ? 0 : level === "silver" ? 10 : level === "gold" ? 20 : 25;

                    return (
                      <div
                        key={level}
                        className={`flex items-center justify-between p-3 rounded-xl border ${colors.border} ${colors.bg}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`font-bold ${colors.text}`}>
                            {LEVEL_LABELS[level]}
                          </span>
                          <span className="text-xs text-slate-500">
                            {threshold.min}+ pts
                          </span>
                        </div>
                        <span className={`font-semibold ${discount > 0 ? "text-green-600" : "text-slate-400"}`}>
                          {discount > 0 ? `-${discount}% ${t.collateralReduction}` : t.basicAccess}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* NFT Info */}
              <div className="p-5 bg-[#1e2a4a] rounded-2xl text-white">
                <p className="font-semibold mb-2">{t.soulboundReputationNft}</p>
                <p className="text-white/70 text-sm">{t.soulboundNftDesc}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Score Item Component
function ScoreItem({
  label,
  points,
  isPositive,
}: {
  label: string;
  points: string;
  isPositive: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-700">{label}</span>
      <span
        className={`font-semibold ${
          isPositive ? "text-green-600" : "text-red-500"
        }`}
      >
        {points}
      </span>
    </div>
  );
}
