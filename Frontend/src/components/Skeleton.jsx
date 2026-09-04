export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-white/15 ${className}`} aria-hidden="true" />;
}

export function BusResultsSkeleton() {
  return <div className="grid gap-4" aria-busy="true" aria-label="Loading bus results">{Array.from({ length: 5 }, (_, index) => <div key={index} className="rounded-xl border border-white/10 bg-white/10 p-5"><Skeleton className="h-5 w-2/5" /><Skeleton className="mt-4 h-4 w-3/5" /><Skeleton className="mt-3 h-4 w-1/3" /><Skeleton className="mt-5 h-10 w-full" /></div>)}</div>;
}

export function TableSkeleton({ rows = 5 }) {
  return <div className="grid gap-3" aria-busy="true" aria-label="Loading data">{Array.from({ length: rows }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div>;
}
