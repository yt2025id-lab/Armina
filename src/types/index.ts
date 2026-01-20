// Pool Types
export type PoolTier = "small" | "medium" | "large";

export interface PoolTierConfig {
  name: string;
  nameId: string;
  contribution: bigint;
  contributionDisplay: string;
  minParticipants: number;
  maxParticipants: number;
  cycleDays: number;
}

export interface Pool {
  id: bigint;
  address: `0x${string}`;
  tier: PoolTier;
  contribution: bigint;
  collateralRequired: bigint;
  maxParticipants: number;
  currentParticipants: number;
  currentRound: number;
  totalRounds: number;
  startTime: bigint;
  isActive: boolean;
  isCompleted: boolean;
  creator: `0x${string}`;
}

export interface PoolParticipant {
  address: `0x${string}`;
  hasDeposited: boolean;
  hasReceivedPayout: boolean;
  collateralLocked: bigint;
  joinedAt: bigint;
}

// Reputation Types
export type ReputationLevel = "bronze" | "silver" | "gold" | "diamond";

export interface ReputationData {
  score: number;
  level: ReputationLevel;
  totalPoolsCompleted: number;
  totalPoolsJoined: number;
  onTimePayments: number;
  latePayments: number;
  defaults: number;
  collateralDiscount: number; // percentage (0-25)
}

export interface ReputationNFT {
  tokenId: bigint;
  owner: `0x${string}`;
  data: ReputationData;
}

// Transaction Types
export interface ContributionHistory {
  poolId: bigint;
  round: number;
  amount: bigint;
  timestamp: bigint;
  isOnTime: boolean;
}

export interface PayoutHistory {
  poolId: bigint;
  round: number;
  amount: bigint;
  timestamp: bigint;
  winner: `0x${string}`;
}

// UI Types
export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

export interface PoolCardProps {
  pool: Pool;
  onJoin?: () => void;
  onView?: () => void;
}

// Contract Event Types
export interface PoolCreatedEvent {
  poolId: bigint;
  poolAddress: `0x${string}`;
  creator: `0x${string}`;
  tier: number;
}

export interface ParticipantJoinedEvent {
  poolId: bigint;
  participant: `0x${string}`;
  collateralAmount: bigint;
}

export interface ContributionMadeEvent {
  poolId: bigint;
  participant: `0x${string}`;
  round: number;
  amount: bigint;
}

export interface WinnerSelectedEvent {
  poolId: bigint;
  round: number;
  winner: `0x${string}`;
  amount: bigint;
}

export interface PoolCompletedEvent {
  poolId: bigint;
  totalDistributed: bigint;
}
