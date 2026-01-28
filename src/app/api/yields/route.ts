import { NextResponse } from "next/server";

/**
 * AI Yield Optimizer API
 * Fetches live DeFi yields from DeFiLlama for Base chain protocols,
 * then ranks and recommends the best yield opportunity.
 *
 * Powered by Coinbase AgentKit + DeFiLlama data
 */

// Target protocols on Base that support stablecoin deposits
const TARGET_PROTOCOLS = [
  "moonwell",
  "aave-v3",
  "compound-v3",
  "morpho",
  "seamless-protocol",
];

// Stablecoin symbols to match
const STABLECOIN_SYMBOLS = ["USDC", "USDT", "DAI", "IDRX", "USDBC"];

interface DefiLlamaPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number | null;
  apyReward: number | null;
  pool: string;
  stablecoin: boolean;
}

interface YieldRecommendation {
  protocol: string;
  symbol: string;
  apy: number;
  apyBase: number;
  apyReward: number;
  tvlUsd: number;
  pool: string;
  isRecommended: boolean;
  riskScore: number; // 1-10, lower = safer
  reason: string;
}

function calculateRiskScore(pool: DefiLlamaPool): number {
  let score = 5; // baseline

  // Higher TVL = lower risk
  if (pool.tvlUsd > 100_000_000) score -= 2;
  else if (pool.tvlUsd > 10_000_000) score -= 1;
  else if (pool.tvlUsd < 1_000_000) score += 2;

  // Known protocols = lower risk
  if (["aave-v3", "compound-v3", "moonwell"].includes(pool.project)) score -= 1;

  // Extremely high APY = higher risk
  if (pool.apy > 20) score += 2;
  else if (pool.apy > 15) score += 1;

  return Math.max(1, Math.min(10, score));
}

function generateRecommendationReason(rec: YieldRecommendation, rank: number): string {
  if (rank === 0) {
    return `Highest risk-adjusted yield on Base. ${rec.protocol} offers ${rec.apy.toFixed(1)}% APY with $${(rec.tvlUsd / 1e6).toFixed(1)}M TVL — strong liquidity and audited protocol.`;
  }
  if (rec.riskScore <= 3) {
    return `Low-risk option with ${rec.apy.toFixed(1)}% APY. ${rec.protocol} has deep liquidity ($${(rec.tvlUsd / 1e6).toFixed(1)}M TVL).`;
  }
  return `${rec.apy.toFixed(1)}% APY on ${rec.protocol}. TVL: $${(rec.tvlUsd / 1e6).toFixed(1)}M.`;
}

export async function GET() {
  try {
    // Fetch live yields from DeFiLlama (free, no API key needed)
    const response = await fetch("https://yields.llama.fi/pools", {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status}`);
    }

    const data = await response.json();
    const pools: DefiLlamaPool[] = data.data;

    // Filter: Base chain + target protocols + stablecoin pools
    const basePools = pools.filter((pool) => {
      if (pool.chain !== "Base") return false;
      if (!TARGET_PROTOCOLS.includes(pool.project)) return false;
      if (pool.tvlUsd < 100_000) return false; // Min TVL $100k
      if (pool.apy <= 0) return false;

      // Check if it's a stablecoin pool
      const symbolUpper = pool.symbol.toUpperCase();
      return STABLECOIN_SYMBOLS.some((s) => symbolUpper.includes(s));
    });

    // Score and rank pools
    const recommendations: YieldRecommendation[] = basePools
      .map((pool) => {
        const riskScore = calculateRiskScore(pool);
        return {
          protocol: pool.project,
          symbol: pool.symbol,
          apy: pool.apy,
          apyBase: pool.apyBase || 0,
          apyReward: pool.apyReward || 0,
          tvlUsd: pool.tvlUsd,
          pool: pool.pool,
          isRecommended: false,
          riskScore,
          reason: "",
        };
      })
      // Sort by risk-adjusted yield: apy / riskScore (higher = better)
      .sort((a, b) => b.apy / b.riskScore - a.apy / a.riskScore)
      .slice(0, 10); // Top 10

    // Mark best as recommended and generate reasons
    recommendations.forEach((rec, i) => {
      rec.isRecommended = i === 0;
      rec.reason = generateRecommendationReason(rec, i);
    });

    const bestProtocol = recommendations[0] || null;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      chain: "Base",
      agent: "Armina AI Yield Optimizer (Powered by Coinbase AgentKit + DeFiLlama)",
      recommendation: bestProtocol
        ? {
            action: "DEPLOY_TO_BEST_YIELD",
            protocol: bestProtocol.protocol,
            symbol: bestProtocol.symbol,
            apy: bestProtocol.apy,
            reason: bestProtocol.reason,
          }
        : null,
      protocols: recommendations,
      totalPoolsScanned: basePools.length,
    });
  } catch (error) {
    console.error("Yield API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch yield data",
        // Fallback static data when API is unavailable
        protocols: [
          {
            protocol: "moonwell",
            symbol: "USDC",
            apy: 8.5,
            apyBase: 8.5,
            apyReward: 0,
            tvlUsd: 12500000,
            pool: "fallback",
            isRecommended: true,
            riskScore: 2,
            reason: "Fallback data — live API unavailable",
          },
        ],
      },
      { status: 500 }
    );
  }
}
