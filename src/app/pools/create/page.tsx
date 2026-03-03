"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { parseUnits } from "viem";
import toast from "react-hot-toast";
import { useArminaPool } from "@/hooks/useArminaPool";
import { useIDRXBalance } from "@/hooks/useIDRX";
import { useLanguage } from "@/components/providers";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useConfig } from "wagmi";

// Common monthly amounts (in IDRX) — testnet-friendly values
// IDRX uses 2 decimals. Faucet memberi 500,000 IDRX per klaim.
const COMMON_AMOUNTS = [
  { value: 100, label: "100" },
  { value: 500, label: "500" },
  { value: 1000, label: "1K" },
  { value: 5000, label: "5K" },
  { value: 10000, label: "10K" },
];

export default function CreatePoolPage() {
  const router = useRouter();
  const { address, isConnected } = useAuth();
  const wagmiConfig = useConfig();
  const { createPool, isPending, isSuccess } = useArminaPool();
  const { data: balance } = useIDRXBalance(address);
  const { t } = useLanguage();

  const [poolSize, setPoolSize] = useState<number>(5);
  const [monthlyAmount, setMonthlyAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [useCustom, setUseCustom] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Pool size options inside component to access t
  const POOL_SIZE_OPTIONS = [
    { size: 5, label: `5 ${t.people}`, description: t.poolSizeDesc5 },
    { size: 10, label: `10 ${t.people}`, description: t.poolSizeDesc10 },
    { size: 15, label: `15 ${t.people}`, description: t.poolSizeDesc15 },
    { size: 20, label: `20 ${t.people}`, description: t.poolSizeDesc20 },
  ];

  // Calculate derived values (in IDRX, not raw units)
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
    if (finalAmount <= 0) {
      toast.error("Masukkan jumlah kontribusi yang valid");
      return;
    }

    setIsCreating(true);
    try {
      // createPool TIDAK memerlukan approve IDRX.
      // Tidak ada transfer IDRX saat membuat pool — hanya ETH untuk gas.
      const monthlyAmountWei = parseUnits(finalAmount.toString(), 2);
      toast.loading("Konfirmasi pembuatan pool di wallet kamu...", { id: "create" });
      const hash = await createPool(monthlyAmountWei, poolSize);

      toast.loading("Menunggu transaksi selesai...", { id: "create" });
      await waitForTransactionReceipt(wagmiConfig, { hash: hash as `0x${string}` });

      toast.success("Pool berhasil dibuat!", { id: "create", duration: 5000 });
      setTimeout(() => router.push("/pool"), 1500);
    } catch (error: any) {
      console.error("Error creating pool:", error);
      const msg = error?.shortMessage || error?.message || "Gagal membuat pool";
      toast.error(msg, { id: "create", duration: 6000 });
    } finally {
      setIsCreating(false);
    }
  };

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
                className={`p-4 rounded-xl border-2 transition-all ${poolSize === option.size
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
                    className={`py-3 px-4 rounded-xl border-2 font-semibold transition-all ${monthlyAmount === amount.value
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

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>💡 Info:</strong> Membuat pool gratis (hanya bayar gas ETH).
              Kamu perlu punya {formatIDRX(totalDueAtJoin)} IDRX saat bergabung ke pool.
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
          disabled={!isConnected || finalAmount <= 0 || isCreating}
          className="w-full py-4 px-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] text-white rounded-xl font-bold hover:from-[#2a3a5c] hover:to-[#1e2a4a] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {!isConnected
            ? t.connectWalletToContinue
            : isCreating
              ? "Membuat Pool..."
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
