"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { parseUnits } from "viem";
import toast from "react-hot-toast";
import { useArminaPool } from "@/hooks/useArminaPool";
import { useApproveIDRX, useIDRXBalance } from "@/hooks/useIDRX";
import { ARMINA_POOL_ADDRESS } from "@/contracts/config";
import { useLanguage } from "@/components/providers";

// Common monthly amounts (in IDRX) — labels are currency shorthand, not translatable
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
  const { t } = useLanguage();

  const [poolSize, setPoolSize] = useState<number>(10);
  const [monthlyAmount, setMonthlyAmount] = useState<number>(500000);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [useCustom, setUseCustom] = useState(false);

  // Pool size options inside component to access t
  const POOL_SIZE_OPTIONS = [
    { size: 5, label: `5 ${t.people}`, description: t.poolSizeDesc5 },
    { size: 10, label: `10 ${t.people}`, description: t.poolSizeDesc10 },
    { size: 15, label: `15 ${t.people}`, description: t.poolSizeDesc15 },
    { size: 20, label: `20 ${t.people}`, description: t.poolSizeDesc20 },
  ];

  // Calculate derived values (in IDRX, not wei)
  const finalAmount = useCustom && customAmount ? parseInt(customAmount) : monthlyAmount;
  const collateralRequired = Math.floor((finalAmount * poolSize * 125) / 100);
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
      const approvalAmount = parseUnits(totalDueAtJoin.toString(), 2);
      toast.loading("Approving IDRX...", { id: "approve" });
      approve(ARMINA_POOL_ADDRESS, approvalAmount);
    } catch (error) {
      console.error("Error creating pool:", error);
      toast.error("Failed to create pool. Please try again.");
    }
  };

  // Auto-create pool after approval succeeds
  useEffect(() => {
    if (approveSuccess && !isPending && !isConfirming && !isSuccess) {
      const createPoolAfterApproval = async () => {
        try {
          toast.success("Approval confirmed!", { id: "approve" });
          toast.loading("Creating pool...", { id: "create" });
          const monthlyAmountWei = parseUnits(finalAmount.toString(), 2);
          await createPool(monthlyAmountWei, poolSize);
        } catch (error) {
          console.error("Error creating pool:", error);
          toast.error("Failed to create pool", { id: "create" });
        }
      };
      createPoolAfterApproval();
    }
  }, [approveSuccess, isPending, isConfirming, isSuccess, finalAmount, poolSize, createPool]);

  // Navigate after successful pool creation
  useEffect(() => {
    if (isSuccess) {
      toast.success("Pool created successfully!", { id: "create" });
      const timer = setTimeout(() => router.push("/pool"), 1500);
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
          {t.backBtn}
        </button>
        <h1 className="text-3xl font-bold mb-2">{t.createNewPool}</h1>
        <p className="text-white/70 text-sm">{t.createPoolDesc}</p>
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto">
        {/* Pool Size Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-[#1e2a4a] mb-3">{t.selectPoolSizeTitle}</h2>
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
                  <p className="text-xs text-slate-500 mt-1">{option.description}</p>
                  {poolSize === option.size && (
                    <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      {t.selectedBadge}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Monthly Amount Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-[#1e2a4a] mb-3">{t.setMonthlyContributionTitle}</h2>

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
                {t.enterCustomAmount}
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
                  placeholder={t.enterAmountPlaceholder}
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
                {t.backToPresets}
              </button>
            </div>
          )}
        </div>

        {/* Summary Card */}
        <div className="mb-6 p-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white">
          <h3 className="font-bold mb-4 text-lg">{t.poolSummary}</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-white/70">{t.poolSizeLabel}</span>
              <span className="font-semibold">{poolSize} {t.participants}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/70">{t.monthlyContributionLabel}</span>
              <span className="font-semibold">{formatIDRX(finalAmount)} IDRX</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/70">{t.poolDuration}</span>
              <span className="font-semibold">{poolSize} {t.months}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/70">{t.monthlyPotSize}</span>
              <span className="font-semibold">
                {formatIDRX(finalAmount * poolSize)} IDRX
              </span>
            </div>

            <div className="pt-3 border-t border-white/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/70">{t.collateralRequired125}</span>
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
          <h3 className="font-semibold text-[#1e2a4a] mb-3">{t.requiredPaymentWhenJoining}</h3>

          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-slate-600">{t.collateralDeposit}</span>
              <span className="font-semibold text-[#1e2a4a]">
                {formatIDRX(collateralRequired)} IDRX
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">{t.firstMonthPayment}</span>
              <span className="font-semibold text-[#1e2a4a]">
                +{formatIDRX(finalAmount)} IDRX
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between">
              <span className="font-bold text-[#1e2a4a]">{t.totalDueAtJoin}</span>
              <span className="font-bold text-[#1e2a4a] text-lg">
                {formatIDRX(totalDueAtJoin)} IDRX
              </span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>{t.noteLabel}</strong> {t.collateralNote}
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-6 p-5 bg-slate-50 rounded-2xl">
          <h3 className="font-semibold text-[#1e2a4a] mb-3">{t.howItWorksLabel}</h3>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex gap-2">
              <span className="text-[#1e2a4a]">1.</span>
              <p>
                <strong>{t.poolFillsLabel}</strong> {t.poolFillsDesc}
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-[#1e2a4a]">2.</span>
              <p>
                <strong>{t.monthlyPaymentsLabel}</strong> {t.monthlyPaymentsDesc}
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-[#1e2a4a]">3.</span>
              <p>
                <strong>{t.monthlyDrawingLabel}</strong> {t.monthlyDrawingDesc}
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-[#1e2a4a]">4.</span>
              <p>
                <strong>{t.finalSettlementLabel}</strong> {t.finalSettlementDesc}
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
            ? t.connectWalletToContinue
            : isApproving
            ? t.approvingIdrx
            : isPending
            ? t.creatingPool
            : isConfirming
            ? t.confirming
            : t.createPool}
        </button>

        {isConnected && (
          <p className="mt-4 text-xs text-center text-slate-500">
            {t.byCreatingPool}{" "}
            <a href="#" className="text-[#1e2a4a] hover:underline">
              {t.termsOfService}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
