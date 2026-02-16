"use client";

import { useReadContract } from "wagmi";
import Link from "next/link";
import { formatAddress } from "@/lib/constants";
import Image from "next/image";
import { useOnboarding, useLanguage } from "@/components/providers";
import { IDRX_ABI, CONTRACTS } from "@/contracts/abis";
import { ConnectButton } from "@/components/ui/ConnectButton";
import { useAllPools } from "@/hooks/usePoolData";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const { address, isConnected: isUserConnected, disconnect } = useAuth();
  const { showOnboarding } = useOnboarding();
  const { language, setLanguage, t } = useLanguage();

  const displayAddress = address;
  const { activePools, completedPools, pools } = useAllPools();

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

  const formattedBalance = idrxBalance
    ? (Number(idrxBalance) / 1e2).toLocaleString("id-ID", { maximumFractionDigits: 0 })
    : "0";

  return (
    <div className="min-h-screen bg-[#1d2856] relative">
      {/* Language Selector - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <div className="flex items-center gap-1 bg-white/10 rounded-full p-1">
          <button
            onClick={() => setLanguage("en")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${language === "en"
              ? "bg-white text-[#1d2856]"
              : "text-white/70 hover:text-white"
              }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("id")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${language === "id"
              ? "bg-white text-[#1d2856]"
              : "text-white/70 hover:text-white"
              }`}
          >
            ID
          </button>
        </div>
      </div>

      {/* Hero Section - PoolTogether Style */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#1d2856] via-[#2a3b75] to-[#f8fafc] pb-24 pt-10">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-0 right-[-100px] w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px]"></div>
        </div>

        <div className="w-full mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-8">

            {/* Logo & Badge */}
            <div className="animate-fade-in-up">
              <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-6">
                <Image
                  src="/logo.png"
                  alt="Armina Logo"
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-baase font-medium mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Protocol Live on Base
              </div>
            </div>

            {/* Massive Headline */}
            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-white animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Save Money. <br className="hidden md:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300">
                Win Prizes.
              </span>
            </h1>

            {/* Subheadline (Lorem50 Animated) */}
            <div className="max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <p className="text-xl md:text-2xl text-blue-100/90 leading-relaxed">
                <span className="block mb-2 font-semibold text-white/80">The Future of Arisan</span>
                Experience the evolution of Arisan. Participate in lossless prize savings pools where your deposit earns yield, and you have a fair chance to win the pot—completely risk-free.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center pt-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Link href="/pool" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-10 py-5 bg-white text-[#1d2856] rounded-full font-bold text-xl hover:bg-blue-50 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  Launch App
                </button>
              </Link>
              <div className="hidden sm:block">
                {!isUserConnected ? (
                  <ConnectButton />
                ) : (
                  <div className="px-8 py-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white font-medium text-lg">
                    {formatAddress(displayAddress!)}
                  </div>
                )}
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-6xl mt-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="p-5 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 text-center">
                <p className="text-blue-200 text-sm uppercase tracking-wider font-semibold">Total Prizes Awarded</p>
                <p className="text-3xl md:text-4xl font-bold text-white mt-1">$1,240</p>
              </div>
              <div className="p-5 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 text-center">
                <p className="text-blue-200 text-sm uppercase tracking-wider font-semibold">Current TVL</p>
                <p className="text-3xl md:text-4xl font-bold text-white mt-1">$45K+</p>
              </div>
              <div className="p-5 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 text-center">
                <p className="text-blue-200 text-sm uppercase tracking-wider font-semibold">Active Pools</p>
                <p className="text-3xl md:text-4xl font-bold text-white mt-1">{activePools.length}</p>
              </div>
              <div className="p-5 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 text-center">
                <p className="text-blue-200 text-sm uppercase tracking-wider font-semibold">Unique Savers</p>
                <p className="text-3xl md:text-4xl font-bold text-white mt-1">1,892</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Content Section - Overlapping Cards */}
      <div className="relative z-20 px-6 pb-24 -mt-12">
        <div className="w-full mx-auto max-w-7xl">

          {/* Main Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

            {/* Card 1: How it Works */}
            <div className="group p-8 bg-white rounded-[2rem] shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-100 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-3xl font-bold text-slate-800 mb-3">{t.howToPlay}</h3>
              <p className="text-slate-500 leading-relaxed mb-6 text-lg">
                {t.howToPlayDesc} Simply deposit into a pool, and you are instantly eligible to win prizes every week. even if you don't win, you keep your deposit!
              </p>
              <button onClick={showOnboarding} className="text-blue-600 font-bold hover:text-blue-700 flex items-center gap-2 text-lg">
                Learn More <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </button>
            </div>

            {/* Card 2: Yield Optimizer (Featured) */}
            <div className="md:col-span-2 relative overflow-hidden group p-8 bg-[#1d2856] rounded-[2rem] shadow-xl hover:shadow-2xl transition-all duration-300 text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 h-full">
                <div className="flex-1">
                  <div className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-sm font-bold mb-4 backdrop-blur-md">
                    🔥 SUPERCHARGED SAVINGS
                  </div>
                  <h3 className="text-4xl md:text-5xl font-bold mb-4">{t.aiYieldOptimizer}</h3>
                  <p className="text-blue-100 text-xl mb-8 max-w-lg">
                    Automatically route your deposits to the highest yielding protocols like Aave and Compound. Customize your risk appetite.
                  </p>
                  <div className="flex items-center gap-4">
                    <Link href="/optimizer">
                      <button className="px-8 py-4 bg-white text-[#1d2856] rounded-xl font-bold hover:bg-blue-50 transition-colors text-lg">
                        Start Earning
                      </button>
                    </Link>
                    <div className="text-right">
                      <p className="text-base text-blue-200">Current APY</p>
                      <p className="text-4xl font-bold text-green-400">12.5%</p>
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex w-48 h-48 bg-white/10 rounded-3xl items-center justify-center backdrop-blur-sm border border-white/10">
                  <svg className="w-24 h-24 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
              </div>
            </div>

            {/* Card 3: Active Pools */}
            <div className="md:col-span-2 p-8 bg-white rounded-[2rem] shadow-xl border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-3xl font-bold text-slate-800">Live Pools</h3>
                  <p className="text-slate-500 text-lg">Join a pool to start winning</p>
                </div>
                <Link href="/pool" className="text-blue-600 font-bold hover:underline text-lg">View All</Link>
              </div>

              {activePools.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activePools.slice(0, 2).map((pool) => (
                    <Link key={pool.id.toString()} href={`/pools/${pool.id.toString()}`}>
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors group cursor-pointer">
                        <div className="flex justify-between items-start mb-3">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                            #{pool.id.toString()}
                          </div>
                          <span className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-bold">LIVE</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-base">
                            <span className="text-slate-500">Prize</span>
                            <span className="font-bold text-slate-800">??? IDRX</span>
                          </div>
                          <div className="flex justify-between text-base">
                            <span className="text-slate-500">Participants</span>
                            <span className="font-bold text-slate-800 text-right">{pool.currentParticipants}/{pool.maxParticipants}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-2xl">
                  <p className="text-slate-400 text-lg">No active pools right now.</p>
                  <Link href="/pool/create" className="text-blue-600 font-bold mt-2 inline-block text-lg">Be the first to create one!</Link>
                </div>
              )}
            </div>

            {/* Card 4: Faucet & Free IDRX */}
            <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-[2rem] shadow-xl">
              <div className="h-full bg-[#1e2a4a] rounded-[1.8rem] p-8 text-white flex flex-col justify-between">
                <div>
                  <h3 className="text-3xl font-bold mb-2">{t.getFreeIdrx}</h3>
                  <p className="text-blue-200 text-base mb-6">{t.getFreeIdrxDesc}</p>
                </div>
                <div className="flex justify-center mb-6">
                  <div className="w-28 h-28 relative animate-bounce-slow rounded-full overflow-hidden border-4 border-white/20 shadow-lg">
                    <Image src="/idrx.jpeg" alt="IDRX" fill className="object-cover" />
                  </div>
                </div>
                <Link href="/faucet" className="w-full">
                  <button className="w-full py-4 bg-blue-500 hover:bg-blue-600 rounded-xl font-bold transition-colors shadow-lg shadow-blue-500/30 text-lg">
                    Claim IDRX
                  </button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
