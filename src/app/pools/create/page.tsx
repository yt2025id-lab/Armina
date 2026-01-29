"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { parseUnits } from "viem";
import toast from "react-hot-toast";
import { useArminaPool } from "@/hooks/useArminaPool";
import { useApproveIDRX, useIDRXBalance } from "@/hooks/useIDRX";
import { ARMINA_POOL_ADDRESS } from "@/contracts/config";

// Pool size options
const POOL_SIZE_OPTIONS = [
  { size: 5, label: "5 People", description: "Small group, faster completion" },
  { size: 10, label: "10 People", description: "Standard pool, balanced risk" },
  { size: 15, label: "15 People", description: "Medium group, more variety" },
  { size: 20, label: "20 People", description: "Large pool, higher pot" },
];

// Common monthly amounts (in IDRX)
const COMMON_AMOUNTS = [
  { value: 100000, label: "100K" },
  { value: 250000, label: "250K" },
  { value: 500000, label: "500K" },
  { value: 1000000, label: "1M" },
  { value: 2500000, label: "2.5M" },
];

export default function CreatePoolPage() {
  const router = useRouter();
  const { address, isConnected } = useAuth();
  const { createPool, isPending, isConfirming, isSuccess } = useArminaPool();
  const { approve, isPending: isApproving, isSuccess: approveSuccess } = useApproveIDRX();
  const { data: balance } = useIDRXBalance(address);

  const [poolSize, setPoolSize] = useState<number>(10);
  const [monthlyAmount, setMonthlyAmount] = useState<number>(500000);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [useCustom, setUseCustom] = useState(false);

  // Calculate derived values (in IDRX, not wei)
  const finalAmount = useCustom && customAmount ? parseInt(customAmount) : monthlyAmount;
  const collateralRequired = Math.floor((finalAmount * poolSize * 125) / 100); // 125% × (participants × contribution)
  const totalDueAtJoin = collateralRequired + finalAmount;

  const formatIDRX = (amount: number) => {
    return new Intl.NumberFormat("id-ID").format(amount);
  };

  const handleCreate = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      // Step 1: Approve IDRX spending
      const approvalAmount = parseUnits(totalDueAtJoin.toString(), 18);

      toast.loading("Approving IDRX...", { id: "approve" });
      approve(ARMINA_POOL_ADDRESS, approvalAmount);

      // Wait for approval (this will be handled by transaction receipt)
      // Step 2 will be triggered separately after approval confirms
    } catch (error) {
      console.error("Error creating pool:", error);
      toast.error("Failed to create pool. Please try again.");
    }
  };

  // Auto-create pool after approval succeeds
  useEffect(() => {
    if (approveSuccess && !isPending && !isSuccess) {
      const createPoolAfterApproval = async () => {
        try {
          toast.success("Approval confirmed!", { id: "approve" });
          toast.loading("Creating pool...", { id: "create" });

          const monthlyAmountWei = parseUnits(finalAmount.toString(), 18);
          await createPool(monthlyAmountWei, poolSize);
        } catch (error) {
          console.error("Error creating pool:", error);
          toast.error("Failed to create pool", { id: "create" });
        }
      };
      createPoolAfterApproval();
    }
  }, [approveSuccess, isPending, isSuccess, finalAmount, poolSize, createPool]);

  // Navigate after successful pool creation
  useEffect(() => {
    if (isSuccess) {
      toast.success("Pool created successfully!", { id: "create" });
      const timer = setTimeout(() => router.push("/pools"), 1500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] px-5 py-8 text-white">
        <button
          onClick={() => router.back()}
          className="mb-4 text-white/80 hover:text-white flex items-center gap-2"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold mb-2">Create New Pool</h1>
        <p className="text-white/70 text-sm">
          Set up your arisan pool and invite participants
        </p>
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto">
        {/* Pool Size Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-[#1e2a4a] mb-3">
            1. Select Pool Size
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {POOL_SIZE_OPTIONS.map((option) => (
              <button
                key={option.size}
                onClick={() => setPoolSize(option.size)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  poolSize === option.size
                    ? "border-[#1e2a4a] bg-[#1e2a4a]/5"
                    : "border-slate-200 bg-white hover:border-[#1e2a4a]/30"
                }`}
              >
                <div className="text-left">
                  <p className="font-bold text-[#1e2a4a]">{option.label}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {option.description}
                  </p>
                  {poolSize === option.size && (
                    <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      ✓ Selected
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Monthly Amount Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-[#1e2a4a] mb-3">
            2. Set Monthly Contribution
          </h2>

          {!useCustom && (
            <>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {COMMON_AMOUNTS.map((amount) => (
                  <button
                    key={amount.value}
                    onClick={() => setMonthlyAmount(amount.value)}
                    className={`py-3 px-4 rounded-xl border-2 font-semibold transition-all ${
                      monthlyAmount === amount.value
                        ? "border-[#1e2a4a] bg-[#1e2a4a] text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-[#1e2a4a]/30"
                    }`}
                  >
                    {amount.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setUseCustom(true)}
                className="text-sm text-[#1e2a4a] hover:underline"
              >
                + Enter custom amount
              </button>
            </>
          )}

          {useCustom && (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full py-3 px-4 border-2 border-[#1e2a4a]/20 rounded-xl focus:border-[#1e2a4a] focus:outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  IDRX
                </span>
              </div>
              <button
                onClick={() => {
                  setUseCustom(false);
                  setCustomAmount("");
                }}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                ← Back to presets
              </button>
            </div>
          )}
        </div>

        {/* Summary Card */}
        <div className="mb-6 p-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white">
          <h3 className="font-bold mb-4 text-lg">Pool Summary</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-white/70">Pool Size</span>
              <span className="font-semibold">{poolSize} Participants</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/70">Monthly Contribution</span>
              <span className="font-semibold">{formatIDRX(finalAmount)} IDRX</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/70">Pool Duration</span>
              <span className="font-semibold">{poolSize} Months</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/70">Monthly Pot Size</span>
              <span className="font-semibold">
                {formatIDRX(finalAmount * poolSize)} IDRX
              </span>
            </div>

            <div className="pt-3 border-t border-white/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/70">Collateral Required (125%)</span>
                <span className="font-bold text-lg">
                  {formatIDRX(collateralRequired)} IDRX
                </span>
              </div>
              <p className="text-xs text-white/60">
                = 125% × ({poolSize} × {formatIDRX(finalAmount)}) IDRX
              </p>
            </div>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="mb-6 p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl">
          <h3 className="font-semibold text-[#1e2a4a] mb-3">
            Required Payment When Joining
          </h3>

          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-slate-600">Collateral Deposit</span>
              <span className="font-semibold text-[#1e2a4a]">
                {formatIDRX(collateralRequired)} IDRX
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">First Month Payment</span>
              <span className="font-semibold text-[#1e2a4a]">
                +{formatIDRX(finalAmount)} IDRX
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between">
              <span className="font-bold text-[#1e2a4a]">Total Due at Join</span>
              <span className="font-bold text-[#1e2a4a] text-lg">
                {formatIDRX(totalDueAtJoin)} IDRX
              </span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> Collateral is returned in full at pool end (+ yield) if you pay all monthly contributions on time. Monthly payments are auto-deducted from your wallet.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-6 p-5 bg-slate-50 rounded-2xl">
          <h3 className="font-semibold text-[#1e2a4a] mb-3">How It Works</h3>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex gap-2">
              <span className="text-[#1e2a4a]">1.</span>
              <p>
                <strong>Pool fills:</strong> Wait for all {poolSize} participants to join
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-[#1e2a4a]">2.</span>
              <p>
                <strong>Monthly payments:</strong> Auto-deducted from wallet on 10th of each month
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-[#1e2a4a]">3.</span>
              <p>
                <strong>Monthly drawing:</strong> Random winner receives pot + pot yield
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-[#1e2a4a]">4.</span>
              <p>
                <strong>Final settlement:</strong> Get back collateral + yield after {poolSize} months
              </p>
            </div>
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreate}
          disabled={!isConnected || finalAmount === 0 || isPending || isConfirming || isApproving}
          className="w-full py-4 px-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] text-white rounded-xl font-bold hover:from-[#2a3a5c] hover:to-[#1e2a4a] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {!isConnected
            ? "Connect Wallet to Continue"
            : isApproving
            ? "Approving IDRX..."
            : isPending
            ? "Creating Pool..."
            : isConfirming
            ? "Confirming..."
            : "Create Pool"}
        </button>

        {isConnected && (
          <p className="mt-4 text-xs text-center text-slate-500">
            By creating this pool, you agree to the{" "}
            <a href="#" className="text-[#1e2a4a] hover:underline">
              Terms of Service
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
