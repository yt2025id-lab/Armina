"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ReputationLevel } from "@/types";
import { Button } from "@/components/ui/Button";
import { REPUTATION_LEVELS } from "@/lib/constants";
import { formatAddress } from "@/lib/constants";

// Mock leaderboard data
const MOCK_LEADERBOARD = [
  { rank: 1, address: "0x1234...5678", score: 850, level: "diamond" as ReputationLevel, poolsCompleted: 12 },
  { rank: 2, address: "0xabcd...efgh", score: 720, level: "gold" as ReputationLevel, poolsCompleted: 10 },
  { rank: 3, address: "0x9876...5432", score: 680, level: "gold" as ReputationLevel, poolsCompleted: 9 },
  { rank: 4, address: "0xfedc...ba98", score: 520, level: "silver" as ReputationLevel, poolsCompleted: 7 },
  { rank: 5, address: "0x1111...2222", score: 480, level: "silver" as ReputationLevel, poolsCompleted: 6 },
  { rank: 6, address: "0x3333...4444", score: 350, level: "silver" as ReputationLevel, poolsCompleted: 5 },
  { rank: 7, address: "0x5555...6666", score: 280, level: "bronze" as ReputationLevel, poolsCompleted: 4 },
  { rank: 8, address: "0x7777...8888", score: 220, level: "bronze" as ReputationLevel, poolsCompleted: 3 },
  { rank: 9, address: "0x9999...0000", score: 150, level: "bronze" as ReputationLevel, poolsCompleted: 2 },
  { rank: 10, address: "0xaaaa...bbbb", score: 100, level: "bronze" as ReputationLevel, poolsCompleted: 1 },
];

