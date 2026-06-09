import { Skeleton } from '@/components/ui/skeleton'

export default function CustomerDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Skeleton className="h-9 w-52" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
