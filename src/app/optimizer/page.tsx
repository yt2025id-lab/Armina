"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/components/providers";
import { useAllPools, useParticipantInfo } from "@/hooks/usePoolData";
import { useYieldData, getProtocolDisplayName, getProtocolColor } from "@/hooks/useYieldData";
import { useBestProtocol, useTotalDeposited, useTotalYieldGenerated, useProtocolInfo } from "@/hooks/useYieldOptimizer";
import { YIELD_OPTIMIZER_ADDRESS } from "@/contracts/config";
import { formatUnits } from "viem";

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

  // On-chain YieldOptimizer contract data
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

  // Live yield data from DeFiLlama via AI agent API
  const {
    protocols: liveProtocols,
    recommendation,
    totalPoolsScanned,
    isLoading: isYieldLoading,
    lastFetched,
    refetch,
  } = useYieldData();

  // Real on-chain pool data
  const { activePools, pools } = useAllPools();

  // Get participant info for first active pool (if any)
  const firstActivePool = activePools.length > 0 ? activePools[0] : null;
  const { data: participant } = useParticipantInfo(
    firstActivePool?.id,
    address as `0x${string}` | undefined
  );

  // Best protocol from live data or fallback
  const bestProtocol = liveProtocols.length > 0 ? liveProtocols[0] : null;
  const bestApy = recommendation?.apy || bestProtocol?.apy || 0;
  const bestName = recommendation
    ? getProtocolDisplayName(recommendation.protocol)
    : bestProtocol
    ? getProtocolDisplayName(bestProtocol.protocol)
    : "Scanning...";
  const bestColor = bestProtocol ? getProtocolColor(bestProtocol.protocol) : "#1e40af";

  // Compute real yield estimates from on-chain collateral
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
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="bg-[#1e2a4a] px-5 pt-10 pb-10 text-white">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold">{t.aiYieldOptimizer}</h1>
          <p className="text-white/60 text-sm">Powered by Coinbase AgentKit + DeFiLlama</p>
        </div>

        {/* Active Protocol Card - LIVE DATA */}
        <div className="p-5 bg-white/10 backdrop-blur rounded-2xl border-2 border-green-400/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full p-1.5 flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: `${bestColor}20` }}
              >
                <div
                  className="w-full h-full rounded-full flex items-center justify-center font-bold text-white text-lg"
                  style={{ backgroundColor: bestColor }}
                >
                  {bestName.charAt(0)}
                </div>
              </div>
              <div>
                <p className="text-xs text-white/60">AI Recommended</p>
                <p className="font-bold text-xl text-white">
                  {isYieldLoading ? "Scanning..." : bestName}
                </p>
                <p className="text-xs text-green-400">
                  {isYieldLoading
                    ? "Fetching live rates..."
                    : recommendation
                    ? `✓ ${recommendation.reason.slice(0, 50)}...`
                    : "✓ Best risk-adjusted yield on Base"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60">LIVE APY</p>
              <p className="font-bold text-4xl text-green-400">
                {isYieldLoading ? "..." : `${bestApy.toFixed(1)}%`}
              </p>
              <p className="text-xs text-white/60">{t.apy}</p>
            </div>
          </div>
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-white/60">
              {totalPoolsScanned > 0
                ? `Scanned ${totalPoolsScanned} Base pools`
                : "Scanning pools..."}
            </span>
            <button
              onClick={refetch}
              className="text-green-400 hover:text-green-300 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Agent Status */}
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-white/50">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>
            AI Agent Active
            {lastFetched && ` · Updated ${lastFetched.toLocaleTimeString()}`}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-6 space-y-6 -mt-4 bg-white rounded-t-3xl">
        {/* On-Chain Contract Data */}
        <div className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">SC</span>
              </div>
              <div>
                <p className="font-semibold text-purple-900 text-sm">On-Chain Optimizer</p>
                <p className="text-xs text-purple-600">ArminaYieldOptimizer Contract</p>
              </div>
            </div>
            {YIELD_OPTIMIZER_ADDRESS && (
              <a
                href={`https://sepolia.basescan.org/address/${YIELD_OPTIMIZER_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-600 hover:text-purple-800 font-mono"
              >
                {YIELD_OPTIMIZER_ADDRESS?.slice(0, 6)}...{YIELD_OPTIMIZER_ADDRESS?.slice(-4)}
              </a>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 bg-white rounded-xl text-center">
              <p className="text-xs text-slate-500">Best Protocol</p>
              <p className="font-bold text-purple-900">{bestOnChainProtocol}</p>
            </div>
            <div className="p-3 bg-white rounded-xl text-center">
              <p className="text-xs text-slate-500">On-Chain APY</p>
              <p className="font-bold text-green-600">{onChainAPY.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-white rounded-xl text-center">
              <p className="text-xs text-slate-500">Total Deposited</p>
              <p className="font-bold text-purple-900">{formatIDRXFromBigInt(onChainDeposited)}</p>
            </div>
          </div>

          {/* Protocol Allocation Table */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-purple-800 mb-2">Protocol Allocation</p>
            {onChainProtocols.map((p) => (
              <div key={p.name} className="flex items-center justify-between p-2 bg-white rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${p.active ? "bg-green-500" : "bg-slate-300"}`} />
                  <span className="font-medium text-slate-700">{p.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500">{formatIDRXFromBigInt(p.deposited)} IDRX</span>
                  <span className="font-semibold text-green-600 w-16 text-right">{p.apy.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-purple-200 flex justify-between text-xs text-purple-700">
            <span>Total Yield Generated: {formatIDRXFromBigInt(onChainYield)} IDRX</span>
            <span>5 protocols supported</span>
          </div>
        </div>

        {/* AI Recommendation Banner */}
        {recommendation && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">AI</span>
              </div>
              <div>
                <p className="font-semibold text-green-800 text-sm">Agent Recommendation</p>
                <p className="text-xs text-green-700 mt-1">{recommendation.reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Risk Disclosure */}
        <div className="p-4 bg-gradient-to-r from-[#1e2a4a]/5 to-[#2a3a5c]/5 border border-[#1e2a4a]/20 rounded-xl">
          <div className="flex gap-3">
            <span className="text-[#1e2a4a] text-xl flex-shrink-0">⚠️</span>
            <div>
              <p className="font-semibold text-[#1e2a4a] text-sm">{t.riskDisclosure}</p>
              <p className="text-xs text-slate-600 mt-1">{t.riskDisclosureDesc}</p>
            </div>
          </div>
        </div>

        {/* Your Position */}
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">{t.yourPosition}</p>
              {hasPosition && (
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                  {t.active}
                </span>
              )}
            </div>

            {hasPosition ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-white rounded-2xl border border-[#1e2a4a]/20 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1">{t.collateralYieldLabel}</p>
                    <p className="text-xl font-bold text-[#1e2a4a]">
                      +{Math.round(estimatedMonthlyYield).toLocaleString("id-ID")}
                    </p>
                    <p className="text-xs text-slate-400">{t.idrxMonth}</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-[#1e2a4a]/20 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1">Collateral Deposited</p>
                    <p className="text-xl font-bold text-[#1e2a4a]">
                      {formatIDRXFromBigInt(totalCollateral)}
                    </p>
                    <p className="text-xs text-slate-400">IDRX</p>
                  </div>
                </div>

                <div className="p-5 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-white/60 text-sm">{t.totalYieldEarned}</p>
                      <p className="text-2xl font-bold mt-1">
                        {formatIDRXFromBigInt(yieldEarned)} IDRX
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/60 text-sm">{t.activePools}</p>
                      <p className="text-2xl font-bold mt-1">{totalPools}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/20 text-xs text-white/60">
                    <p>
                      {t.apyBreakdown}: {bestApy.toFixed(1)}% live rate via {bestName} ·{" "}
                      {t.autoCompounded}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6 bg-white border border-[#1e2a4a]/20 rounded-2xl text-center shadow-sm">
                <p className="text-slate-600 mb-2">No active pool position yet</p>
                <p className="text-slate-400 text-sm mb-4">
                  Join a pool to start earning yield on your collateral
                </p>
                <a
                  href="/pool"
                  className="inline-block w-full py-3.5 px-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] text-white rounded-xl font-bold hover:from-[#2a3a5c] hover:to-[#1e2a4a] shadow-lg text-center"
                >
                  Browse Pools
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 bg-white border border-[#1e2a4a]/20 rounded-2xl text-center shadow-sm">
            <p className="text-slate-600 mb-4">{t.connectToEarn}</p>
            <button className="w-full py-3.5 px-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] text-white rounded-xl font-bold hover:from-[#2a3a5c] hover:to-[#1e2a4a] shadow-lg">
              {t.depositToEarn} {bestApy.toFixed(1)}% {t.apy}
            </button>
            <p className="text-xs text-slate-400 mt-3">{t.autoOptimized}</p>
          </div>
        )}

        {/* How It Works */}
        <div className="p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl shadow-sm">
          <p className="font-semibold text-[#1e2a4a] mb-4">{t.howItWorksTitle}</p>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#1e2a4a]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#1e2a4a]">1</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">{t.autoDeposit}</p>
                <p className="text-sm text-slate-500">{t.autoDepositDesc}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#1e2a4a]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#1e2a4a]">2</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">{t.aiPicksBestApy}</p>
                <p className="text-sm text-slate-500">{t.aiPicksBestApyDesc}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#1e2a4a]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#1e2a4a]">3</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">{t.autoCompoundDaily}</p>
                <p className="text-sm text-slate-500">{t.autoCompoundDailyDesc}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#1e2a4a] to-[#2a3a5c] rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">✓</span>
              </div>
              <div>
                <p className="font-medium text-[#1e2a4a]">{t.doubleYield}</p>
                <p className="text-sm text-slate-500">{t.doubleYieldDesc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Protocol Rankings */}
        <div className="p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-[#1e2a4a]">{t.topProtocols}</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-600 font-medium">LIVE</span>
            </div>
          </div>

          {isYieldLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : liveProtocols.length > 0 ? (
            <div className="space-y-3">
              {liveProtocols.slice(0, 8).map((protocol, idx) => {
                const displayName = getProtocolDisplayName(protocol.protocol);
                const color = getProtocolColor(protocol.protocol);
                const isTop = idx === 0;

                return (
                  <div
                    key={`${protocol.protocol}-${protocol.symbol}`}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      isTop
                        ? "bg-[#1e2a4a] text-white border-2 border-green-400"
                        : "bg-slate-50 text-slate-700 border-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full p-1 flex items-center justify-center"
                        style={{
                          backgroundColor: isTop ? `${color}30` : `${color}10`,
                        }}
                      >
                        <div
                          className="w-full h-full rounded-full flex items-center justify-center font-bold text-white text-sm"
                          style={{ backgroundColor: color }}
                        >
                          {displayName.charAt(0)}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{displayName}</span>
                          {isTop && (
                            <span className="text-xs bg-green-400/20 text-green-400 px-2 py-0.5 rounded-full font-medium">
                              AI Pick
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-xs mt-0.5 ${
                            isTop ? "text-white/60" : "text-slate-400"
                          }`}
                        >
                          {protocol.symbol} · TVL: ${formatTVL(protocol.tvlUsd)} · Risk:{" "}
                          {protocol.riskScore}/10
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-bold text-2xl ${
                          isTop ? "text-green-400" : "text-green-600"
                        }`}
                      >
                        {protocol.apy.toFixed(1)}%
                      </span>
                      <p
                        className={`text-xs ${
                          isTop ? "text-white/60" : "text-slate-400"
                        }`}
                      >
                        {t.apy}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl text-center">
              <p className="text-slate-500 text-sm">No Base stablecoin pools found</p>
            </div>
          )}

          <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-700 text-center font-medium">
              AI Agent scans DeFiLlama every 30 min · Risk-adjusted ranking ·{" "}
              {totalPoolsScanned} pools analyzed
            </p>
          </div>
        </div>

        {/* Tech Stack Badge */}
        <div className="p-5 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white">
          <p className="font-semibold mb-3">Powered By</p>
          <div className="flex flex-wrap gap-2">
            {[
              "Coinbase AgentKit",
              "DeFiLlama API",
              "Base Chain",
              "Chainlink VRF",
            ].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 bg-white/10 rounded-full text-xs font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
          <p className="text-white/50 text-xs mt-3">
            Real-time yield data · On-chain execution · Verifiable AI decisions
          </p>
        </div>

        {/* Timeline */}
        <div className="p-5 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white shadow-lg">
          <p className="font-semibold mb-4">{t.monthlyTimeline}</p>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-white/70">{t.day1to10}</span>
              <span>{t.payContribution}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70">{t.day11to19}</span>
              <span>{t.fundsDeployedEarning}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70">{t.day20}</span>
              <span className="text-green-400 font-semibold">{t.drawingYieldDist}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-xs text-white/60 text-center">{t.yieldCompoundsAuto}</p>
          </div>
        </div>

        {/* Security */}
        <div className="p-5 bg-white rounded-2xl border border-[#1e2a4a]/20 shadow-sm">
          <p className="font-semibold text-[#1e2a4a] mb-4">{t.securityTransparency}</p>
          <div className="space-y-3 text-sm">
            {[
              t.allProtocolsAudited,
              t.fundsInYourControl,
              t.transparentOnChain,
              t.noLockPeriods,
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[#1e2a4a] text-lg">✓</span>
                <span className="text-slate-600">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fee Structure */}
        <div className="p-5 bg-white rounded-2xl border border-[#1e2a4a]/20 shadow-sm">
          <p className="font-semibold text-[#1e2a4a] mb-4">{t.feeStructure}</p>
          <div className="space-y-3">
            {[
              { label: t.managementFee, value: "0%" },
              { label: t.performanceFee, value: "10%" },
              { label: t.withdrawalFee, value: "0%" },
            ].map((fee) => (
              <div key={fee.label} className="flex items-center justify-between">
                <span className="text-slate-600 text-sm">{fee.label}</span>
                <span className="font-semibold text-[#1e2a4a]">{fee.value}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-[#1e2a4a]/10">
              <p className="text-xs text-slate-500 text-center">{t.gasFeesApply}</p>
            </div>
          </div>
        </div>

        {/* Stats Banner */}
        <div className="p-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white text-center shadow-lg">
          <p className="text-white/80 text-sm mb-2">{t.totalValueOptimized}</p>
          <p className="text-4xl font-bold mb-1">{pools.length} Pools</p>
          <p className="text-xs text-white/70">
            {activePools.length} active · {totalPoolsScanned} DeFi pools scanned
          </p>
        </div>
      </div>
    </div>
  );
}
