"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

// Mock pool data - will be replaced with contract data
const MOCK_POOL = {
  id: "1",
  monthlyAmount: 50000000, // 500K IDRX in cents
  poolSize: 10,
  currentParticipants: 7,
  collateralRequired: 625000000, // 125% × (10 × 500K) = 6.25M IDRX in cents
  status: "open" as const,
  creator: "0x1234...5678",
  drawingDay: 10,
  apy: 8.5,
  participants: [
    { address: "0x1111...1111", joinedAt: "2 days ago" },
    { address: "0x2222...2222", joinedAt: "1 day ago" },
    { address: "0x3333...3333", joinedAt: "5 hours ago" },
    { address: "0x4444...4444", joinedAt: "3 hours ago" },
    { address: "0x5555...5555", joinedAt: "1 hour ago" },
    { address: "0x6666...6666", joinedAt: "30 min ago" },
    { address: "0x7777...7777", joinedAt: "10 min ago" },
  ],
};

export default function PoolDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { isConnected } = useAccount();
  const [isJoining, setIsJoining] = useState(false);

  const pool = MOCK_POOL; // In real app: fetch from contract using id

  const formatIDRX = (amount: number) => {
    return new Intl.NumberFormat("id-ID").format(Math.round(amount / 100));
  };

  const totalDueAtJoin = pool.collateralRequired + pool.monthlyAmount;
  const spotsRemaining = pool.poolSize - pool.currentParticipants;
  const progressPercentage = (pool.currentParticipants / pool.poolSize) * 100;

  // Calculate projected yields
  const collateralYield = (pool.collateralRequired * pool.apy * pool.poolSize) / (100 * 12);
  const potYield = (pool.monthlyAmount * pool.poolSize * pool.apy * pool.poolSize) / (100 * 12);

  const handleJoin = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    setIsJoining(true);

    // TODO: Call smart contract joinPool function
    console.log("Joining pool:", {
      poolId: pool.id,
      totalPayment: totalDueAtJoin,
    });

    // Simulate transaction
    setTimeout(() => {
      setIsJoining(false);
      // router.push("/dashboard");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] px-5 py-8 text-white">
        <button
          onClick={() => router.back()}
          className="mb-4 text-white/80 hover:text-white flex items-center gap-2"
        >
          ← Back to Pools
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Pool #{pool.id}</h1>
            <p className="text-white/70 text-sm">
              {formatIDRX(pool.monthlyAmount)} IDRX • {pool.poolSize} Participants
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{pool.apy}%</div>
            <div className="text-xs text-white/70">APY</div>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto">
        {/* Pool Status Banner */}
        <div className="mb-6 p-5 bg-white border-2 border-[#1e2a4a]/20 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[#1e2a4a]">Pool Status</h2>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
              {pool.status === "open" ? "Open for Joining" : pool.status}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">
                {pool.currentParticipants} / {pool.poolSize} Participants
              </span>
              <span className="text-[#1e2a4a] font-semibold">
                {spotsRemaining} spots left
              </span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Pool will start automatically when all {pool.poolSize} spots are filled
          </p>
        </div>

        {/* Payment Breakdown Card */}
        <div className="mb-6 p-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white">
          <h2 className="font-bold text-lg mb-4">💰 Required Payment to Join</h2>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white/70 text-sm">Security Collateral (125%)</p>
                <p className="text-xs text-white/60">
                  = 125% × ({pool.poolSize} × {formatIDRX(pool.monthlyAmount)})
                </p>
              </div>
              <p className="text-xl font-bold">{formatIDRX(pool.collateralRequired)} IDRX</p>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-white/70 text-sm">First Month Payment</p>
              <p className="text-xl font-bold">+{formatIDRX(pool.monthlyAmount)} IDRX</p>
            </div>

            <div className="pt-3 border-t border-white/30 flex justify-between items-center">
              <p className="font-bold">Total Due Now</p>
              <p className="text-3xl font-bold">{formatIDRX(totalDueAtJoin)} IDRX</p>
            </div>
          </div>

          <div className="p-4 bg-white/10 rounded-xl border border-white/20">
            <p className="text-xs text-white/90">
              ✓ <strong>Collateral is returned in full</strong> at pool end (+ yield) if you pay all monthly contributions on time
            </p>
            <p className="text-xs text-white/70 mt-2">
              Monthly payments: {formatIDRX(pool.monthlyAmount)} IDRX auto-deducted from wallet on the {pool.drawingDay}th of each month
            </p>
          </div>
        </div>

        {/* Projected Earnings */}
        <div className="mb-6 p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl">
          <h3 className="font-bold text-[#1e2a4a] mb-4">📈 Projected Earnings</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Your Collateral Yield</p>
              <p className="text-2xl font-bold text-green-600">
                +{formatIDRX(collateralYield)}
              </p>
              <p className="text-xs text-slate-400">IDRX (over {pool.poolSize} months)</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">If You Win</p>
              <p className="text-2xl font-bold text-[#1e2a4a]">
                +{formatIDRX(pool.monthlyAmount * pool.poolSize)}
              </p>
              <p className="text-xs text-slate-400">IDRX pot + pot yield</p>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-800">
              <strong>Best Case (Perfect Attendance + Win):</strong> You pay {formatIDRX(pool.monthlyAmount * pool.poolSize)} total over {pool.poolSize} months, get back collateral + both yields + pot = Profit of ~{formatIDRX(collateralYield + potYield)} IDRX
            </p>
          </div>
        </div>

        {/* Pool Details */}
        <div className="mb-6 p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl">
          <h3 className="font-bold text-[#1e2a4a] mb-4">Pool Details</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Pool Size</span>
              <span className="font-semibold text-[#1e2a4a]">{pool.poolSize} Participants</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Duration</span>
              <span className="font-semibold text-[#1e2a4a]">{pool.poolSize} Months</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Drawing Day</span>
              <span className="font-semibold text-[#1e2a4a]">{pool.drawingDay}th of each month</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Monthly Pot</span>
              <span className="font-semibold text-[#1e2a4a]">
                {formatIDRX(pool.monthlyAmount * pool.poolSize)} IDRX
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">APY Rate</span>
              <span className="font-semibold text-green-600">{pool.apy}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Created By</span>
              <span className="font-mono text-xs text-slate-500">{pool.creator}</span>
            </div>
          </div>
        </div>

        {/* Current Participants */}
        <div className="mb-6 p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl">
          <h3 className="font-bold text-[#1e2a4a] mb-4">
            Current Participants ({pool.currentParticipants}/{pool.poolSize})
          </h3>

          <div className="space-y-2">
            {pool.participants.map((participant, index) => (
              <div
                key={participant.address}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#1e2a4a] to-[#2a3a5c] rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-mono text-sm text-[#1e2a4a]">{participant.address}</p>
                    <p className="text-xs text-slate-500">Joined {participant.joinedAt}</p>
                  </div>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                  ✓ Paid
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
                <strong>Automatic Deduction:</strong> On the {pool.drawingDay}th of each month, {formatIDRX(pool.monthlyAmount)} IDRX is auto-deducted from your wallet
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
                <strong>Keep Wallet Funded:</strong> Maintain at least {formatIDRX(pool.monthlyAmount)} IDRX balance to avoid penalties
              </p>
            </div>
          </div>
        </div>

        {/* Join Button */}
        <button
          onClick={handleJoin}
          disabled={!isConnected || isJoining || pool.status !== "open"}
          className="w-full py-4 px-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] text-white rounded-xl font-bold hover:from-[#2a3a5c] hover:to-[#1e2a4a] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mb-4"
        >
          {!isConnected
            ? "Connect Wallet to Join"
            : isJoining
            ? "Joining Pool..."
            : `Join Pool (${formatIDRX(totalDueAtJoin)} IDRX)`}
        </button>

        {isConnected && (
          <p className="text-xs text-center text-slate-500">
            By joining this pool, you agree to the{" "}
            <a href="#" className="text-[#1e2a4a] hover:underline">
              Terms of Service
            </a>
            . Ensure you have {formatIDRX(totalDueAtJoin)} IDRX in your wallet.
          </p>
        )}
      </div>
    </div>
  );
}
