"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import { useLanguage } from "@/components/providers";

// Protocol type
type Protocol = {
  name: string;
  apy: number;
  active: boolean;
  tvl: string;
  logo: string;
  color: string; // Brand color for fallback
};

// Mock data - will be replaced with real data from API/contract
const MOCK_PROTOCOLS: Protocol[] = [
  {
    name: "Moonwell",
    apy: 8.5,
    active: true,
    tvl: "12.5M",
    logo: "https://raw.githubusercontent.com/moonwell-fi/moonwell-contracts-v2/main/assets/moonwell-logo.png",
    color: "#1e40af" // Blue
  },
  {
    name: "Aave",
    apy: 7.2,
    active: false,
    tvl: "45.2M",
    logo: "https://cryptologos.cc/logos/aave-aave-logo.png",
    color: "#b6509e" // Purple/Pink
  },
  {
    name: "Compound",
    apy: 6.8,
    active: false,
    tvl: "38.1M",
    logo: "https://cryptologos.cc/logos/compound-comp-logo.png",
    color: "#00d395" // Green
  },
  {
    name: "Morpho",
    apy: 6.5,
    active: false,
    tvl: "8.7M",
    logo: "https://pbs.twimg.com/profile_images/1595384606588678145/bnW9mZMp_400x400.jpg",
    color: "#3b82f6" // Blue
  },
  {
    name: "Seamless",
    apy: 6.2,
    active: false,
    tvl: "5.3M",
    logo: "https://pbs.twimg.com/profile_images/1708090471617384448/hM_LgG0W_400x400.jpg",
    color: "#06b6d4" // Cyan
  },
];

// Mock user data
const MOCK_USER_DATA = {
  totalCollateral: 62500000, // 625K IDRX (in cents)
  totalPotShare: 50000000, // 500K IDRX (in cents)
  earnedYield: 1250000, // 12.5K IDRX earned so far (in cents)
  poolsActive: 1,
  hasDeposits: true, // Whether user has active deposits
  lastSwitchTime: "2 days ago",
  nextCheckIn: "4 hours",
};

// Format number to IDRX display (moved outside component for performance)
const formatIDRX = (amount: number) => {
  if (amount === 0) return "0";
  return new Intl.NumberFormat("id-ID").format(Math.round(amount / 100));
};

export default function OptimizerPage() {
  const { isConnected } = useAccount();
  const { t } = useLanguage();

  const activeProtocol = useMemo(
    () => MOCK_PROTOCOLS.find((p) => p.active) || MOCK_PROTOCOLS[0],
    []
  );

  // Calculate estimated monthly yield (APY / 12)
  const { collateralYield, potYield } = useMemo(() => {
    const monthlyRate = activeProtocol.apy / 100 / 12;
    return {
      collateralYield: MOCK_USER_DATA.totalCollateral * monthlyRate,
      potYield: MOCK_USER_DATA.totalPotShare * monthlyRate,
    };
  }, [activeProtocol.apy]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="bg-[#1e2a4a] px-5 pt-10 pb-10 text-white">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold">{t.aiYieldOptimizer}</h1>
          <p className="text-white/60 text-sm">{t.autoSelectsHighestApy}</p>
        </div>

        {/* Active Protocol Card - Enhanced */}
        <div className="p-5 bg-white/10 backdrop-blur rounded-2xl border-2 border-green-400/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Protocol Logo */}
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
                <p className="text-xs text-green-400">✓ {t.fundsDeployed} {MOCK_USER_DATA.lastSwitchTime}</p>
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
            <span className="text-white/60">{t.nextCheck}: {MOCK_USER_DATA.nextCheckIn}</span>
            <span className="text-white/60">{t.protocolTvl}: ${activeProtocol.tvl}</span>
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

        {/* Your Yield Stats */}
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">{t.yourPosition}</p>
              {MOCK_USER_DATA.hasDeposits && (
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                  {t.active}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-white rounded-2xl border border-[#1e2a4a]/20 shadow-sm">
                <p className="text-xs text-slate-500 mb-1">{t.collateralYieldLabel}</p>
                <p className="text-xl font-bold text-[#1e2a4a]">
                  +{formatIDRX(collateralYield)}
                </p>
                <p className="text-xs text-slate-400">{t.idrxMonth}</p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-[#1e2a4a]/20 shadow-sm">
                <p className="text-xs text-slate-500 mb-1">{t.potYieldLabel}</p>
                <p className="text-xl font-bold text-[#1e2a4a]">
                  +{formatIDRX(potYield)}
                </p>
                <p className="text-xs text-slate-400">{t.forWinner}</p>
              </div>
            </div>

            {/* Total Earned */}
            <div className="p-5 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/60 text-sm">{t.totalYieldEarned}</p>
                  <p className="text-2xl font-bold mt-1">
                    {formatIDRX(MOCK_USER_DATA.earnedYield)} IDRX
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-sm">{t.activePools}</p>
                  <p className="text-2xl font-bold mt-1">{MOCK_USER_DATA.poolsActive}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-white/20 text-xs text-white/60">
                <p>{t.apyBreakdown}: {activeProtocol.apy}% base rate • {t.autoCompounded}</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button className="py-3 px-4 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] text-white rounded-xl font-semibold hover:from-[#2a3a5c] hover:to-[#1e2a4a]">
                {t.withdraw}
              </button>
              <button className="py-3 px-4 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] text-white rounded-xl font-semibold hover:from-[#2a3a5c] hover:to-[#1e2a4a]">
                {t.managePosition}
              </button>
            </div>
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
            <a href="#" className="text-xs text-[#1e2a4a] hover:text-[#2a3a5c] font-medium">
              {t.viewDocs} →
            </a>
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
            {MOCK_PROTOCOLS.map((protocol) => (
              <div
                key={protocol.name}
                className={`flex items-center justify-between p-4 rounded-xl ${
                  protocol.active
                    ? "bg-[#1e2a4a] text-white border-2 border-green-400"
                    : "bg-slate-50 text-slate-700 border-2 border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Protocol Logo */}
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
              🤖 {t.aiChecksEvery6Hours}
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

        {/* Stats Banner */}
        <div className="p-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white text-center shadow-lg">
          <p className="text-white/80 text-sm mb-2">{t.totalValueOptimized}</p>
          <p className="text-4xl font-bold mb-1">$2.4M</p>
          <p className="text-xs text-white/70">{t.activeUsersEarning}</p>
        </div>
      </div>
    </div>
  );
}
