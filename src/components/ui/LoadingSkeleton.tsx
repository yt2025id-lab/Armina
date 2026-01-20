export function BalanceSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-20"></div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 animate-pulse">
      <div className="space-y-3">
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        <div className="h-8 bg-slate-200 rounded w-full"></div>
      </div>
    </div>
  );
}

export function PoolCardSkeleton() {
  return (
    <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200 animate-pulse">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-6 bg-slate-200 rounded w-24"></div>
            <div className="h-4 bg-slate-200 rounded w-32"></div>
          </div>
          <div className="h-6 bg-slate-200 rounded-full w-16 px-3 py-1"></div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="h-3 bg-slate-200 rounded w-20"></div>
            <div className="h-5 bg-slate-200 rounded w-24"></div>
          </div>
          <div className="space-y-1">
            <div className="h-3 bg-slate-200 rounded w-20"></div>
            <div className="h-5 bg-slate-200 rounded w-24"></div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="h-2 bg-slate-200 rounded-full w-full"></div>
          <div className="h-3 bg-slate-200 rounded w-32"></div>
        </div>

        {/* Button */}
        <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <PoolCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200 animate-pulse"
        >
          <div className="h-8 bg-slate-200 rounded w-16 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-24"></div>
        </div>
      ))}
    </div>
  );
}
