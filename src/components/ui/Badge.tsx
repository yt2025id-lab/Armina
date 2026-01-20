"use client";

import { ReactNode } from "react";
import { ReputationLevel } from "@/types";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  const variantStyles = {
    default: "bg-secondary text-secondary-foreground",
    success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  };

  return (
    <span
      className={`badge ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

interface ReputationBadgeProps {
  level: ReputationLevel;
  score?: number;
  showScore?: boolean;
  className?: string;
}

const levelConfig: Record<ReputationLevel, { label: string; class: string; icon: string }> = {
  bronze: { label: "Bronze", class: "badge-bronze", icon: "🥉" },
  silver: { label: "Silver", class: "badge-silver", icon: "🥈" },
  gold: { label: "Gold", class: "badge-gold", icon: "🥇" },
  diamond: { label: "Diamond", class: "badge-diamond", icon: "💎" },
};

export function ReputationBadge({
  level,
  score,
  showScore = false,
  className = "",
}: ReputationBadgeProps) {
  const config = levelConfig[level];

  return (
    <span className={`badge ${config.class} gap-1 ${className}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
      {showScore && score !== undefined && (
        <span className="font-semibold">({score})</span>
      )}
    </span>
  );
}

interface PoolStatusBadgeProps {
  status: "open" | "active" | "completed" | "full";
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
  open: { label: "Open", variant: "success" },
  active: { label: "Active", variant: "info" },
  completed: { label: "Completed", variant: "default" },
  full: { label: "Full", variant: "warning" },
};

export function PoolStatusBadge({ status, className = "" }: PoolStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
