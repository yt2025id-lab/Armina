"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";

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
          <h1 className="text-4xl font-bold">AI Yield Optimizer</h1>
          <p className="text-white/60 text-sm">Automatically selects highest APY</p>
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
                <p className="text-xs text-white/60">Currently Active</p>
                <p className="font-bold text-xl text-white">{activeProtocol.name}</p>
                <p className="text-xs text-green-400">✓ Funds deployed {MOCK_USER_DATA.lastSwitchTime}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60">Earning</p>
              <p className="font-bold text-4xl text-green-400">
                {activeProtocol.apy}%
              </p>
              <p className="text-xs text-white/60">APY</p>
            </div>
          </div>
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-white/60">Next check: {MOCK_USER_DATA.nextCheckIn}</span>
            <span className="text-white/60">Protocol TVL: ${activeProtocol.tvl}</span>
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
              <p className="font-semibold text-[#1e2a4a] text-sm">Risk Disclosure</p>
              <p className="text-xs text-slate-600 mt-1">
                Funds are deployed to third-party DeFi protocols. Smart contract risks apply.
                Yield rates are variable and not guaranteed.
              </p>
            </div>
          </div>
        </div>

        {/* Your Yield Stats */}
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">Your Position</p>
              {MOCK_USER_DATA.hasDeposits && (
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                  Active
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-white rounded-2xl border border-[#1e2a4a]/20 shadow-sm">
                <p className="text-xs text-slate-500 mb-1">Collateral Yield</p>
                <p className="text-xl font-bold text-[#1e2a4a]">
                  +{formatIDRX(collateralYield)}
                </p>
                <p className="text-xs text-slate-400">IDRX/month</p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-[#1e2a4a]/20 shadow-sm">
                <p className="text-xs text-slate-500 mb-1">Pot Yield</p>
                <p className="text-xl font-bold text-[#1e2a4a]">
                  +{formatIDRX(potYield)}
                </p>
                <p className="text-xs text-slate-400">for winner</p>
              </div>
            </div>

            {/* Total Earned */}
            <div className="p-5 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/60 text-sm">Total Yield Earned</p>
                  <p className="text-2xl font-bold mt-1">
                    {formatIDRX(MOCK_USER_DATA.earnedYield)} IDRX
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-sm">Active Pools</p>
                  <p className="text-2xl font-bold mt-1">{MOCK_USER_DATA.poolsActive}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-white/20 text-xs text-white/60">
                <p>APY Breakdown: {activeProtocol.apy}% base rate • Auto-compounded daily</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button className="py-3 px-4 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] text-white rounded-xl font-semibold hover:from-[#2a3a5c] hover:to-[#1e2a4a]">
                Withdraw
              </button>
              <button className="py-3 px-4 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] text-white rounded-xl font-semibold hover:from-[#2a3a5c] hover:to-[#1e2a4a]">
                Manage Position
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-6 bg-white border border-[#1e2a4a]/20 rounded-2xl text-center shadow-sm">
              <p className="text-slate-600 mb-4">
                Connect wallet to start earning yield
              </p>
              <button className="w-full py-3.5 px-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] text-white rounded-xl font-bold hover:from-[#2a3a5c] hover:to-[#1e2a4a] shadow-lg">
                Deposit to Earn {activeProtocol.apy}% APY
              </button>
              <p className="text-xs text-slate-400 mt-3">
                Auto-optimized • Collateral & pot funds earn yield
              </p>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-[#1e2a4a]">How It Works</p>
            <a href="#" className="text-xs text-[#1e2a4a] hover:text-[#2a3a5c] font-medium">
              View Docs →
            </a>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#1e2a4a]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#1e2a4a]">1</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">Auto Deposit</p>
                <p className="text-sm text-slate-500">
                  Collateral & pot funds automatically deployed to lending protocol
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#1e2a4a]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#1e2a4a]">2</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">AI Picks Best APY</p>
                <p className="text-sm text-slate-500">
                  AI checks every 6 hours and switches to protocol with highest APY
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#1e2a4a]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#1e2a4a]">3</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">Auto-Compound Daily</p>
                <p className="text-sm text-slate-500">
                  Yield automatically compounds daily to maximize returns
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#1e2a4a] to-[#2a3a5c] rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">✓</span>
              </div>
              <div>
                <p className="font-medium text-[#1e2a4a]">Double Yield</p>
                <p className="text-sm text-slate-500">
                  Collateral yield for you, pot yield bonus for winner
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 Protocols */}
        <div className="p-5 bg-white border border-[#1e2a4a]/20 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-[#1e2a4a]">Top 5 Protocols</p>
            <span className="text-xs text-slate-400">Live APY rates</span>
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
                          Active
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
                    APY
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-gradient-to-r from-[#1e2a4a]/5 to-[#2a3a5c]/5 rounded-lg border border-[#1e2a4a]/20">
            <p className="text-xs text-[#1e2a4a] text-center font-medium">
              🤖 AI checks every 6 hours • Switches automatically to highest APY
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-5 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white shadow-lg">
          <p className="font-semibold mb-4">Monthly Timeline</p>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Day 1-10</span>
              <span>Pay contribution (deadline)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70">Day 11-19</span>
              <span>Funds deployed & earning yield</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70">Day 20</span>
              <span className="text-green-400 font-semibold">Drawing + Yield Distribution</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-xs text-white/60 text-center">
              Yield compounds automatically during deployment period
            </p>
          </div>
        </div>

        {/* Security & Transparency */}
        <div className="p-5 bg-white rounded-2xl border border-[#1e2a4a]/20 shadow-sm">
          <p className="font-semibold text-[#1e2a4a] mb-4">Security & Transparency</p>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-[#1e2a4a] text-lg">✓</span>
              <span className="text-slate-600">All protocols are audited and battle-tested</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#1e2a4a] text-lg">✓</span>
              <span className="text-slate-600">Funds remain in your control, withdrawable anytime</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#1e2a4a] text-lg">✓</span>
              <span className="text-slate-600">Transparent on-chain transactions</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#1e2a4a] text-lg">✓</span>
              <span className="text-slate-600">No lock periods or withdrawal penalties</span>
            </div>
          </div>
        </div>

        {/* Fee Structure */}
        <div className="p-5 bg-white rounded-2xl border border-[#1e2a4a]/20 shadow-sm">
          <p className="font-semibold text-[#1e2a4a] mb-4">Fee Structure</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 text-sm">Management Fee</span>
              <span className="font-semibold text-[#1e2a4a]">0%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 text-sm">Performance Fee</span>
              <span className="font-semibold text-[#1e2a4a]">10% of yield</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 text-sm">Withdrawal Fee</span>
              <span className="font-semibold text-[#1e2a4a]">0%</span>
            </div>
            <div className="pt-3 border-t border-[#1e2a4a]/10">
              <p className="text-xs text-slate-500 text-center">
                Gas fees apply for on-chain transactions
              </p>
            </div>
          </div>
        </div>

        {/* Stats Banner */}
        <div className="p-6 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white text-center shadow-lg">
          <p className="text-white/80 text-sm mb-2">Total Value Optimized</p>
          <p className="text-4xl font-bold mb-1">$2.4M</p>
          <p className="text-xs text-white/70">Across 1,234 active users earning yield</p>
        </div>
      </div>
    </div>
  );
}
