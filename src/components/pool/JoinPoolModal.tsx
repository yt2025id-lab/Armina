"use client";

import { useState } from "react";
import { Pool } from "@/types";
import {
  formatIDRX,
  POOL_TIERS,
  calculateCollateral,
  COLLATERAL_RATIO,
} from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ShieldIcon, CheckIcon } from "@/components/ui/Icons";

interface JoinPoolModalProps {
  pool: Pool;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  collateralDiscount?: number;
}

export function JoinPoolModal({
  pool,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  collateralDiscount = 0,
}: JoinPoolModalProps) {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  const tierConfig = POOL_TIERS[pool.tier];
  const baseCollateral = calculateCollateral(
    pool.contribution,
    pool.maxParticipants
  );
  const discountedCollateral = calculateCollateral(
    pool.contribution,
    pool.maxParticipants,
    collateralDiscount
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card dark:bg-dark-card rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-armina-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldIcon className="w-8 h-8 text-armina-primary" />
          </div>
          <h2 className="text-xl font-bold">Join {tierConfig.nameId}</h2>
          <p className="text-muted text-sm mt-1">
            Confirm to join the arisan pool
          </p>
        </div>

        {/* Details */}
        <Card className="mb-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted">Monthly Contribution</span>
              <span className="font-semibold">
                {formatIDRX(pool.contribution)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Total Rounds</span>
              <span className="font-semibold">
                {pool.maxParticipants} rounds
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Collateral ({COLLATERAL_RATIO}%)</span>
              <span className="font-semibold">
                {formatIDRX(baseCollateral)}
              </span>
            </div>
            {collateralDiscount > 0 && (
              <div className="flex justify-between text-armina-accent">
                <span>Reputation Discount ({collateralDiscount}%)</span>
                <span className="font-semibold">
                  -{formatIDRX(baseCollateral - discountedCollateral)}
                </span>
              </div>
            )}
            <div className="pt-3 border-t border-border flex justify-between">
              <span className="font-semibold">Total to Pay Now</span>
              <span className="font-bold text-armina-primary text-lg">
                {formatIDRX(discountedCollateral)}
              </span>
            </div>
          </div>
        </Card>

        {/* Terms */}
        <div
          className="flex items-start gap-3 mb-6 cursor-pointer"
          onClick={() => setAgreed(!agreed)}
        >
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
              agreed
                ? "bg-armina-primary border-armina-primary"
                : "border-border"
            }`}
          >
            {agreed && <CheckIcon className="w-3 h-3 text-white" />}
          </div>
          <p className="text-sm text-muted">
            I understand that the collateral will be returned after the pool is completed
            and I commit to paying contributions on time every month.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={onConfirm}
            disabled={!agreed}
            isLoading={isLoading}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
