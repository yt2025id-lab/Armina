"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { usePoolDetails, useParticipantInfo } from "@/hooks/usePoolData";
import { useArminaPool } from "@/hooks/useArminaPool";
import { useApproveIDRX } from "@/hooks/useIDRX";
import { ARMINA_POOL_ADDRESS } from "@/contracts/config";
import { formatIDRX, calculateCollateral, formatAddress } from "@/lib/constants";
import toast from "react-hot-toast";

export default function PoolDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const poolId = BigInt(id);
  const router = useRouter();
  const { address, isConnected } = useAccount();

  // Real contract data
  const { data: pool, raw: rawPool, isLoading: isPoolLoading } = usePoolDetails(poolId);
  const { data: participant } = useParticipantInfo(poolId, address);
  const { joinPool, isPending: isJoinPending, isConfirming: isJoinConfirming, isSuccess: joinSuccess } = useArminaPool();
  const { approve, isPending: isApproving } = useApproveIDRX();

  const isJoining = isJoinPending || isJoinConfirming || isApproving;

  useEffect(() => {
    if (joinSuccess) {
      toast.success("Joined pool successfully!", { id: "join" });
    }
  }, [joinSuccess]);

  if (isPoolLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#1e2a4a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading pool data...</p>
        </div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1e2a4a] mb-4">Pool Not Found</h1>
          <p className="text-slate-600 mb-6">Pool #{id} does not exist or has not been created yet.</p>
          <button
            onClick={() => router.push("/pool")}
            className="py-3 px-6 bg-[#1e2a4a] text-white rounded-xl font-bold"
          >
            Browse Pools
          </button>
        </div>
      </div>
    );
  }

  const collateral = calculateCollateral(pool.contribution, pool.maxParticipants);
  const totalDueAtJoin = collateral + pool.contribution;
  const spotsRemaining = pool.maxParticipants - pool.currentParticipants;
  const progressPercentage = (pool.currentParticipants / pool.maxParticipants) * 100;
  const isOpen = !pool.isActive && !pool.isCompleted && spotsRemaining > 0;
  const monthlyPot = pool.contribution * BigInt(pool.maxParticipants);

  // Placeholder APY (from contract: 8%)
  const apy = 8;
  const collateralYield = (Number(collateral) * apy * pool.maxParticipants) / (100 * 12);
  const potYield = (Number(monthlyPot) * apy * pool.maxParticipants) / (100 * 12);

  const handleJoin = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      toast.loading("Approving IDRX...", { id: "approve" });
      approve(ARMINA_POOL_ADDRESS, totalDueAtJoin);

      toast.loading("Joining pool...", { id: "join" });
      await joinPool(poolId);
      toast.dismiss("approve");
    } catch (error) {
      console.error("Error joining pool:", error);
      toast.error("Failed to join pool", { id: "join" });
    }
  };

  const statusLabel = pool.isCompleted
    ? "Completed"
    : pool.isActive
    ? "Active"
    : isOpen
    ? "Open for Joining"
    : "Full";

  const statusColor = pool.isCompleted
    ? "bg-slate-200 text-slate-600"
    : pool.isActive
    ? "bg-green-100 text-green-700"
    : isOpen
    ? "bg-blue-100 text-blue-700"
    : "bg-amber-100 text-amber-700";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] px-5 py-8 text-white">
        <button
          onClick={() => router.back()}
          className="mb-4 text-white/80 hover:text-white flex items-center gap-2"
        >
          &larr; Back to Pools
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Pool #{id}</h1>
            <p className="text-white/70 text-sm">
              {formatIDRX(pool.contribution)} / month &middot; {pool.maxParticipants} Participants
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{apy}%</div>
            <div className="text-xs text-white/70">APY</div>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto">
        {/* Pool Status Banner */}
        <div className="mb-6 p-5 bg-white border-2 border-[#1e2a4a]/20 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[#1e2a4a]">Pool Status</h2>
            <span className={`px-3 py-1 ${statusColor} rounded-full text-xs font-semibold`}>
              {statusLabel}
            </span>
          </div>

          <div className="mb-3">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">
                {pool.currentParticipants} / {pool.maxParticipants} Participants
              </span>
              <span className="text-[#1e2a4a] font-semibold">
                {spotsRemaining > 0 ? `${spotsRemaining} spots left` : "Pool full"}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {pool.isActive && (
            <p className="text-xs text-green-600 font-medium">
              Round {pool.currentRound} of {pool.totalRounds}
            </p>
          )}

          {isOpen && (
            <p className="text-xs text-slate-500">
              Pool will start automatically when all {pool.maxParticipants} spots are filled
            </p>
          )}
        </div>

        {/* Payment Breakdown Card */}
        {isOpen && (
          <div className="mb-6 p-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white">
            <h2 className="font-bold text-lg mb-4">Required Payment to Join</h2>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white/70 text-sm">Security Collateral (125%)</p>
                  <p className="text-xs text-white/60">
                    = 125% x ({pool.maxParticipants} x {formatIDRX(pool.contribution)})
                  </p>
                </div>
                <p className="text-xl font-bold">{formatIDRX(collateral)}</p>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-white/70 text-sm">First Month Payment</p>
                <p className="text-xl font-bold">+{formatIDRX(pool.contribution)}</p>
              </div>

              <div className="pt-3 border-t border-white/30 flex justify-between items-center">
                <p className="font-bold">Total Due Now</p>
                <p className="text-3xl font-bold">{formatIDRX(totalDueAtJoin)}</p>
              </div>
            </div>

            <div className="p-4 bg-white/10 rounded-xl border border-white/20">
              <p className="text-xs text-white/90">
                <strong>Collateral is returned in full</strong> at pool end (+ yield) if you pay all monthly contributions on time
              </p>
            </div>
          </div>
        )}

        {/* Projected Earnings */}
        <div className="mb-6 p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl">
          <h3 className="font-bold text-[#1e2a4a] mb-4">Projected Earnings</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Your Collateral Yield</p>
              <p className="text-2xl font-bold text-green-600">
                +{Math.round(collateralYield).toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-slate-400">IDRX (over {pool.maxParticipants} months)</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">If You Win</p>
              <p className="text-2xl font-bold text-[#1e2a4a]">
                +{formatIDRX(monthlyPot)}
              </p>
              <p className="text-xs text-slate-400">IDRX pot + pot yield</p>
            </div>
          </div>
        </div>

        {/* Pool Details */}
        <div className="mb-6 p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl">
          <h3 className="font-bold text-[#1e2a4a] mb-4">Pool Details</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Pool Size</span>
              <span className="font-semibold text-[#1e2a4a]">{pool.maxParticipants} Participants</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Duration</span>
              <span className="font-semibold text-[#1e2a4a]">{pool.maxParticipants} Months</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Monthly Pot</span>
              <span className="font-semibold text-[#1e2a4a]">
                {formatIDRX(monthlyPot)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">APY Rate</span>
              <span className="font-semibold text-green-600">{apy}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Contract</span>
              <a
                href={`https://sepolia.basescan.org/address/${ARMINA_POOL_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-blue-600 hover:underline"
              >
                {formatAddress(ARMINA_POOL_ADDRESS)}
              </a>
            </div>
          </div>
        </div>

        {/* Your Participation Status (if participating) */}
        {participant && (
          <div className="mb-6 p-5 bg-green-50 border border-green-200 rounded-2xl">
            <h3 className="font-bold text-green-800 mb-4">Your Participation</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Collateral Locked</span>
                <span className="font-semibold text-green-900">{formatIDRX(participant.collateralDeposited)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Yield Earned</span>
                <span className="font-semibold text-green-600">+{formatIDRX(participant.collateralYieldEarned)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Missed Payments</span>
                <span className={`font-semibold ${participant.missedPayments > 0 ? "text-red-600" : "text-green-600"}`}>
                  {participant.missedPayments}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Won</span>
                <span className="font-semibold">{participant.hasWon ? "Yes" : "Not yet"}</span>
              </div>
              {participant.potReceived > BigInt(0) && (
                <div className="flex justify-between">
                  <span className="text-green-700">Pot Received</span>
                  <span className="font-bold text-green-900">{formatIDRX(participant.potReceived)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Participants placeholder */}
        <div className="mb-6 p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl">
          <h3 className="font-bold text-[#1e2a4a] mb-4">
            Participants ({pool.currentParticipants}/{pool.maxParticipants})
          </h3>

          <div className="space-y-2">
            {/* Filled slots */}
            {Array.from({ length: pool.currentParticipants }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#1e2a4a] to-[#2a3a5c] rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <p className="text-sm text-slate-600">Participant #{index + 1}</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                  Joined
                </span>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: spotsRemaining }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg border-2 border-dashed border-slate-200"
              >
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 font-bold text-sm">
                  {pool.currentParticipants + index + 1}
                </div>
                <p className="text-sm text-slate-400">Waiting for participant...</p>
              </div>
            ))}
          </div>
        </div>

        {/* How Monthly Payments Work */}
        <div className="mb-6 p-5 bg-slate-50 rounded-2xl">
          <h3 className="font-bold text-[#1e2a4a] mb-3">How Monthly Payments Work</h3>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex gap-3">
              <span className="text-[#1e2a4a] font-bold">1.</span>
              <p>
                <strong>Automatic Deduction:</strong> Each month, {formatIDRX(pool.contribution)} is auto-deducted from your wallet
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[#1e2a4a] font-bold">2.</span>
              <p>
                <strong>If Wallet Insufficient:</strong> Payment is taken from your collateral + 10% penalty
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-[#1e2a4a] font-bold">3.</span>
              <p>
                <strong>Keep Wallet Funded:</strong> Maintain at least {formatIDRX(pool.contribution)} balance to avoid penalties
              </p>
            </div>
          </div>
        </div>

        {/* Join Button - only show if pool is open and user hasn't joined */}
        {isOpen && !participant && (
          <>
            <button
              onClick={handleJoin}
              disabled={!isConnected || isJoining}
              className="w-full py-4 px-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] text-white rounded-xl font-bold hover:from-[#2a3a5c] hover:to-[#1e2a4a] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mb-4"
            >
              {!isConnected
                ? "Connect Wallet to Join"
                : isApproving
                ? "Approving IDRX..."
                : isJoinPending
                ? "Joining Pool..."
                : isJoinConfirming
                ? "Confirming..."
                : `Join Pool (${formatIDRX(totalDueAtJoin)})`}
            </button>

            <p className="text-xs text-center text-slate-500 mb-6">
              By joining this pool, you agree to the{" "}
              <a href="#" className="text-[#1e2a4a] hover:underline">
                Terms of Service
              </a>
              . Ensure you have {formatIDRX(totalDueAtJoin)} in your wallet.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
