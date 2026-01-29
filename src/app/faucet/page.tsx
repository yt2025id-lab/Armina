"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { formatUnits } from "viem";
import toast from "react-hot-toast";
import { useClaimFaucet, useIDRXBalance } from "@/hooks/useIDRX";
import { useLanguage } from "@/components/providers";

export default function FaucetPage() {
  const router = useRouter();
  const { address, isConnected } = useAuth();
  const { claimFaucet, isPending, isConfirming, isSuccess } = useClaimFaucet();
  const { data: balance, refetch } = useIDRXBalance(address);
  const [lastClaimed, setLastClaimed] = useState<Date | null>(null);
  const { t } = useLanguage();

  // Refetch balance when claim is successful
  useEffect(() => {
    if (isSuccess) {
      toast.success(t.claimSuccess);
      refetch();
      setLastClaimed(new Date());
    }
  }, [isSuccess, refetch, t.claimSuccess]);

  const handleClaim = () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      toast.loading("Claiming IDRX from faucet...", { id: "claim" });
      claimFaucet();
    } catch (error) {
      console.error("Error claiming from faucet:", error);
      toast.error("Failed to claim IDRX. Please try again.", { id: "claim" });
    }
  };

  const formatBalance = (bal: bigint | undefined) => {
    if (!bal) return "0";
    return new Intl.NumberFormat("id-ID").format(
      Math.floor(Number(formatUnits(bal, 18)))
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] px-5 py-8 text-white">
        <button
          onClick={() => router.back()}
          className="mb-4 text-white/80 hover:text-white flex items-center gap-2"
        >
          ← {t.back}
        </button>
        <h1 className="text-3xl font-bold mb-2">{t.faucetTitle}</h1>
        <p className="text-white/70 text-sm">
          {t.faucetDesc}
        </p>
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto">
        {/* Balance Card */}
        <div className="mb-6 p-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white">
          <p className="text-white/70 text-sm mb-2">{t.yourBalance}</p>
          <p className="text-4xl font-bold">
            {isConnected ? formatBalance(balance) : "0"} IDRX
          </p>
          {address && (
            <p className="text-xs text-white/60 mt-2">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          )}
        </div>

        {/* Faucet Info */}
        <div className="mb-6 p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl">
          <h3 className="font-semibold text-[#1e2a4a] mb-3">{t.faucetDetails}</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">{t.amountPerClaim}</span>
              <span className="font-semibold text-[#1e2a4a]">10,000 IDRX</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">{t.network}</span>
              <span className="font-semibold text-[#1e2a4a]">
                Base Sepolia Testnet
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">{t.rateLimit}</span>
              <span className="font-semibold text-[#1e2a4a]">
                {t.unlimited}
              </span>
            </div>
          </div>
        </div>

        {/* Last Claimed */}
        {lastClaimed && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-sm text-green-800">
              ✓ Successfully claimed 10,000 IDRX at{" "}
              {lastClaimed.toLocaleTimeString()}
            </p>
          </div>
        )}

        {/* Claim Button */}
        <button
          onClick={handleClaim}
          disabled={!isConnected || isPending || isConfirming}
          className="w-full py-4 px-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] text-white rounded-xl font-bold hover:from-[#2a3a5c] hover:to-[#1e2a4a] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mb-4"
        >
          {!isConnected
            ? t.connectToClaim
            : isPending
            ? t.claiming
            : isConfirming
            ? t.confirming
            : t.claimIdrx}
        </button>

        {/* Info Cards */}
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">
              {t.whatIsIdrx}
            </h4>
            <p className="text-xs text-blue-800">
              {t.whatIsIdrxDesc}
            </p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <h4 className="font-semibold text-amber-900 mb-2 text-sm">
              {t.howToUseIdrx}
            </h4>
            <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
              <li>{t.howToUseIdrx1}</li>
              <li>{t.howToUseIdrx2}</li>
              <li>{t.howToUseIdrx3}</li>
              <li>{t.howToUseIdrx4}</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="font-semibold text-slate-900 mb-2 text-sm">
              {t.needMoreTokens}
            </h4>
            <p className="text-xs text-slate-700 mb-2">
              {t.needMoreTokensDesc}
            </p>
            <p className="text-xs text-slate-600">
              {t.forCreatingPools}
            </p>
            <ul className="text-xs text-slate-600 mt-1 space-y-1">
              <li>• 5-member pool: ~3,000K IDRX</li>
              <li>• 10-member pool: ~5,500K IDRX</li>
              <li>• 15-member pool: ~8,000K IDRX</li>
              <li>• 20-member pool: ~10,500K IDRX</li>
            </ul>
          </div>
        </div>

        {/* Quick Actions */}
        {isConnected && balance && Number(balance) > 0 && (
          <div className="mt-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl">
            <h3 className="font-semibold text-green-900 mb-3">
              {t.readyToStart}
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/pools/create")}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold"
              >
                {t.createPool}
              </button>
              <button
                onClick={() => router.push("/pools")}
                className="flex-1 py-3 bg-white hover:bg-slate-50 text-green-600 border-2 border-green-600 rounded-xl font-semibold"
              >
                {t.browsePools}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
