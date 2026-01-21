import { PoolTier, PoolTierConfig, ReputationLevel } from "@/types";
import { parseUnits } from "viem";

// Chain Configuration
export const BASE_SEPOLIA_CHAIN_ID = 84532;

// IDRX has 2 decimals (like IDR)
export const IDRX_DECIMALS = 2;

// Pool Tier Configurations
export const POOL_TIERS: Record<PoolTier, PoolTierConfig> = {
  small: {
    name: "Small Pool",
    nameId: "Small Pool",
    contribution: parseUnits("100000", IDRX_DECIMALS), // 100K IDRX
    contributionDisplay: "100K IDRX",
    minParticipants: 3,
    maxParticipants: 5,
    cycleDays: 30,
  },
  medium: {
    name: "Medium Pool",
    nameId: "Medium Pool",
    contribution: parseUnits("500000", IDRX_DECIMALS), // 500K IDRX
    contributionDisplay: "500K IDRX",
    minParticipants: 5,
    maxParticipants: 10,
    cycleDays: 30,
  },
  large: {
    name: "Large Pool",
    nameId: "Large Pool",
    contribution: parseUnits("1000000", IDRX_DECIMALS), // 1M IDRX
    contributionDisplay: "1M IDRX",
    minParticipants: 10,
    maxParticipants: 20,
    cycleDays: 30,
  },
};

// Collateral Configuration
export const COLLATERAL_RATIO = 125; // 125% of (participants × contribution)
export const MAX_COLLATERAL_DISCOUNT = 25; // 25% max discount for high reputation

// Reputation Levels
export const REPUTATION_LEVELS: Record<
  ReputationLevel,
  { min: number; max: number; discount: number }
> = {
  bronze: { min: 0, max: 99, discount: 0 },
  silver: { min: 100, max: 299, discount: 10 },
  gold: { min: 300, max: 499, discount: 20 },
  diamond: { min: 500, max: Infinity, discount: 25 },
};

// Reputation Score Changes
export const REPUTATION_POINTS = {
  onTimePayment: 10,
  latePayment: -20,
  poolCompleted: 50,
  default: -100,
};

// Calculate collateral required
// Formula: 125% × (participants × contribution)
export function calculateCollateral(
  contribution: bigint,
  totalParticipants: number,
  discountPercent: number = 0
): bigint {
  // Base = participants × contribution
  const base = contribution * BigInt(totalParticipants);
  // Collateral = 125% of base
  const baseCollateral = (base * BigInt(COLLATERAL_RATIO)) / BigInt(100);
  const discount = (baseCollateral * BigInt(discountPercent)) / BigInt(100);
  return baseCollateral - discount;
}

// Get reputation level from score
export function getReputationLevel(score: number): ReputationLevel {
  if (score >= REPUTATION_LEVELS.diamond.min) return "diamond";
  if (score >= REPUTATION_LEVELS.gold.min) return "gold";
  if (score >= REPUTATION_LEVELS.silver.min) return "silver";
  return "bronze";
}

// Get collateral discount from reputation level
export function getCollateralDiscount(level: ReputationLevel): number {
  return REPUTATION_LEVELS[level].discount;
}

// Format IDRX amount for display with thousand separators
export function formatIDRX(amount: bigint): string {
  const value = Number(amount) / 10 ** IDRX_DECIMALS;
  // Format dengan pemisah ribuan menggunakan titik (format Indonesia)
  const formatted = value.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${formatted} IDRX`;
}

// Format address for display
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Calculate days remaining
export function daysRemaining(endTime: bigint): number {
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (endTime <= now) return 0;
  return Number((endTime - now) / BigInt(86400));
}

// Pool status helper
export function getPoolStatus(
  pool: { isActive: boolean; isCompleted: boolean; currentParticipants: number; maxParticipants: number }
): "open" | "active" | "completed" | "full" {
  if (pool.isCompleted) return "completed";
  if (pool.isActive) return "active";
  if (pool.currentParticipants >= pool.maxParticipants) return "full";
  return "open";
}
