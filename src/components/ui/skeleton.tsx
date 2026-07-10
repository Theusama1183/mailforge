export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-800 ${className}`} />
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-10 w-32" />
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-28" />
    </div>
  )
}

export function ListSkeleton({ rows = 6, compact = false }: { rows?: number; compact?: boolean }) {
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`flex items-center gap-3 ${compact ? "p-2" : "p-4"}`}>
          <Skeleton className={`rounded-full ${compact ? "h-6 w-6" : "h-8 w-8"}`} />
          <div className="flex-1 space-y-1.5">
            <Skeleton className={`${compact ? "h-3 w-32" : "h-4 w-48"}`} />
            <Skeleton className={`${compact ? "h-2.5 w-full" : "h-3 w-full"}`} />
          </div>
          <Skeleton className={`${compact ? "h-3 w-12" : "h-4 w-16"}`} />
        </div>
      ))}
    </div>
  )
}
