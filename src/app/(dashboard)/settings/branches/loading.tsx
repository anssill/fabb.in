import { Skeleton } from '@/components/ui/skeleton'

export default function BranchesLoading() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-20 rounded-2xl" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-56 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
