"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { StatsSkeleton } from "@/components/ui/LoadingSkeleton";
import { useAllPools, useParticipantInfo, usePaymentHistory, useProjectedPayout } from "@/hooks/usePoolData";
import { useArminaPool } from "@/hooks/useArminaPool";
import { useCurrentAPY } from "@/hooks/useYieldOptimizer";
import { formatIDRX } from "@/lib/constants";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const router = useRouter();
  const { address, isConnected } = useAuth();
  const { pools, isLoading: isLoadingPools } = useAllPools();
  const { processPayment, requestWinnerDraw, isPending: isPaymentPending } = useArminaPool();
  const { apyPercent: liveAPY } = useCurrentAPY();

  // Find first active pool the user might be in (we show all active pools)
  const activePools = pools.filter((p) => p.isActive && !p.isCompleted);
  const [selectedPoolIndex, setSelectedPoolIndex] = useState(0);
  const selectedPool = activePools[selectedPoolIndex] || null;

  // Participant details for selected pool
  const { data: participant, isLoading: isParticipantLoading } = useParticipantInfo(
    selectedPool?.id,
    address
  );

  // Payment history
  const { data: paymentsRaw } = usePaymentHistory(selectedPool?.id, address);
  const payments = paymentsRaw as any[] | undefined;

  // Projected payout
  const { data: projectedRaw } = useProjectedPayout(selectedPool?.id, address);
  const projectedPayout = projectedRaw as bigint | undefined;

  const handlePayContribution = async () => {
    if (!selectedPool) return;
    try {
      toast.loading("Processing payment...", { id: "payment" });
      await processPayment(selectedPool.id, selectedPool.currentRound);
      toast.success("Payment processed!", { id: "payment" });
    } catch (error) {
      console.error(error);
      toast.error("Payment failed", { id: "payment" });
    }
  };

  const handleDrawWinner = async () => {
    if (!selectedPool) return;
    try {
      toast.loading("Requesting VRF randomness...", { id: "vrf" });
      await requestWinnerDraw(selectedPool.id);
      toast.success("Winner draw requested!", { id: "vrf" });
    } catch (error) {
      console.error(error);
      toast.error("Draw failed — only pool creator or owner can draw", { id: "vrf" });
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1e2a4a] mb-4">Connect Your Wallet</h1>
          <p className="text-slate-600 mb-6">
            Please connect your wallet to view your dashboard
          </p>
          <button className="py-3 px-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] text-white rounded-xl font-bold">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  const isLoadingStats = isLoadingPools || isParticipantLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] px-5 py-8 text-white">
        <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
        <p className="text-white/70 text-sm">Track your pools, payments, and earnings</p>
      </div>

      <div className="px-5 py-6 max-w-4xl mx-auto">
        {/* Quick Stats */}
        {isLoadingStats ? (
          <StatsSkeleton />
        ) : participant ? (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl">
              <p className="text-xs text-slate-500 mb-1">Total Collateral</p>
              <p className="text-2xl font-bold text-[#1e2a4a]">
                {formatIDRX(participant.collateralDeposited)}
              </p>
              <p className="text-xs text-slate-400">IDRX locked</p>
            </div>

            <div className="p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl">
              <p className="text-xs text-slate-500 mb-1">Yield Earned</p>
              <p className="text-2xl font-bold text-green-600">
                +{formatIDRX(participant.collateralYieldEarned)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <p className="text-xs text-green-600 font-medium">{liveAPY.toFixed(1)}% APY</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-6 bg-white border border-slate-200 rounded-2xl text-center">
            <p className="text-slate-500">No pool participation found. Join a pool to get started!</p>
            <button
              onClick={() => router.push("/pool")}
              className="mt-4 py-2 px-6 bg-[#1e2a4a] text-white rounded-xl font-semibold"
            >
              Browse Pools
            </button>
          </div>
        )}

        {/* Active Pool Card */}
        {selectedPool && participant && (
          <div className="mb-6 p-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Pool #{selectedPool.id.toString()}</h2>
                <p className="text-white/70 text-sm">
                  {formatIDRX(selectedPool.contribution)} monthly
                </p>
              </div>
              <span className="px-3 py-1 bg-green-400/20 text-green-400 rounded-full text-xs font-semibold">
                Active
              </span>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Month {selectedPool.currentRound} of {selectedPool.totalRounds}</span>
                <span>{Math.round((selectedPool.currentRound / selectedPool.totalRounds) * 100)}% Complete</span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-400"
                  style={{ width: `${(selectedPool.currentRound / selectedPool.totalRounds) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white/70 mb-1">Missed Payments</p>
                <p className="font-semibold">
                  {participant.missedPayments === 0 ? (
                    <span className="text-green-400">Perfect Record</span>
                  ) : (
                    `${participant.missedPayments} payments`
                  )}
                </p>
              </div>
              <div>
                <p className="text-white/70 mb-1">Won</p>
                <p className="font-semibold">
                  {participant.hasWon ? (
                    <span className="text-green-400">Yes!</span>
                  ) : (
                    "Not yet"
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VRF Draw Winner */}
        {selectedPool && participant && (
          <div className="mb-6 p-5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-purple-900">Chainlink VRF Winner Draw</h3>
                <p className="text-xs text-purple-600">
                  Round {selectedPool.currentRound} of {selectedPool.totalRounds}
                </p>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                VRF V2.5
              </span>
            </div>
            <button
              onClick={handleDrawWinner}
              disabled={isPaymentPending}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {isPaymentPending ? "Requesting..." : "Draw Winner for This Round"}
            </button>
            <p className="text-xs text-purple-500 text-center mt-2">
              Only pool creator or contract owner can trigger the draw
            </p>
          </div>
        )}

        {/* Collateral Status */}
        {participant && (
          <div className="mb-6 p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl">
            <h3 className="font-bold text-[#1e2a4a] mb-4">Collateral Status</h3>

            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Initial Deposit</span>
                <span className="font-semibold text-[#1e2a4a]">
                  {formatIDRX(participant.collateralDeposited)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600">Yield Earned</span>
                <span className="font-semibold text-green-600">
                  +{formatIDRX(participant.collateralYieldEarned)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600">Used for Missed Payments</span>
                <span className={`font-semibold ${participant.collateralUsedForPayments > BigInt(0) ? "text-red-600" : "text-slate-400"}`}>
                  {participant.collateralUsedForPayments > BigInt(0) ? "-" : ""}
                  {formatIDRX(participant.collateralUsedForPayments)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600">Penalties</span>
                <span className={`font-semibold ${participant.totalPenalties > BigInt(0) ? "text-red-600" : "text-slate-400"}`}>
                  {participant.totalPenalties > BigInt(0) ? "-" : ""}
                  {formatIDRX(participant.totalPenalties)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-[#1e2a4a]">Current Balance</span>
                <span className="text-xl font-bold text-[#1e2a4a]">
                  {formatIDRX(
                    participant.collateralDeposited +
                    participant.collateralYieldEarned -
                    participant.collateralUsedForPayments -
                    participant.totalPenalties
                  )}
                </span>
              </div>
            </div>

            {participant.collateralUsedForPayments === BigInt(0) && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-800">
                  <strong>Great job!</strong> Your collateral is intact. Keep paying on time to get it back in full + yield.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Projected Payout */}
        {projectedPayout !== undefined && (
          <div className="mb-6 p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl">
            <h3 className="font-bold text-[#1e2a4a] mb-4">Projected Final Payout</h3>
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-xs text-green-700 mb-2">Estimated Return</p>
              <p className="text-2xl font-bold text-green-700">
                {formatIDRX(projectedPayout)}
              </p>
              <p className="text-xs text-green-600 mt-1">IDRX at pool completion</p>
            </div>
          </div>
        )}

        {/* Payment History */}
        {payments && payments.length > 0 && (
          <div className="mb-6 p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl">
            <h3 className="font-bold text-[#1e2a4a] mb-4">Payment History</h3>
            <div className="space-y-2">
              {payments.map((payment: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      Number(payment.source) === 0 ? "bg-green-500" : "bg-red-500"
                    }`}>
                      {Number(payment.month)}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1e2a4a]">
                        Month {Number(payment.month)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(Number(payment.timestamp) * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#1e2a4a]">
                      {formatIDRX(payment.amount)}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      Number(payment.source) === 0
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {Number(payment.source) === 0 ? "Wallet" : "Collateral"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pay Contribution Button */}
        {selectedPool && participant && (
          <div className="mb-6">
            <button
              onClick={handlePayContribution}
              disabled={isPaymentPending}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold hover:from-amber-600 hover:to-amber-700 disabled:opacity-50"
            >
              {isPaymentPending ? "Processing..." : `Pay Month ${selectedPool.currentRound} Contribution`}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push("/pool")}
            className="py-3 px-4 bg-white border-2 border-[#1e2a4a] text-[#1e2a4a] rounded-xl font-semibold hover:bg-[#1e2a4a]/5"
          >
            Browse More Pools
          </button>
          <button
            onClick={() => router.push("/optimizer")}
            className="py-3 px-4 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] text-white rounded-xl font-semibold hover:from-[#2a3a5c] hover:to-[#1e2a4a]"
          >
            View AI Optimizer
          </button>
        </div>
      </div>
    </div>
  );
}
