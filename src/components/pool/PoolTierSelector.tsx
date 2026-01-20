"use client";

import { PoolTier } from "@/types";
import { POOL_TIERS, calculateCollateral, formatIDRX } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import { CheckIcon } from "@/components/ui/Icons";

interface PoolTierSelectorProps {
  selectedTier: PoolTier | null;
  onSelect: (tier: PoolTier) => void;
  participantCount?: number;
}

export function PoolTierSelector({
  selectedTier,
  onSelect,
  participantCount = 5,
}: PoolTierSelectorProps) {
  const tiers: PoolTier[] = ["small", "medium", "large"];

  return (
    <div className="space-y-3">
      {tiers.map((tier) => {
        const config = POOL_TIERS[tier];
        const isSelected = selectedTier === tier;
        const collateral = calculateCollateral(
          config.contribution,
          participantCount
        );

        return (
          <Card
            key={tier}
            hover
            onClick={() => onSelect(tier)}
            className={`relative transition-all ${
              isSelected
                ? "border-armina-primary border-2 bg-armina-primary/5"
                : ""
            }`}
          >
            {isSelected && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-armina-primary rounded-full flex items-center justify-center">
                <CheckIcon className="w-4 h-4 text-white" />
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{config.nameId}</h3>
              <p className="text-2xl font-bold text-armina-primary">
                {config.contributionDisplay}
                <span className="text-sm font-normal text-muted">/month</span>
              </p>

              <div className="pt-2 border-t border-border space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Participants</span>
                  <span>
                    {config.minParticipants}-{config.maxParticipants} people
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Cycle</span>
                  <span>{config.cycleDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Est. Collateral</span>
                  <span className="text-armina-warning">
                    {formatIDRX(collateral)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
