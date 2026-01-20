"use client";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-secondary rounded-lg ${className}`}
    />
  );
}

export function PoolCardSkeleton() {
  return (
    <div className="bg-card dark:bg-dark-card rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <Skeleton className="h-10 w-full mt-4 rounded-xl" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-card dark:bg-dark-card rounded-2xl border border-border p-4">
      <Skeleton className="h-4 w-20 mb-2" />
      <Skeleton className="h-8 w-24" />
    </div>
  );
}
