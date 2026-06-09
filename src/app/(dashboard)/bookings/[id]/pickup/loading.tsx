import { Skeleton } from '@/components/ui/skeleton'

export default function PickupLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      <Skeleton className="h-12 w-72" />
      <Skeleton className="h-20 rounded-lg" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}
