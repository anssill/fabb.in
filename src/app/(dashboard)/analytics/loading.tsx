import { Skeleton } from '@/components/ui/skeleton'

export default function AnalyticsLoading() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-[1.25rem]" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-[1.25rem]" />
      <Skeleton className="h-64 rounded-[1.25rem]" />
    </div>
  )
}
