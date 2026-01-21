"use client";

import { useAccount, useReadContract, useDisconnect } from "wagmi";
import Link from "next/link";
import { formatAddress } from "@/lib/constants";
import Image from "next/image";
import { useOnboarding, useLanguage } from "@/components/providers";
import { IDRX_ABI, CONTRACTS } from "@/contracts/abis";
import { ConnectButton } from "@/components/ui/ConnectButton";

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { showOnboarding } = useOnboarding();
  const { language, setLanguage, t } = useLanguage();

  const displayAddress = address;

  // Fetch IDRX balance
  const { data: idrxBalance } = useReadContract({
    address: CONTRACTS.IDRX,
    abi: IDRX_ABI,
    functionName: "balanceOf",
    args: displayAddress ? [displayAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!displayAddress && !!CONTRACTS.IDRX,
    },
  });

  // IDRX uses 2 decimals, so divide by 10^2 = 100
  // But the raw value from contract is in wei (18 decimals for standard ERC20)
  // IDRX specifically uses 2 decimals, so we need to check the actual decimal
  const formattedBalance = idrxBalance
    ? (Number(idrxBalance) / 1e18).toLocaleString("id-ID", { maximumFractionDigits: 0 })
    : "0";

  return (
    <div className="min-h-screen bg-[#1d2856] relative">
      {/* Language Selector - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <div className="flex items-center gap-1 bg-white/10 rounded-full p-1">
          <button
            onClick={() => setLanguage("en")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              language === "en"
                ? "bg-white text-[#1d2856]"
                : "text-white/70 hover:text-white"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("id")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              language === "id"
                ? "bg-white text-[#1d2856]"
                : "text-white/70 hover:text-white"
            }`}
          >
            ID
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-[#1d2856] px-6 pt-6 pb-16 text-white">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-[360px] h-[360px] relative">
            <Image
              src="/logo.png"
              alt="Armina Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Wallet Section */}
        <div className="flex flex-col items-center space-y-4">
          {!isConnected ? (
            <>
              <ConnectButton>
                {t.connectWallet}
              </ConnectButton>
              <p className="text-white/70 text-sm text-center leading-relaxed px-2 max-w-xs">
                {t.connectWalletDesc}
              </p>
            </>
          ) : (
            <>
              {/* Connected Wallet Card */}
              <div className="w-full max-w-xs p-4 bg-white/10 backdrop-blur rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs">{t.connected}</p>
                      <p className="text-white font-mono text-sm">{formatAddress(displayAddress!)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => disconnect()}
                    className="p-2 bg-white/10 hover:bg-red-500/80 rounded-lg transition-colors group"
                    title="Disconnect"
                  >
                    <svg className="w-5 h-5 text-white/60 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Balance Card */}
              <div className="w-full max-w-xs p-5 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur rounded-2xl">
                <p className="text-white/60 text-sm">{t.idrxBalance}</p>
                <p className="text-3xl font-bold mt-1">Rp {formattedBalance}</p>
                <Link href="/profil">
                  <button className="mt-3 text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors">
                    {t.topUp}
                  </button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="px-6 pb-8 pt-4 bg-slate-50 min-h-screen">
        {/* How to Play */}
        <button
          onClick={showOnboarding}
          className="w-full p-5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all text-left mb-6"
        >
          <p className="text-xl font-bold text-[#1d2856]">{t.howToPlay}</p>
          <p className="text-slate-500 text-sm mt-1.5">{t.howToPlayDesc}</p>
        </button>

        {/* Main CTA */}
        <Link href="/pool" className="block mb-6">
          <div className="p-6 bg-white rounded-2xl shadow-md border border-slate-200 hover:shadow-lg hover:border-[#1d2856]/20 transition-all">
            <p className="text-xl font-bold text-[#1d2856]">{t.startArisan}</p>
            <p className="text-slate-500 text-sm mt-1.5">
              {t.startArisanDesc}
            </p>
          </div>
        </Link>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200">
            <p className="text-3xl font-bold text-[#1d2856]">0</p>
            <p className="text-slate-500 text-sm mt-1.5">{t.activePools}</p>
          </div>
          <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200">
            <p className="text-3xl font-bold text-[#1d2856]">0</p>
            <p className="text-slate-500 text-sm mt-1.5">{t.completed}</p>
          </div>
        </div>

        {/* IDRX Faucet CTA */}
        <Link href="/faucet" className="block mb-6">
          <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl text-white shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-600 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold">{t.getFreeIdrx}</p>
                <p className="text-white/90 text-sm mt-1.5">
                  {t.getFreeIdrxDesc}
                </p>
              </div>
              {/* IDRX Logo - Official blue circle with X */}
              <div className="w-14 h-14 bg-[#0f56e6] rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10" viewBox="0 0 100 100" fill="none">
                  <path
                    d="M55 47L75 75H60L50 60C47 63 44 72 42 75H33C37 68 45 58 52 52L38 32H53L61 47C63 44 66 37 68 32H78C74 38 70 43 55 47Z"
                    fill="white"
                  />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* APY Highlight */}
        <Link href="/optimizer" className="block mb-6">
          <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl text-white shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-teal-600 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold">{t.aiYieldOptimizer}</p>
                <p className="text-3xl font-bold mt-1.5">12.5% APY</p>
                <p className="text-white/80 text-sm mt-2">
                  {t.collateralYield}
                </p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Active Pool Preview */}
        {isConnected && (
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-[#1d2856] text-lg">{t.yourActivePools}</p>
              <Link href="/pool" className="text-sm text-blue-600 font-medium hover:text-blue-700">
                {t.viewAll}
              </Link>
            </div>
            <div className="p-5 bg-slate-50 rounded-xl text-center">
              <p className="text-slate-400 text-sm">{t.noActivePools}</p>
              <Link href="/pool">
                <button className="mt-3 text-sm text-[#1d2856] font-semibold hover:underline">
                  {t.joinPoolNow}
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