// Mock user data
const MOCK_USER = {
  hasNFT: false,
  rank: null as number | null,
  score: 0,
  level: "bronze" as ReputationLevel,
  poolsCompleted: 0,
  onTimePayments: 0,
  latePayments: 0,
  collateralDiscount: 0,
};

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
  const { address, isConnected } = useAccount();
  const [isMinting, setIsMinting] = useState(false);
  const [activeTab, setActiveTab] = useState<"leaderboard" | "score">("leaderboard");

  const user = MOCK_USER;

  const handleMintNFT = async () => {
    setIsMinting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsMinting(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="bg-[#1e2a4a] px-5 pt-6 pb-10 text-white">
        <div className="mb-4">
          <h1 className="text-xl font-bold">Ranking</h1>
          <p className="text-white/60 text-sm">Leaderboard & reputation score</p>
        </div>

        {/* User Rank Card */}
        {isConnected && user.hasNFT ? (
          <div className="p-4 bg-white/10 backdrop-blur rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold">
                    {user.rank ? `#${user.rank}` : "-"}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-white/60">Your Rank</p>
                  <p className="font-semibold">{address ? formatAddress(address) : "-"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/60">Score</p>
                <p className="font-bold text-2xl text-green-400">{user.score}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white/10 backdrop-blur rounded-2xl text-center">
            <p className="text-white/70 text-sm">
              {isConnected ? "Mint NFT to join leaderboard" : "Connect wallet to see ranking"}
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
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab("score")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === "score"
                ? "bg-[#1e2a4a] text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Score System
          </button>
        </div>

        {activeTab === "leaderboard" ? (
          <>
            {/* Top 3 Podium */}
            <div className="flex items-end justify-center gap-2 py-4">
              {/* 2nd Place */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center mb-2 border-2 border-slate-300">
                  <span className="text-slate-600 font-bold">2</span>
                </div>
                <div className="w-20 h-16 bg-slate-100 rounded-t-lg flex flex-col items-center justify-center">
                  <p className="text-xs text-slate-500 truncate w-16 text-center">
                    {MOCK_LEADERBOARD[1].address}
                  </p>
                  <p className="font-bold text-slate-700">{MOCK_LEADERBOARD[1].score}</p>
                </div>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-2 border-2 border-yellow-300">
                  <span className="text-yellow-700 font-bold text-lg">1</span>
                </div>
                <div className="w-24 h-20 bg-yellow-50 rounded-t-lg flex flex-col items-center justify-center border-x-2 border-t-2 border-yellow-200">
                  <p className="text-xs text-slate-500 truncate w-20 text-center">
                    {MOCK_LEADERBOARD[0].address}
                  </p>
                  <p className="font-bold text-yellow-700 text-lg">{MOCK_LEADERBOARD[0].score}</p>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-2 border-2 border-amber-300">
                  <span className="text-amber-700 font-bold">3</span>
                </div>
                <div className="w-20 h-14 bg-amber-50 rounded-t-lg flex flex-col items-center justify-center">
                  <p className="text-xs text-slate-500 truncate w-16 text-center">
                    {MOCK_LEADERBOARD[2].address}
                  </p>
                  <p className="font-bold text-amber-700">{MOCK_LEADERBOARD[2].score}</p>
                </div>
              </div>
            </div>

            {/* Leaderboard List */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="w-10">Rank</span>
                  <span className="flex-1">Address</span>
                  <span className="w-16 text-center">Level</span>
                  <span className="w-16 text-right">Score</span>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {MOCK_LEADERBOARD.map((player) => {
                  const levelColor = LEVEL_COLORS[player.level];
                  return (
                    <div
                      key={player.rank}
                      className={`flex items-center justify-between px-4 py-3 ${
                        player.rank <= 3 ? "bg-slate-50/50" : ""
                      }`}
                    >
                      <span className={`w-10 font-bold ${
                        player.rank === 1 ? "text-yellow-600" :
                        player.rank === 2 ? "text-slate-500" :
                        player.rank === 3 ? "text-amber-600" :
                        "text-slate-400"
                      }`}>
                        #{player.rank}
                      </span>
                      <span className="flex-1 text-sm text-slate-700 font-mono">
                        {player.address}
                      </span>
                      <span className={`w-16 text-center`}>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${levelColor.bg} ${levelColor.text}`}>
                          {LEVEL_LABELS[player.level]}
                        </span>
                      </span>
                      <span className="w-16 text-right font-semibold text-slate-900">
                        {player.score}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mint NFT CTA (if not minted) */}
            {isConnected && !user.hasNFT && (
              <div className="p-5 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold">NFT</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Mint Reputation NFT</p>
                    <p className="text-white/70 text-sm">
                      Free! Start collecting score and join leaderboard
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleMintNFT}
                  isLoading={isMinting}
                  className="w-full mt-4 bg-white text-[#1e2a4a] hover:bg-white/90"
                >
                  Mint Free NFT
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
                <p className="font-semibold text-slate-900 mb-4">How to Earn Points</p>
                <div className="space-y-3">
                  <ScoreItem label="Pay contribution on time" points="+10" isPositive />
                  <ScoreItem label="Complete pool (until end)" points="+50" isPositive />
                  <ScoreItem label="Win drawing" points="+5" isPositive />
                  <ScoreItem label="Late payment (1-3 days)" points="-20" isPositive={false} />
                  <ScoreItem label="Default / no payment" points="-100" isPositive={false} />
                </div>
              </div>

              {/* Level Benefits */}
              <div className="p-5 border border-slate-200 rounded-2xl">
                <p className="font-semibold text-slate-900 mb-4">Levels & Benefits</p>
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
                          {discount > 0 ? `-${discount}% collateral` : "Basic access"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* NFT Info */}
              <div className="p-5 bg-[#1e2a4a] rounded-2xl text-white">
                <p className="font-semibold mb-2">Soulbound Reputation NFT</p>
                <p className="text-white/70 text-sm">
                  This NFT cannot be sold or transferred. Your reputation score is permanently recorded on the blockchain as proof of your credibility.
                </p>
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
