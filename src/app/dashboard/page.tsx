"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { StatsSkeleton } from "@/components/ui/LoadingSkeleton";

// Mock user pool data
const MOCK_USER_POOLS = [
  {
    poolId: "1",
    monthlyAmount: 50000000, // 500K in cents
    poolSize: 10,
    currentMonth: 3,
    collateralDeposited: 500000000, // 5M in cents
    collateralYieldEarned: 10000000, // 100K in cents
    collateralUsedForPayments: 0,
    missedPayments: 0,
    totalPenalties: 0,
    hasWon: false,
    wonAtMonth: null,
    potReceived: 0,
    status: "active" as const,
    nextPaymentDate: "2026-02-10",
    apy: 8.5,
    paymentHistory: [
      { month: 1, amount: 50000000, source: "wallet" as const, penalty: 0, date: "2025-12-10" },
      { month: 2, amount: 50000000, source: "wallet" as const, penalty: 0, date: "2026-01-10" },
      { month: 3, amount: 50000000, source: "wallet" as const, penalty: 0, date: "2026-02-10" },
    ],
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [selectedPool, setSelectedPool] = useState(MOCK_USER_POOLS[0]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const formatIDRX = (amount: number) => {
    return new Intl.NumberFormat("id-ID").format(Math.round(amount / 100));
  };

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => setIsLoadingStats(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Calculate projected final payout
  const projectedPayout = useMemo(() => {
    const pool = selectedPool;
    const remainingMonths = pool.poolSize - pool.currentMonth;

    // Projected collateral yield for remaining months
    const monthlyYieldRate = pool.apy / 100 / 12;
    const projectedRemainingYield = pool.collateralDeposited * monthlyYieldRate * remainingMonths;
    const totalProjectedYield = pool.collateralYieldEarned + projectedRemainingYield;

    // If perfect attendance from now
    const perfectPayout =
      pool.collateralDeposited +
      totalProjectedYield -
      pool.collateralUsedForPayments -
      pool.totalPenalties;

    // Current payout (if stopped paying now)
    const currentRemainingPayments = remainingMonths * pool.monthlyAmount;
    const currentPenalties = pool.totalPenalties + (currentRemainingPayments * 0.1);
    const stoppedPayout =
      pool.collateralDeposited +
      totalProjectedYield -
      pool.collateralUsedForPayments -
      currentPenalties -
      currentRemainingPayments;

    return { perfectPayout, stoppedPayout, totalProjectedYield };
  }, [selectedPool]);

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
        ) : (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl">
              <p className="text-xs text-slate-500 mb-1">Total Collateral</p>
              <p className="text-2xl font-bold text-[#1e2a4a]">
                {formatIDRX(selectedPool.collateralDeposited)}
              </p>
              <p className="text-xs text-slate-400">IDRX locked</p>
            </div>

            <div className="p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl">
              <p className="text-xs text-slate-500 mb-1">Yield Earned</p>
              <p className="text-2xl font-bold text-green-600">
                +{formatIDRX(selectedPool.collateralYieldEarned)}
              </p>
              <p className="text-xs text-slate-400">IDRX</p>
            </div>
          </div>
        )}

        {/* Active Pool Card */}
        <div className="mb-6 p-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Pool #{selectedPool.poolId}</h2>
              <p className="text-white/70 text-sm">
                {formatIDRX(selectedPool.monthlyAmount)} IDRX monthly
              </p>
            </div>
            <span className="px-3 py-1 bg-green-400/20 text-green-400 rounded-full text-xs font-semibold">
              Active
            </span>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Month {selectedPool.currentMonth} of {selectedPool.poolSize}</span>
              <span>{Math.round((selectedPool.currentMonth / selectedPool.poolSize) * 100)}% Complete</span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-400"
                style={{ width: `${(selectedPool.currentMonth / selectedPool.poolSize) * 100}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/70 mb-1">Next Payment</p>
              <p className="font-semibold">{selectedPool.nextPaymentDate}</p>
            </div>
            <div>
              <p className="text-white/70 mb-1">Missed Payments</p>
              <p className="font-semibold">
                {selectedPool.missedPayments === 0 ? (
                  <span className="text-green-400">✓ Perfect Record</span>
                ) : (
                  `${selectedPool.missedPayments} payments`
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Collateral Status */}
        <div className="mb-6 p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl">
          <h3 className="font-bold text-[#1e2a4a] mb-4">💎 Collateral Status</h3>

          <div className="space-y-3 text-sm mb-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Initial Deposit</span>
              <span className="font-semibold text-[#1e2a4a]">
                {formatIDRX(selectedPool.collateralDeposited)} IDRX
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600">Yield Earned (So Far)</span>
              <span className="font-semibold text-green-600">
                +{formatIDRX(selectedPool.collateralYieldEarned)} IDRX
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600">Used for Missed Payments</span>
              <span className={`font-semibold ${selectedPool.collateralUsedForPayments > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                {selectedPool.collateralUsedForPayments > 0 ? '-' : ''}
                {formatIDRX(selectedPool.collateralUsedForPayments)} IDRX
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600">Penalties</span>
              <span className={`font-semibold ${selectedPool.totalPenalties > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                {selectedPool.totalPenalties > 0 ? '-' : ''}
                {formatIDRX(selectedPool.totalPenalties)} IDRX
              </span>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <span className="font-bold text-[#1e2a4a]">Current Balance</span>
              <span className="text-xl font-bold text-[#1e2a4a]">
                {formatIDRX(
                  selectedPool.collateralDeposited +
                  selectedPool.collateralYieldEarned -
                  selectedPool.collateralUsedForPayments -
                  selectedPool.totalPenalties
                )} IDRX
              </span>
            </div>
          </div>

          {selectedPool.collateralUsedForPayments === 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-800">
                ✓ <strong>Great job!</strong> Your collateral is intact. Keep paying on time to get it back in full + yield.
              </p>
            </div>
          )}
        </div>

        {/* Projected Final Payout */}
        <div className="mb-6 p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl">
          <h3 className="font-bold text-[#1e2a4a] mb-4">📊 Projected Final Payout</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-xs text-green-700 mb-2">If Perfect Attendance</p>
              <p className="text-2xl font-bold text-green-700">
                {formatIDRX(projectedPayout.perfectPayout)}
              </p>
              <p className="text-xs text-green-600 mt-1">IDRX returned</p>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs text-red-700 mb-2">If Stopped Paying Now</p>
              <p className="text-2xl font-bold text-red-700">
                {formatIDRX(projectedPayout.stoppedPayout)}
              </p>
              <p className="text-xs text-red-600 mt-1">IDRX (with penalties)</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600">
              <strong>Total Projected Yield:</strong> +{formatIDRX(projectedPayout.totalProjectedYield)} IDRX at {selectedPool.apy}% APY
            </p>
          </div>
        </div>

        {/* Payment History */}
        <div className="mb-6 p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl">
          <h3 className="font-bold text-[#1e2a4a] mb-4">💳 Payment History</h3>

          <div className="space-y-2">
            {selectedPool.paymentHistory.map((payment) => (
              <div
                key={payment.month}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    payment.source === 'wallet' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {payment.month}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1e2a4a]">
                      Month {payment.month}
                    </p>
                    <p className="text-xs text-slate-500">{payment.date}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-[#1e2a4a]">
                    {formatIDRX(payment.amount)} IDRX
                  </p>
                  <div className="flex items-center gap-2 justify-end">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      payment.source === 'wallet'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {payment.source === 'wallet' ? '✓ Wallet' : '⚠ Collateral'}
                    </span>
                    {payment.penalty > 0 && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                        +{formatIDRX(payment.penalty)} penalty
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Upcoming payments */}
            {Array.from({ length: selectedPool.poolSize - selectedPool.currentMonth }).map((_, index) => (
              <div
                key={`upcoming-${index}`}
                className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-400">
                    {selectedPool.currentMonth + index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400">
                      Month {selectedPool.currentMonth + index + 1}
                    </p>
                    <p className="text-xs text-slate-400">Upcoming</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-slate-400">
                    {formatIDRX(selectedPool.monthlyAmount)} IDRX
                  </p>
                  <p className="text-xs text-slate-400">Due on 10th</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push("/pools")}
            className="py-3 px-4 bg-white border-2 border-[#1e2a4a] text-[#1e2a4a] rounded-xl font-semibold hover:bg-[#1e2a4a]/5"
          >
            Browse More Pools
          </button>
          <button className="py-3 px-4 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] text-white rounded-xl font-semibold hover:from-[#2a3a5c] hover:to-[#1e2a4a]">
            View AI Optimizer
          </button>
        </div>
      </div>
    </div>
  );
}
