"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pool, PoolTier } from "@/types";
import { POOL_TIERS, calculateCollateral, formatIDRX } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { PoolTierSelector } from "@/components/pool/PoolTierSelector";
import { ListSkeleton } from "@/components/ui/LoadingSkeleton";
import { useLanguage } from "@/components/providers";
import { useAllPools, useParticipantInfo } from "@/hooks/usePoolData";
import { useArminaPool } from "@/hooks/useArminaPool";
import { useApproveIDRX } from "@/hooks/useIDRX";
import { ARMINA_POOL_ADDRESS } from "@/contracts/config";
import { parseUnits } from "viem";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";

type TabType = "open" | "active" | "completed";

export default function PoolPage() {
  const { address, isConnected } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>("open");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [selectedTier, setSelectedTier] = useState<PoolTier | null>(null);
  const [participantCount, setParticipantCount] = useState(5);

  // Real contract data
  const { openPools, activePools, completedPools, isLoading: isLoadingPools, refetch } = useAllPools();
  const { joinPool, isPending: isJoining, isConfirming: isJoinConfirming } = useArminaPool();
  const { approve, isPending: isApproving } = useApproveIDRX();
  const { createPool, isPending: isCreating, isConfirming: isCreateConfirming } = useArminaPool();

  const isLoading = isJoining || isJoinConfirming || isApproving;
  const isCreateLoading = isCreating || isCreateConfirming || isApproving;

  const tabs: { id: TabType; label: string }[] = [
    { id: "open", label: t.openPools },
    { id: "active", label: t.activePools2 },
    { id: "completed", label: t.completedPools },
  ];

  const handleCreatePool = async () => {
    if (!selectedTier) return;
    try {
      const tier = POOL_TIERS[selectedTier];
      const monthlyAmount = tier.contribution;
      const collateral = calculateCollateral(monthlyAmount, participantCount);
      const totalDue = collateral + monthlyAmount;

      toast.loading("Approving IDRX...", { id: "approve" });
      approve(ARMINA_POOL_ADDRESS, totalDue);
    } catch (error) {
      console.error("Error creating pool:", error);
      toast.error("Failed to create pool");
    }
  };

  const handleJoinPool = (pool: Pool) => {
    setSelectedPool(pool);
    setShowJoinModal(true);
  };

  const confirmJoinPool = async () => {
    if (!selectedPool) return;
    try {
      const collateral = calculateCollateral(selectedPool.contribution, selectedPool.maxParticipants);
      const totalDue = collateral + selectedPool.contribution;

      toast.loading("Approving IDRX...", { id: "join-approve" });
      approve(ARMINA_POOL_ADDRESS, totalDue);

      // After approval, join
      toast.loading("Joining pool...", { id: "join" });
      await joinPool(selectedPool.id);
      toast.success("Joined pool!", { id: "join" });
      toast.dismiss("join-approve");
      setShowJoinModal(false);
      setSelectedPool(null);
      refetch();
    } catch (error) {
      console.error("Error joining pool:", error);
      toast.error("Failed to join pool", { id: "join" });
    }
  };

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
          onClick={() => router.push("/pools/create")}
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
                {openPools.map((pool) => (
                  <PoolCard
                    key={pool.id.toString()}
                    pool={pool}
                    onJoin={() => handleJoinPool(pool)}
                    isConnected={isConnected}
                  />
                ))}
                {openPools.length === 0 && (
                  <EmptyState message="No open pools yet. Create one!" />
                )}
              </>
            )}

            {activeTab === "active" && (
              <>
                {activePools.map((pool) => (
                  <ActivePoolCard
                    key={pool.id.toString()}
                    pool={pool}
                    userAddress={address}
                  />
                ))}
                {activePools.length === 0 && (
                  <EmptyState message="No active pools yet" />
                )}
              </>
            )}

            {activeTab === "completed" && (
              <>
                {completedPools.map((pool) => (
                  <CompletedPoolCard
                    key={pool.id.toString()}
                    pool={pool}
                    userAddress={address}
                  />
                ))}
                {completedPools.length === 0 && (
                  <EmptyState message="No completed pools yet" />
                )}
              </>
            )}
          </>
        )}
      </div>

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

// Active Pool Card Component - reads real participant data
function ActivePoolCard({
  pool,
  userAddress,
}: {
  pool: Pool;
  userAddress: `0x${string}` | undefined;
}) {
  const tierConfig = POOL_TIERS[pool.tier];
  const progress = (pool.currentRound / pool.totalRounds) * 100;
  const { data: participant } = useParticipantInfo(pool.id, userAddress);

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

        {/* Win Status - real data */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Win Status</span>
          {participant?.hasWon ? (
            <span className="font-semibold text-green-600">Won!</span>
          ) : (
            <span className="font-semibold text-slate-400">Not won yet</span>
          )}
        </div>

        {/* Collateral info */}
        {participant && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Missed Payments</span>
            <span className={`font-semibold ${participant.missedPayments > 0 ? "text-red-600" : "text-green-600"}`}>
              {participant.missedPayments === 0 ? "Perfect record" : `${participant.missedPayments} missed`}
            </span>
          </div>
        )}
      </div>

      <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-center">
        <p className="text-green-700 text-sm font-medium">
          Pool ID: #{pool.id.toString()}
        </p>
      </div>
    </div>
  );
}

// Completed Pool Card Component - reads real participant data
function CompletedPoolCard({
  pool,
  userAddress,
}: {
  pool: Pool;
  userAddress: `0x${string}` | undefined;
}) {
  const tierConfig = POOL_TIERS[pool.tier];
  const { data: participant } = useParticipantInfo(pool.id, userAddress);

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

        {participant && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Won</span>
              <span className={`font-semibold ${participant.hasWon ? "text-green-600" : "text-slate-400"}`}>
                {participant.hasWon ? "Yes" : "No"}
              </span>
            </div>

            <div className="border-t border-slate-200 pt-3 mt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Pot Received</span>
                <span className="font-bold text-slate-900">
                  {formatIDRX(participant.potReceived)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-slate-500">Yield Earned</span>
                <span className="font-semibold text-green-600">
                  +{formatIDRX(participant.collateralYieldEarned)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
        <p className="text-green-700 text-sm text-center">
          Pool #{pool.id.toString()} completed
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
