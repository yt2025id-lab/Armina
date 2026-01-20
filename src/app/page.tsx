"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useReadContract } from "wagmi";
import Link from "next/link";
import { formatAddress } from "@/lib/constants";
import Image from "next/image";
import { useOnboarding } from "@/components/providers";
import { IDRX_ABI, CONTRACTS } from "@/contracts/abis";

export default function HomePage() {
  const { ready, authenticated, login, user } = usePrivy();
  const { address } = useAccount();
  const { showOnboarding } = useOnboarding();

  const displayAddress = address || user?.wallet?.address;
  const userEmail = user?.email?.address;

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
    ? (Number(idrxBalance) / 100).toLocaleString("id-ID")
    : "0";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-[#1e2a4a] px-6 pt-6 pb-16 text-white">
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

        {/* Auth Section */}
        {ready && authenticated && displayAddress ? (
          <div className="space-y-3">
            {/* User Info */}
            <div className="p-4 bg-white/10 backdrop-blur rounded-2xl text-center">
              <p className="text-white/60 text-sm mb-1">
                {userEmail || "Wallet Connected"}
              </p>
              <p className="font-mono text-sm">{formatAddress(displayAddress)}</p>
            </div>

            {/* Balance Card */}
            <div className="p-5 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur rounded-2xl">
              <p className="text-white/60 text-sm">IDRX Balance</p>
              <p className="text-3xl font-bold mt-1">Rp {formattedBalance}</p>
              <Link href="/profil">
                <button className="mt-3 text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors">
                  Top Up
                </button>
              </Link>
            </div>
          </div>
        ) : ready ? (
          <div className="space-y-4 flex flex-col items-center">
            <button
              onClick={login}
              className="max-w-xs w-full py-3.5 px-6 bg-white text-[#1e2a4a] rounded-xl text-center font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign in with Email or Wallet
            </button>
            <p className="text-white/70 text-sm text-center leading-relaxed px-2 max-w-xs">
              No crypto wallet needed, just use your email to start
            </p>
          </div>
        ) : (
          <div className="p-4 bg-white/10 backdrop-blur rounded-2xl text-center">
            <p className="text-white/70 text-sm">Loading...</p>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="px-6 pb-8 pt-4">
        {/* How to Play */}
        <button
          onClick={showOnboarding}
          className="w-full p-5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all flex items-center justify-between mb-6"
        >
          <div className="text-left">
            <p className="text-xl font-bold text-[#1e2a4a]">How to Play</p>
            <p className="text-slate-500 text-sm mt-1.5">Learn how to use Armina</p>
          </div>
          <div className="w-11 h-11 bg-[#1e2a4a]/10 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-[#1e2a4a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </button>

        {/* Main CTA */}
        <Link href="/pool" className="block mb-6">
          <div className="p-6 bg-white rounded-2xl shadow-md border border-slate-200 hover:shadow-lg hover:border-[#1e2a4a]/20 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-[#1e2a4a]">Start Arisan</p>
                <p className="text-slate-500 text-sm mt-1.5">
                  Join or create a new arisan pool
                </p>
              </div>
              <div className="w-14 h-14 bg-[#1e2a4a] rounded-xl flex items-center justify-center shadow-sm">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200">
            <p className="text-3xl font-bold text-[#1e2a4a]">0</p>
            <p className="text-slate-500 text-sm mt-1.5">Active Pools</p>
          </div>
          <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200">
            <p className="text-3xl font-bold text-[#1e2a4a]">0</p>
            <p className="text-slate-500 text-sm mt-1.5">Completed</p>
          </div>
        </div>

        {/* IDRX Faucet CTA */}
        <Link href="/faucet" className="block mb-6">
          <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl text-white shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-600 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold">Get Free IDRX</p>
                <p className="text-white/90 text-sm mt-1.5">
                  Claim 10,000 IDRX from testnet faucet
                </p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                <p className="text-xl font-bold">AI Yield Optimizer</p>
                <p className="text-3xl font-bold mt-1.5">12.5% APY</p>
                <p className="text-white/80 text-sm mt-2">
                  Collateral & pot auto-generate yield
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
        {authenticated && (
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-[#1e2a4a] text-lg">Your Active Pools</p>
              <Link href="/pool" className="text-sm text-blue-600 font-medium hover:text-blue-700">
                View All
              </Link>
            </div>
            <div className="p-5 bg-slate-50 rounded-xl text-center">
              <p className="text-slate-400 text-sm">No active pools yet</p>
              <Link href="/pool">
                <button className="mt-3 text-sm text-[#1e2a4a] font-semibold hover:underline">
                  Join a Pool Now
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
