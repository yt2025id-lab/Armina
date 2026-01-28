"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import { useLanguage } from "@/components/providers";
import { useAllPools, useParticipantInfo } from "@/hooks/usePoolData";
import { formatUnits } from "viem";

// Base DeFi protocols (static info - APY from public data, no mock user balances)
type Protocol = {
  name: string;
  apy: number;
  active: boolean;
  tvl: string;
  color: string;
};

const BASE_PROTOCOLS: Protocol[] = [
  { name: "Moonwell", apy: 8.5, active: true, tvl: "12.5M", color: "#1e40af" },
  { name: "Aave", apy: 7.2, active: false, tvl: "45.2M", color: "#b6509e" },
  { name: "Compound", apy: 6.8, active: false, tvl: "38.1M", color: "#00d395" },
  { name: "Morpho", apy: 6.5, active: false, tvl: "8.7M", color: "#3b82f6" },
  { name: "Seamless", apy: 6.2, active: false, tvl: "5.3M", color: "#06b6d4" },
];

const formatIDRXFromBigInt = (amount: bigint) => {
  const val = Number(formatUnits(amount, 18));
  if (val === 0) return "0";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(val);
};

export default function OptimizerPage() {
  const { address, isConnected } = useAccount();
  const { t } = useLanguage();

  // Real on-chain pool data
  const { activePools, pools } = useAllPools();

  // Get participant info for first active pool (if any)
  const firstActivePool = activePools.length > 0 ? activePools[0] : null;
  const { data: participant } = useParticipantInfo(
    firstActivePool?.id,
    address as `0x${string}` | undefined
  );

  const activeProtocol = BASE_PROTOCOLS.find((p) => p.active) || BASE_PROTOCOLS[0];

  // Compute real yield estimates from on-chain collateral
  const { totalCollateral, estimatedMonthlyYield, totalPools, yieldEarned } = useMemo(() => {
    // Sum collateral across all active pools user participates in
    const collateral = participant?.collateralDeposited || BigInt(0);
    const yieldEarned = participant?.collateralYieldEarned || BigInt(0);
    const monthlyRate = activeProtocol.apy / 100 / 12;
    const collateralNum = Number(formatUnits(collateral as bigint, 18));
    const monthlyYield = collateralNum * monthlyRate;

    return {
      totalCollateral: collateral as bigint,
      estimatedMonthlyYield: monthlyYield,
      totalPools: activePools.length,
      yieldEarned: yieldEarned as bigint,
    };
  }, [participant, activeProtocol.apy, activePools.length]);

  const hasPosition = participant && (totalCollateral as bigint) > BigInt(0);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="bg-[#1e2a4a] px-5 pt-10 pb-10 text-white">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold">{t.aiYieldOptimizer}</h1>
          <p className="text-white/60 text-sm">{t.autoSelectsHighestApy}</p>
        </div>

        {/* Active Protocol Card */}
        <div className="p-5 bg-white/10 backdrop-blur rounded-2xl border-2 border-green-400/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full p-1.5 flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: `${activeProtocol.color}20` }}
              >
                <div
                  className="w-full h-full rounded-full flex items-center justify-center font-bold text-white text-lg"
                  style={{ backgroundColor: activeProtocol.color }}
                >
                  {activeProtocol.name.charAt(0)}
                </div>
              </div>
              <div>
                <p className="text-xs text-white/60">{t.currentlyActive}</p>
                <p className="font-bold text-xl text-white">{activeProtocol.name}</p>
                <p className="text-xs text-green-400">
                  {hasPosition ? `✓ Collateral deployed` : "✓ Best APY on Base"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60">{t.earning}</p>
              <p className="font-bold text-4xl text-green-400">
                {activeProtocol.apy}%
              </p>
              <p className="text-xs text-white/60">{t.apy}</p>
            </div>
          </div>
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-white/60">{t.protocolTvl}: ${activeProtocol.tvl}</span>
            <span className="text-white/60">{pools.length} total pools on-chain</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-6 space-y-6 -mt-4 bg-white rounded-t-3xl">
        {/* Risk Disclosure Banner */}
        <div className="p-4 bg-gradient-to-r from-[#1e2a4a]/5 to-[#2a3a5c]/5 border border-[#1e2a4a]/20 rounded-xl">
          <div className="flex gap-3">
            <span className="text-[#1e2a4a] text-xl flex-shrink-0">⚠️</span>
            <div>
              <p className="font-semibold text-[#1e2a4a] text-sm">{t.riskDisclosure}</p>
              <p className="text-xs text-slate-600 mt-1">
                {t.riskDisclosureDesc}
              </p>
            </div>
          </div>
        </div>

        {/* Your Yield Stats - from real on-chain data */}
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

                {/* Total Earned */}
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
                    <p>{t.apyBreakdown}: {activeProtocol.apy}% base rate · {t.autoCompounded}</p>
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
          <div className="space-y-4">
            <div className="p-6 bg-white border border-[#1e2a4a]/20 rounded-2xl text-center shadow-sm">
              <p className="text-slate-600 mb-4">
                {t.connectToEarn}
              </p>
              <button className="w-full py-3.5 px-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] text-white rounded-xl font-bold hover:from-[#2a3a5c] hover:to-[#1e2a4a] shadow-lg">
                {t.depositToEarn} {activeProtocol.apy}% {t.apy}
              </button>
              <p className="text-xs text-slate-400 mt-3">
                {t.autoOptimized}
              </p>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-[#1e2a4a]">{t.howItWorksTitle}</p>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#1e2a4a]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#1e2a4a]">1</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">{t.autoDeposit}</p>
                <p className="text-sm text-slate-500">
                  {t.autoDepositDesc}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#1e2a4a]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#1e2a4a]">2</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">{t.aiPicksBestApy}</p>
                <p className="text-sm text-slate-500">
                  {t.aiPicksBestApyDesc}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#1e2a4a]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#1e2a4a]">3</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">{t.autoCompoundDaily}</p>
                <p className="text-sm text-slate-500">
                  {t.autoCompoundDailyDesc}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#1e2a4a] to-[#2a3a5c] rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">✓</span>
              </div>
              <div>
                <p className="font-medium text-[#1e2a4a]">{t.doubleYield}</p>
                <p className="text-sm text-slate-500">
                  {t.doubleYieldDesc}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 Protocols */}
        <div className="p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-[#1e2a4a]">{t.topProtocols}</p>
            <span className="text-xs text-slate-400">{t.liveApyRates}</span>
          </div>
          <div className="space-y-3">
            {BASE_PROTOCOLS.map((protocol) => (
              <div
                key={protocol.name}
                className={`flex items-center justify-between p-4 rounded-xl ${
                  protocol.active
                    ? "bg-[#1e2a4a] text-white border-2 border-green-400"
                    : "bg-slate-50 text-slate-700 border-2 border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full p-1 flex items-center justify-center"
                    style={{
                      backgroundColor: protocol.active
                        ? `${protocol.color}30`
                        : `${protocol.color}10`,
                    }}
                  >
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center font-bold text-white text-sm"
                      style={{ backgroundColor: protocol.color }}
                    >
                      {protocol.name.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{protocol.name}</span>
                      {protocol.active && (
                        <span className="text-xs bg-green-400/20 text-green-400 px-2 py-0.5 rounded-full font-medium">
                          {t.active}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${protocol.active ? "text-white/60" : "text-slate-400"}`}>
                      TVL: ${protocol.tvl}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`font-bold text-2xl ${
                      protocol.active ? "text-green-400" : "text-green-600"
                    }`}
                  >
                    {protocol.apy}%
                  </span>
                  <p className={`text-xs ${protocol.active ? "text-white/60" : "text-slate-400"}`}>
                    {t.apy}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-gradient-to-r from-[#1e2a4a]/5 to-[#2a3a5c]/5 rounded-lg border border-[#1e2a4a]/20">
            <p className="text-xs text-[#1e2a4a] text-center font-medium">
              {t.aiChecksEvery6Hours}
            </p>
          </div>
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
            <p className="text-xs text-white/60 text-center">
              {t.yieldCompoundsAuto}
            </p>
          </div>
        </div>

        {/* Security & Transparency */}
        <div className="p-5 bg-white rounded-2xl border border-[#1e2a4a]/20 shadow-sm">
          <p className="font-semibold text-[#1e2a4a] mb-4">{t.securityTransparency}</p>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-[#1e2a4a] text-lg">✓</span>
              <span className="text-slate-600">{t.allProtocolsAudited}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#1e2a4a] text-lg">✓</span>
              <span className="text-slate-600">{t.fundsInYourControl}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#1e2a4a] text-lg">✓</span>
              <span className="text-slate-600">{t.transparentOnChain}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#1e2a4a] text-lg">✓</span>
              <span className="text-slate-600">{t.noLockPeriods}</span>
            </div>
          </div>
        </div>

        {/* Fee Structure */}
        <div className="p-5 bg-white rounded-2xl border border-[#1e2a4a]/20 shadow-sm">
          <p className="font-semibold text-[#1e2a4a] mb-4">{t.feeStructure}</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 text-sm">{t.managementFee}</span>
              <span className="font-semibold text-[#1e2a4a]">0%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 text-sm">{t.performanceFee}</span>
              <span className="font-semibold text-[#1e2a4a]">10%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 text-sm">{t.withdrawalFee}</span>
              <span className="font-semibold text-[#1e2a4a]">0%</span>
            </div>
            <div className="pt-3 border-t border-[#1e2a4a]/10">
              <p className="text-xs text-slate-500 text-center">
                {t.gasFeesApply}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Banner - real data */}
        <div className="p-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white text-center shadow-lg">
          <p className="text-white/80 text-sm mb-2">{t.totalValueOptimized}</p>
          <p className="text-4xl font-bold mb-1">{pools.length} Pools</p>
          <p className="text-xs text-white/70">{activePools.length} active on-chain</p>
        </div>
      </div>
    </div>
  );
}
