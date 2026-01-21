"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { Pool, PoolTier } from "@/types";
import { POOL_TIERS, calculateCollateral, formatIDRX } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { PoolTierSelector } from "@/components/pool/PoolTierSelector";
import { ListSkeleton } from "@/components/ui/LoadingSkeleton";
import { useLanguage } from "@/components/providers";

// Mock pools for UI demonstration - Open
const MOCK_POOLS_OPEN: Pool[] = [
  {
    id: BigInt(1),
    address: "0x1234567890123456789012345678901234567890",
    tier: "small",
    contribution: BigInt(10000000),
    collateralRequired: BigInt(62500000),
    maxParticipants: 5,
    currentParticipants: 3,
    currentRound: 0,
    totalRounds: 5,
    startTime: BigInt(0),
    isActive: false,
    isCompleted: false,
    creator: "0x1234567890123456789012345678901234567890",
  },
  {
    id: BigInt(2),
    address: "0x2345678901234567890123456789012345678901",
    tier: "medium",
    contribution: BigInt(50000000),
    collateralRequired: BigInt(625000000),
    maxParticipants: 10,
    currentParticipants: 7,
    currentRound: 0,
    totalRounds: 10,
    startTime: BigInt(0),
    isActive: false,
    isCompleted: false,
    creator: "0x2345678901234567890123456789012345678901",
  },
  {
    id: BigInt(3),
    address: "0x3456789012345678901234567890123456789012",
    tier: "large",
    contribution: BigInt(100000000),
    collateralRequired: BigInt(1875000000),
    maxParticipants: 15,
    currentParticipants: 5,
    currentRound: 0,
    totalRounds: 15,
    startTime: BigInt(0),
    isActive: false,
    isCompleted: false,
    creator: "0x3456789012345678901234567890123456789012",
  },
];

