"use client";

import { useState } from "react";

// Mock data - will be replaced with real data from API/contract
const MOCK_PROTOCOLS = [
  { name: "Moonwell", apy: 8.5, active: true },
  { name: "Aave", apy: 7.2, active: false },
  { name: "Compound", apy: 6.8, active: false },
  { name: "Morpho", apy: 6.5, active: false },
  { name: "Seamless", apy: 6.2, active: false },
];

interface YieldOptimizerProps {
  collateralAmount?: bigint;
  potAmount?: bigint;
  showCollateralYield?: boolean;
  showPotYield?: boolean;
  compact?: boolean;
}

export function YieldOptimizer({
  collateralAmount = BigInt(0),
  potAmount = BigInt(0),
  showCollateralYield = true,
  showPotYield = true,
  compact = false,
}: YieldOptimizerProps) {
  const [protocols] = useState(MOCK_PROTOCOLS);
  const activeProtocol = protocols.find((p) => p.active) || protocols[0];

  // Calculate estimated monthly yield (APY / 12)
  const monthlyRate = activeProtocol.apy / 100 / 12;
  const collateralYield = Number(collateralAmount) * monthlyRate;
  const potYield = Number(potAmount) * monthlyRate;

  // Format number to IDRX display
  const formatYield = (amount: number) => {
    if (amount === 0) return "0";
    return new Intl.NumberFormat("id-ID").format(Math.round(amount / 100));
  };

  if (compact) {
    return (
      <div className="p-4 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <div>
              <p className="text-xs text-white/60">AI Yield Optimizer</p>
              <p className="font-semibold">{activeProtocol.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/60">APY</p>
            <p className="font-bold text-green-400">{activeProtocol.apy}%</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <p className="font-semibold">AI Yield Optimizer</p>
            <p className="text-xs text-white/60">Automatically selects highest APY</p>
          </div>
        </div>

        <div className="p-4 bg-white/10 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60">Active Protocol</p>
              <p className="font-semibold text-lg">{activeProtocol.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60">Current APY</p>
              <p className="font-bold text-2xl text-green-400">
                {activeProtocol.apy}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Yield Cards */}
      {(showCollateralYield || showPotYield) && (
        <div className="grid grid-cols-2 gap-3">
          {showCollateralYield && (
            <div className="p-4 border border-slate-200 rounded-2xl">
              <p className="text-xs text-slate-500 mb-1">Collateral Yield</p>
              <p className="text-xl font-bold text-[#1e2a4a]">
                +{formatYield(collateralYield)}
              </p>
              <p className="text-xs text-slate-400">IDRX/month</p>
            </div>
          )}
          {showPotYield && (
            <div className="p-4 border border-slate-200 rounded-2xl">
              <p className="text-xs text-slate-500 mb-1">Pot Yield</p>
              <p className="text-xl font-bold text-green-600">
                +{formatYield(potYield)}
              </p>
              <p className="text-xs text-slate-400">for winner</p>
            </div>
          )}
        </div>
      )}

      {/* Top 5 Protocols */}
      <div className="p-5 border border-slate-200 rounded-2xl">
        <p className="font-semibold text-slate-900 mb-4">Top 5 Protocols</p>
        <div className="space-y-3">
          {protocols.map((protocol, index) => (
            <div
              key={protocol.name}
              className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                protocol.active
                  ? "bg-[#1e2a4a] text-white"
                  : "bg-slate-50 text-slate-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    protocol.active
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="font-medium">{protocol.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-bold ${
                    protocol.active ? "text-green-400" : "text-green-600"
                  }`}
                >
                  {protocol.apy}%
                </span>
                {protocol.active && (
                  <span className="text-xs bg-green-400/20 text-green-400 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4 text-center">
          AI automatically switches to protocol with highest APY
        </p>
      </div>
    </div>
  );
}
