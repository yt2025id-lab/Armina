"use client";

import { useState, useEffect, useCallback } from "react";

export interface YieldProtocol {
  protocol: string;
  symbol: string;
  apy: number;
  apyBase: number;
  apyReward: number;
  tvlUsd: number;
  pool: string;
  isRecommended: boolean;
  riskScore: number;
  reason: string;
}

export interface YieldRecommendation {
  action: string;
  protocol: string;
  symbol: string;
  apy: number;
  reason: string;
}

interface YieldApiResponse {
  success: boolean;
  timestamp: string;
  chain: string;
  agent: string;
  recommendation: YieldRecommendation | null;
  protocols: YieldProtocol[];
  totalPoolsScanned: number;
}

// Protocol display names
const PROTOCOL_NAMES: Record<string, string> = {
  "moonwell": "Moonwell",
  "aave-v3": "Aave V3",
  "compound-v3": "Compound V3",
  "morpho": "Morpho",
  "seamless-protocol": "Seamless",
};

// Protocol brand colors
const PROTOCOL_COLORS: Record<string, string> = {
  "moonwell": "#1e40af",
  "aave-v3": "#b6509e",
  "compound-v3": "#00d395",
  "morpho": "#3b82f6",
  "seamless-protocol": "#06b6d4",
};

export function getProtocolDisplayName(slug: string): string {
  return PROTOCOL_NAMES[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function getProtocolColor(slug: string): string {
  return PROTOCOL_COLORS[slug] || "#6b7280";
}

export function useYieldData() {
  const [data, setData] = useState<YieldApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchYields = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/yields");
      const json = await res.json();
      setData(json);
      setLastFetched(new Date());
    } catch (err) {
      setError("Failed to fetch yield data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchYields();
    // Refresh every 30 minutes
    const interval = setInterval(fetchYields, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchYields]);

  return {
    protocols: data?.protocols || [],
    recommendation: data?.recommendation || null,
    agentName: data?.agent || "Armina AI Yield Optimizer",
    totalPoolsScanned: data?.totalPoolsScanned || 0,
    timestamp: data?.timestamp || null,
    isLoading,
    error,
    lastFetched,
    refetch: fetchYields,
  };
}