// Mock pools - Active
const MOCK_POOLS_ACTIVE: Pool[] = [
  {
    id: BigInt(4),
    address: "0x4567890123456789012345678901234567890123",
    tier: "small",
    contribution: BigInt(10000000),
    collateralRequired: BigInt(62500000),
    maxParticipants: 5,
    currentParticipants: 5,
    currentRound: 2,
    totalRounds: 5,
    startTime: BigInt(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    isActive: true,
    isCompleted: false,
    creator: "0x4567890123456789012345678901234567890123",
  },
  {
    id: BigInt(5),
    address: "0x5678901234567890123456789012345678901234",
    tier: "medium",
    contribution: BigInt(50000000),
    collateralRequired: BigInt(625000000),
    maxParticipants: 10,
    currentParticipants: 10,
    currentRound: 4,
    totalRounds: 10,
    startTime: BigInt(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
    isActive: true,
    isCompleted: false,
    creator: "0x5678901234567890123456789012345678901234",
  },
];

// Mock pools - Completed
const MOCK_POOLS_COMPLETED: Pool[] = [
  {
    id: BigInt(6),
    address: "0x6789012345678901234567890123456789012345",
    tier: "small",
    contribution: BigInt(10000000),
    collateralRequired: BigInt(62500000),
    maxParticipants: 5,
    currentParticipants: 5,
    currentRound: 5,
    totalRounds: 5,
    startTime: BigInt(Date.now() - 180 * 24 * 60 * 60 * 1000), // 180 days ago
    isActive: false,
    isCompleted: true,
    creator: "0x6789012345678901234567890123456789012345",
  },
  {
    id: BigInt(7),
    address: "0x7890123456789012345678901234567890123456",
    tier: "large",
    contribution: BigInt(100000000),
    collateralRequired: BigInt(1875000000),
    maxParticipants: 15,
    currentParticipants: 15,
    currentRound: 15,
    totalRounds: 15,
    startTime: BigInt(Date.now() - 500 * 24 * 60 * 60 * 1000), // 500 days ago
    isActive: false,
    isCompleted: true,
    creator: "0x7890123456789012345678901234567890123456",
  },
];

// Mock user participation data for active pools
const MOCK_USER_ACTIVE_DATA: Record<string, { hasWon: boolean; wonRound: number | null; nextPaymentDue: number; hasPaid: boolean }> = {
  "4": { hasWon: false, wonRound: null, nextPaymentDue: 8, hasPaid: false },
  "5": { hasWon: true, wonRound: 2, nextPaymentDue: 5, hasPaid: true },
};

// Mock user completed data
const MOCK_USER_COMPLETED_DATA: Record<string, { wonRound: number; totalEarned: bigint; yieldEarned: bigint }> = {
  "6": { wonRound: 3, totalEarned: BigInt(50000000), yieldEarned: BigInt(1250000) },
  "7": { wonRound: 8, totalEarned: BigInt(1500000000), yieldEarned: BigInt(45000000) },
};

type TabType = "open" | "active" | "completed";

export default function PoolPage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>("open");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [selectedTier, setSelectedTier] = useState<PoolTier | null>(null);
  const [participantCount, setParticipantCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPools, setIsLoadingPools] = useState(true);

  const tabs: { id: TabType; label: string }[] = [
    { id: "open", label: t.openPools },
    { id: "active", label: t.activePools2 },
    { id: "completed", label: t.completedPools },
  ];

  const handleCreatePool = async () => {
    if (!selectedTier) return;
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    setShowCreateModal(false);
    setSelectedTier(null);
  };

  const handleJoinPool = (pool: Pool) => {
    setSelectedPool(pool);
    setShowJoinModal(true);
  };

  const confirmJoinPool = async () => {
    if (!selectedPool) return;
    setIsLoading(true);
    // Simulate transaction
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    setShowJoinModal(false);
    setSelectedPool(null);
    // Navigate to pool detail or show success
    router.push(`/pool/${selectedPool.id.toString()}`);
  };

  // Simulate loading pools
  useState(() => {
    setTimeout(() => setIsLoadingPools(false), 1500);
  });

  return (
    <div className="px-5 py-8 space-y-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">{t.poolsTitle}</h1>
          <p className="text-slate-500 text-sm">{t.startArisanDesc}</p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreateModal(true)}
          disabled={!isConnected}
        >
          {t.createPool}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pool List */}
      <div className="space-y-4">
        {isLoadingPools ? (
          <ListSkeleton count={3} />
        ) : (
          <>
            {activeTab === "open" && (
              <>
                {MOCK_POOLS_OPEN.map((pool) => (
                  <PoolCard
                    key={pool.id.toString()}
                    pool={pool}
                    onJoin={() => handleJoinPool(pool)}
                    isConnected={isConnected}
                  />
                ))}
                {MOCK_POOLS_OPEN.length === 0 && (
                  <EmptyState message="No open pools yet" />
                )}
              </>
            )}

            {activeTab === "active" && (
              <>
                {MOCK_POOLS_ACTIVE.map((pool) => (
                  <ActivePoolCard
                    key={pool.id.toString()}
                    pool={pool}
                    userData={MOCK_USER_ACTIVE_DATA[pool.id.toString()]}
                  />
                ))}
                {MOCK_POOLS_ACTIVE.length === 0 && (
                  <EmptyState message="You haven't joined any active pools" />
                )}
              </>
            )}

            {activeTab === "completed" && (
              <>
                {MOCK_POOLS_COMPLETED.map((pool) => (
                  <CompletedPoolCard
                    key={pool.id.toString()}
                    pool={pool}
                    userData={MOCK_USER_COMPLETED_DATA[pool.id.toString()]}
                  />
                ))}
                {MOCK_POOLS_COMPLETED.length === 0 && (
                  <EmptyState message="No completed pools yet" />
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Create Pool Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 max-h-[85vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              Create New Pool
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              Select tier and number of participants for new pool
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Select Tier
                </label>
                <PoolTierSelector
                  selectedTier={selectedTier}
                  onSelect={setSelectedTier}
                  participantCount={participantCount}
                />
              </div>

              {selectedTier && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Number of Participants: {participantCount}
                  </label>
                  <input
                    type="range"
                    min={POOL_TIERS[selectedTier].minParticipants}
                    max={POOL_TIERS[selectedTier].maxParticipants}
                    value={participantCount}
                    onChange={(e) =>
                      setParticipantCount(parseInt(e.target.value))
                    }
                    className="w-full accent-[#1e2a4a]"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>
                      Min: {POOL_TIERS[selectedTier].minParticipants}
                    </span>
                    <span>
                      Max: {POOL_TIERS[selectedTier].maxParticipants}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreatePool}
                  disabled={!selectedTier}
                  isLoading={isLoading}
                >
                  Create Pool
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Pool Modal */}
      {showJoinModal && selectedPool && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setShowJoinModal(false);
              setSelectedPool(null);
            }}
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              {t.joinPool}
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              {t.reviewPoolDetails}
            </p>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t.poolTier}</span>
                  <span className="font-semibold text-slate-900">
                    {POOL_TIERS[selectedPool.tier].nameId}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t.contributionMonth}</span>
                  <span className="font-semibold text-slate-900">
                    {formatIDRX(selectedPool.contribution)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t.participants}</span>
                  <span className="font-semibold text-slate-900">
                    {selectedPool.currentParticipants}/{selectedPool.maxParticipants}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t.duration}</span>
                  <span className="font-semibold text-slate-900">
                    {selectedPool.maxParticipants} {t.months}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-amber-800 font-semibold text-sm mb-1">{t.collateralRequired}</p>
                <p className="text-amber-900 text-xl font-bold">
                  {formatIDRX(calculateCollateral(selectedPool.contribution, selectedPool.maxParticipants))}
                </p>
                <p className="text-amber-700 text-xs mt-1">
                  {t.willBeReturned}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowJoinModal(false);
                  setSelectedPool(null);
                }}
              >
                {t.cancel}
              </Button>
              <Button
                className="flex-1"
                onClick={confirmJoinPool}
                isLoading={isLoading}
              >
                {t.confirmJoin}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Pool Card Component
function PoolCard({
  pool,
  onJoin,
  isConnected,
}: {
  pool: Pool;
  onJoin: () => void;
  isConnected: boolean;
}) {
  const tierConfig = POOL_TIERS[pool.tier];
  const collateral = calculateCollateral(
    pool.contribution,
    pool.maxParticipants
  );
  const progress =
    (pool.currentParticipants / pool.maxParticipants) * 100;

  return (
    <div className="p-5 border border-slate-200 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-900">{tierConfig.nameId}</p>
        <span className="px-3 py-1 bg-[#1e2a4a]/5 text-[#1e2a4a] text-xs font-medium rounded-full">
          Open
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Contribution/Month</span>
          <span className="font-semibold text-slate-900">
            {formatIDRX(pool.contribution)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Participants</span>
          <span className="font-semibold text-slate-900">
            {pool.currentParticipants}/{pool.maxParticipants}
          </span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="bg-[#1e2a4a] h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Cycle</span>
          <span className="font-semibold text-slate-900">{tierConfig.cycleDays} days</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Collateral</span>
          <span className="font-semibold text-amber-600">
            {formatIDRX(collateral)}
          </span>
        </div>
      </div>

      <Button className="w-full" onClick={onJoin} disabled={!isConnected}>
        {isConnected ? "Join Pool" : "Connect Wallet to Join"}
      </Button>
    </div>
  );
}

// Active Pool Card Component
function ActivePoolCard({
  pool,
  userData,
}: {
  pool: Pool;
  userData: { hasWon: boolean; wonRound: number | null; nextPaymentDue: number; hasPaid: boolean };
}) {
  const tierConfig = POOL_TIERS[pool.tier];
  const progress = (pool.currentRound / pool.totalRounds) * 100;

  return (
    <div className="p-5 border-2 border-[#1e2a4a] rounded-2xl space-y-4 bg-[#1e2a4a]/5">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-900">{tierConfig.nameId}</p>
        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
          Active
        </span>
      </div>

      {/* Round Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Round</span>
          <span className="font-semibold text-slate-900">
            {pool.currentRound}/{pool.totalRounds}
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Contribution/Month</span>
          <span className="font-semibold text-slate-900">
            {formatIDRX(pool.contribution)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Participants</span>
          <span className="font-semibold text-slate-900">
            {pool.currentParticipants} people
          </span>
        </div>

        {/* Win Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Win Status</span>
          {userData.hasWon ? (
            <span className="font-semibold text-green-600">
              Won round {userData.wonRound}
            </span>
          ) : (
            <span className="font-semibold text-slate-400">Not won yet</span>
          )}
        </div>

        {/* Payment Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">This Month&apos;s Payment</span>
          {userData.hasPaid ? (
            <span className="font-semibold text-green-600">Paid</span>
          ) : (
            <span className="font-semibold text-amber-600">Not paid</span>
          )}
        </div>
      </div>

      {/* Action Button */}
      {!userData.hasPaid && (
        <Button className="w-full bg-amber-500 hover:bg-amber-600">
          Pay Contribution
        </Button>
      )}
      {userData.hasPaid && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-center">
          <p className="text-green-700 text-sm font-medium">
            Next drawing: Day 20
          </p>
        </div>
      )}
    </div>
  );
}

// Completed Pool Card Component
function CompletedPoolCard({
  pool,
  userData,
}: {
  pool: Pool;
  userData: { wonRound: number; totalEarned: bigint; yieldEarned: bigint };
}) {
  const tierConfig = POOL_TIERS[pool.tier];

  return (
    <div className="p-5 border border-slate-200 rounded-2xl space-y-4 bg-slate-50">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-900">{tierConfig.nameId}</p>
        <span className="px-3 py-1 bg-slate-200 text-slate-600 text-xs font-medium rounded-full">
          Completed
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Total Rounds</span>
          <span className="font-semibold text-slate-900">
            {pool.totalRounds} rounds
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Participants</span>
          <span className="font-semibold text-slate-900">
            {pool.currentParticipants} people
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Won Round</span>
          <span className="font-semibold text-green-600">
            Round {userData.wonRound}
          </span>
        </div>

        <div className="border-t border-slate-200 pt-3 mt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Total Pot Received</span>
            <span className="font-bold text-slate-900">
              {formatIDRX(userData.totalEarned)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-slate-500">Yield Bonus</span>
            <span className="font-semibold text-green-600">
              +{formatIDRX(userData.yieldEarned)}
            </span>
          </div>
        </div>
      </div>

      {/* Collateral Returned Info */}
      <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
        <p className="text-green-700 text-sm text-center">
          Collateral + yield has been returned
        </p>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-8 border border-slate-200 rounded-2xl text-center">
      <p className="text-slate-500">{message}</p>
    </div>
  );
}
