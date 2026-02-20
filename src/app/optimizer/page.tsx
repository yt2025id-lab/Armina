"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/components/providers";
import { useAllPools, useParticipantInfo } from "@/hooks/usePoolData";
import { useYieldData, getProtocolDisplayName, getProtocolColor } from "@/hooks/useYieldData";
import { useBestProtocol, useTotalDeposited, useTotalYieldGenerated, useProtocolInfo } from "@/hooks/useYieldOptimizer";
import { YIELD_OPTIMIZER_ADDRESS } from "@/contracts/config";
import { formatUnits } from "viem";
import Link from "next/link";

const formatIDRXFromBigInt = (amount: bigint) => {
  const val = Number(formatUnits(amount, 2));
  if (val === 0) return "0";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(val);
};

const formatTVL = (tvl: number) => {
  if (tvl >= 1e9) return `${(tvl / 1e9).toFixed(1)}B`;
  if (tvl >= 1e6) return `${(tvl / 1e6).toFixed(1)}M`;
  if (tvl >= 1e3) return `${(tvl / 1e3).toFixed(0)}K`;
  return tvl.toFixed(0);
};

export default function OptimizerPage() {
  const { address, isConnected } = useAuth();
  const { t } = useLanguage();

  const { protocolName: bestOnChainProtocol, apyPercent: onChainAPY } = useBestProtocol();
  const { totalDeposited: onChainDeposited } = useTotalDeposited();
  const { totalYieldGenerated: onChainYield } = useTotalYieldGenerated();
  const moonwell = useProtocolInfo(1);
  const aave = useProtocolInfo(2);
  const compound = useProtocolInfo(3);
  const morpho = useProtocolInfo(4);
  const seamless = useProtocolInfo(5);

  const onChainProtocols = [
    { name: "Moonwell", apy: moonwell.currentAPY / 100, deposited: moonwell.deposited, active: moonwell.isActive },
    { name: "Aave V3", apy: aave.currentAPY / 100, deposited: aave.deposited, active: aave.isActive },
    { name: "Compound V3", apy: compound.currentAPY / 100, deposited: compound.deposited, active: compound.isActive },
    { name: "Morpho", apy: morpho.currentAPY / 100, deposited: morpho.deposited, active: morpho.isActive },
    { name: "Seamless", apy: seamless.currentAPY / 100, deposited: seamless.deposited, active: seamless.isActive },
  ].sort((a, b) => b.apy - a.apy);

  const {
    protocols: liveProtocols,
    recommendation,
    totalPoolsScanned,
    isLoading: isYieldLoading,
    lastFetched,
    refetch,
  } = useYieldData();

  const { activePools, pools } = useAllPools();

  const firstActivePool = activePools.length > 0 ? activePools[0] : null;
  const { data: participant } = useParticipantInfo(
    firstActivePool?.id,
    address as `0x${string}` | undefined
  );

  const bestProtocol = liveProtocols.length > 0 ? liveProtocols[0] : null;
  const bestApy = recommendation?.apy || bestProtocol?.apy || 0;
  const bestName = recommendation
    ? getProtocolDisplayName(recommendation.protocol)
    : bestProtocol
    ? getProtocolDisplayName(bestProtocol.protocol)
    : "Scanning...";
  const bestColor = bestProtocol ? getProtocolColor(bestProtocol.protocol) : "#1e40af";

  const { totalCollateral, estimatedMonthlyYield, totalPools, yieldEarned } = useMemo(() => {
    const collateral = participant?.collateralDeposited || BigInt(0);
    const earned = participant?.collateralYieldEarned || BigInt(0);
    const monthlyRate = bestApy / 100 / 12;
    const collateralNum = Number(formatUnits(collateral as bigint, 2));
    const monthlyYield = collateralNum * monthlyRate;

    return {
      totalCollateral: collateral as bigint,
      estimatedMonthlyYield: monthlyYield,
      totalPools: activePools.length,
      yieldEarned: earned as bigint,
    };
  }, [participant, bestApy, activePools.length]);

  const hasPosition = participant && (totalCollateral as bigint) > BigInt(0);

  return (
    <div className="min-h-screen bg-[#f8f9fc]">

      {/* ── HERO ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#1e2a4a] via-[#243156] to-[#1a2540] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            {/* Left — title + best protocol */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs font-semibold tracking-widest uppercase">
                  AI Agent Active
                  {lastFetched && ` · Updated ${lastFetched.toLocaleTimeString()}`}
                </span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                {t.aiYieldOptimizer}
              </h1>
              <p className="text-white/50 text-sm">
                Powered by Coinbase AgentKit + DeFiLlama · {totalPoolsScanned > 0 ? `${totalPoolsScanned} pools scanned` : "Scanning pools..."}
              </p>
            </div>

            {/* Right — best protocol + APY */}
            <div className="flex items-center gap-6 bg-white/8 border border-white/10 rounded-2xl px-6 py-4 backdrop-blur-sm">
              <div>
                <p className="text-white/40 text-xs mb-1 uppercase tracking-widest">AI Recommended</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                    style={{ backgroundColor: bestColor }}
                  >
                    {bestName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg leading-tight">
                      {isYieldLoading ? "Scanning..." : bestName}
                    </p>
                    {recommendation && (
                      <p className="text-white/50 text-xs line-clamp-1 max-w-xs">
                        {recommendation.reason.slice(0, 55)}...
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="h-12 w-px bg-white/10" />

              <div className="text-right">
                <p className="text-white/40 text-xs mb-1 uppercase tracking-widest">Live APY</p>
                <p className="text-4xl font-bold text-green-400 leading-none">
                  {isYieldLoading ? "..." : `${bestApy.toFixed(1)}%`}
                </p>
              </div>

              <button
                onClick={refetch}
                className="ml-2 text-xs text-white/40 hover:text-white/80 transition-colors border border-white/10 hover:border-white/20 rounded-lg px-3 py-2"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Deposited", value: `${formatIDRXFromBigInt(onChainDeposited)} IDRX` },
              { label: "Yield Generated", value: `${formatIDRXFromBigInt(onChainYield)} IDRX` },
              { label: "Active Pools", value: `${activePools.length}` },
              { label: "On-Chain APY", value: `${onChainAPY.toFixed(1)}%` },
            ].map((s) => (
              <div key={s.label} className="bg-white/6 border border-white/8 rounded-xl px-4 py-3">
                <p className="text-white/40 text-xs mb-1">{s.label}</p>
                <p className="text-white font-bold text-lg">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── LEFT COLUMN (3/5) ── */}
          <div className="lg:col-span-3 space-y-6">

            {/* YOUR POSITION — most prominent */}
            {isConnected ? (
              hasPosition ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-slate-900">{t.yourPosition}</h2>
                    <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold border border-green-200">
                      {t.active}
                    </span>
                  </div>

                  {/* Main position card */}
                  <div className="bg-gradient-to-br from-[#1e2a4a] to-[#2a3a5c] rounded-2xl p-6 text-white mb-4">
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                        <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Collateral Deposited</p>
                        <p className="text-3xl font-bold">{formatIDRXFromBigInt(totalCollateral)}</p>
                        <p className="text-white/40 text-xs mt-0.5">IDRX</p>
                      </div>
                      <div>
                        <p className="text-white/50 text-xs uppercase tracking-wide mb-1">{t.totalYieldEarned}</p>
                        <p className="text-3xl font-bold text-green-400">{formatIDRXFromBigInt(yieldEarned)}</p>
                        <p className="text-white/40 text-xs mt-0.5">IDRX earned</p>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-4 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-white/40 text-xs mb-1">Est. Monthly</p>
                        <p className="text-lg font-bold text-green-400">
                          +{Math.round(estimatedMonthlyYield).toLocaleString("id-ID")}
                        </p>
                        <p className="text-white/30 text-xs">IDRX / month</p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs mb-1">{t.activePools}</p>
                        <p className="text-lg font-bold">{totalPools}</p>
                        <p className="text-white/30 text-xs">pools</p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs mb-1">Current Rate</p>
                        <p className="text-lg font-bold text-green-400">{bestApy.toFixed(1)}%</p>
                        <p className="text-white/30 text-xs">APY via {bestName}</p>
                      </div>
                    </div>
                  </div>

                  {/* APY breakdown */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">APY Breakdown</p>
                    <p className="text-sm text-slate-600">
                      {bestApy.toFixed(1)}% live rate via {bestName} · {t.autoCompounded}
                    </p>
                  </div>
                </div>
              ) : (
                /* Connected but no position */
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-3">{t.yourPosition}</h2>
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
                    <div className="w-14 h-14 bg-[#1e2a4a]/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="w-7 h-7 rounded-full bg-[#1e2a4a]/20" />
                    </div>
                    <p className="font-semibold text-slate-900 mb-1">No active position yet</p>
                    <p className="text-slate-400 text-sm mb-6">
                      Join a pool to start earning <span className="text-green-600 font-semibold">{bestApy.toFixed(1)}% APY</span> on your collateral — automatically.
                    </p>
                    <Link
                      href="/pool"
                      className="inline-block px-8 py-3 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] text-white rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg"
                    >
                      Browse Pools
                    </Link>
                  </div>
                </div>
              )
            ) : (
              /* Not connected */
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-3">{t.yourPosition}</h2>
                <div className="bg-gradient-to-br from-[#1e2a4a] to-[#2a3a5c] rounded-2xl p-8 text-center text-white">
                  <p className="text-white/60 text-sm mb-2">Connect your wallet to see your yield position</p>
                  <p className="text-4xl font-bold text-green-400 mb-1">{bestApy.toFixed(1)}%</p>
                  <p className="text-white/50 text-sm mb-6">Current APY via {bestName}</p>
                  <button className="px-8 py-3 bg-white text-[#1e2a4a] rounded-xl font-bold hover:bg-white/90 transition-colors shadow-lg">
                    {t.connectToEarn}
                  </button>
                  <p className="text-xs text-white/30 mt-3">{t.autoOptimized}</p>
                </div>
              </div>
            )}

            {/* HOW IT WORKS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 className="text-base font-bold text-slate-900 mb-5">{t.howItWorksTitle}</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { step: "1", title: t.autoDeposit, desc: t.autoDepositDesc },
                  { step: "2", title: t.aiPicksBestApy, desc: t.aiPicksBestApyDesc },
                  { step: "3", title: t.autoCompoundDaily, desc: t.autoCompoundDailyDesc },
                  { step: "4", title: t.doubleYield, desc: t.doubleYieldDesc, highlight: true },
                ].map((item) => (
                  <div
                    key={item.step}
                    className={`p-4 rounded-xl border ${
                      item.highlight
                        ? "bg-[#1e2a4a] border-[#1e2a4a] text-white"
                        : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold mb-3 ${
                        item.highlight ? "bg-white/20 text-white" : "bg-[#1e2a4a]/10 text-[#1e2a4a]"
                      }`}
                    >
                      {item.step}
                    </div>
                    <p className={`font-semibold text-sm mb-1 ${item.highlight ? "text-white" : "text-slate-900"}`}>
                      {item.title}
                    </p>
                    <p className={`text-xs leading-relaxed ${item.highlight ? "text-white/60" : "text-slate-500"}`}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* TIMELINE + SECURITY + FEES — bottom left */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Monthly Timeline */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-4">{t.monthlyTimeline}</h3>
                <div className="space-y-3">
                  {[
                    { period: t.day1to10, action: t.payContribution, color: "bg-blue-400" },
                    { period: t.day11to19, action: t.fundsDeployedEarning, color: "bg-purple-400" },
                    { period: t.day20, action: t.drawingYieldDist, color: "bg-green-500" },
                  ].map((row) => (
                    <div key={row.period} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${row.color}`} />
                      <div>
                        <p className="text-xs text-slate-400">{row.period}</p>
                        <p className="text-sm font-medium text-slate-700">{row.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">
                  {t.yieldCompoundsAuto}
                </p>
              </div>

              {/* Security + Fees */}
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">{t.securityTransparency}</h3>
                  <div className="space-y-2">
                    {[
                      t.allProtocolsAudited,
                      t.fundsInYourControl,
                      t.transparentOnChain,
                      t.noLockPeriods,
                    ].map((text, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                        </div>
                        {text}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">{t.feeStructure}</h3>
                  <div className="space-y-2">
                    {[
                      { label: t.managementFee, value: "0%", good: true },
                      { label: t.performanceFee, value: "10%", good: false },
                      { label: t.withdrawalFee, value: "0%", good: true },
                    ].map((fee) => (
                      <div key={fee.label} className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">{fee.label}</span>
                        <span className={`font-bold ${fee.good ? "text-green-600" : "text-[#1e2a4a]"}`}>
                          {fee.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100 text-center">
                    {t.gasFeesApply}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN (2/5) ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* LIVE PROTOCOL RANKINGS */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-900">{t.topProtocols}</h2>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-600 font-semibold">LIVE</span>
                </div>
              </div>

              {isYieldLoading ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : liveProtocols.length > 0 ? (
                <div>
                  {liveProtocols.slice(0, 8).map((protocol, idx) => {
                    const displayName = getProtocolDisplayName(protocol.protocol);
                    const color = getProtocolColor(protocol.protocol);
                    const isTop = idx === 0;

                    return (
                      <div
                        key={`${protocol.protocol}-${protocol.symbol}`}
                        className={`flex items-center gap-3 px-5 py-3.5 border-b border-slate-50 last:border-0 transition-colors ${
                          isTop ? "bg-[#1e2a4a]/3" : "hover:bg-slate-50"
                        }`}
                      >
                        {/* Rank */}
                        <span className={`text-sm font-bold w-5 text-center flex-shrink-0 ${
                          isTop ? "text-[#1e2a4a]" : "text-slate-300"
                        }`}>
                          {idx + 1}
                        </span>

                        {/* Logo */}
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                          style={{ backgroundColor: color }}
                        >
                          {displayName.charAt(0)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-slate-900 truncate">
                              {displayName}
                            </span>
                            {isTop && (
                              <span className="text-xs bg-[#1e2a4a] text-white px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                                AI Pick
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 truncate">
                            TVL ${formatTVL(protocol.tvlUsd)} · Risk {protocol.riskScore}/10
                          </p>
                        </div>

                        {/* APY */}
                        <div className="text-right flex-shrink-0">
                          <p className={`font-bold text-lg leading-none ${isTop ? "text-green-600" : "text-slate-700"}`}>
                            {protocol.apy.toFixed(1)}%
                          </p>
                          <p className="text-xs text-slate-400">{t.apy}</p>
                        </div>
                      </div>
                    );
                  })}

                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
                    <p className="text-xs text-slate-400 text-center">
                      Scanned every 30 min · {totalPoolsScanned} pools analyzed
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-slate-400 text-sm">No Base stablecoin pools found</p>
                </div>
              )}
            </div>

            {/* ON-CHAIN CONTRACT */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">On-Chain Optimizer</h2>
                  <p className="text-xs text-slate-400">ArminaYieldOptimizer</p>
                </div>
                {YIELD_OPTIMIZER_ADDRESS && (
                  <a
                    href={`https://sepolia.basescan.org/address/${YIELD_OPTIMIZER_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#1e2a4a]/60 hover:text-[#1e2a4a] font-mono bg-slate-50 px-2 py-1 rounded-lg border border-slate-200"
                  >
                    {YIELD_OPTIMIZER_ADDRESS?.slice(0, 6)}...{YIELD_OPTIMIZER_ADDRESS?.slice(-4)}
                  </a>
                )}
              </div>

              <div className="p-5 space-y-2">
                {onChainProtocols.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.active ? "bg-green-500" : "bg-slate-300"}`} />
                      <span className="text-sm text-slate-700 font-medium">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <span className="text-xs text-slate-400">{formatIDRXFromBigInt(p.deposited)} IDRX</span>
                      <span className="text-sm font-bold text-green-600 w-12">{p.apy.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between text-xs text-slate-400">
                <span>Yield: {formatIDRXFromBigInt(onChainYield)} IDRX</span>
                <span>5 protocols</span>
              </div>
            </div>

            {/* AI RECOMMENDATION */}
            {recommendation && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-[#1e2a4a] rounded-md flex items-center justify-center">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">Agent Recommendation</p>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{recommendation.reason}</p>
              </div>
            )}

            {/* RISK DISCLOSURE */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <p className="font-semibold text-amber-900 text-sm mb-1">{t.riskDisclosure}</p>
              <p className="text-xs text-amber-700 leading-relaxed">{t.riskDisclosureDesc}</p>
            </div>

            {/* POWERED BY */}
            <div className="bg-[#1e2a4a] rounded-2xl p-5">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">Powered By</p>
              <div className="flex flex-wrap gap-2">
                {["Coinbase AgentKit", "DeFiLlama API", "Base Chain", "Chainlink VRF"].map((tech) => (
                  <span key={tech} className="px-3 py-1.5 bg-white/10 border border-white/10 rounded-lg text-xs text-white font-medium">
                    {tech}
                  </span>
                ))}
              </div>
              <p className="text-white/30 text-xs mt-3">
                Real-time yield · On-chain execution · Verifiable AI decisions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
