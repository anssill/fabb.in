'use client'

import { useCustomerOutfitHistory } from '@/lib/queries/useCustomers'
import { format } from 'date-fns'
import { 
  Loader2,
  Calendar,
  Tag,
  ChevronRight,
  Shirt
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'

export function CustomerOutfitHistory({ customerId }: { customerId: string }) {
  const { data: history, isLoading } = useCustomerOutfitHistory(customerId)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p className="text-sm">Loading outfit history...</p>
      </div>
    )
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-400 bg-zinc-50 rounded-2xl border border-dashed">
        <Shirt className="h-10 w-10 mb-3 opacity-20" />
        <p className="text-sm font-medium">No outfits rented yet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {history.map((record: any) => (
        <div key={record.id} className="group border border-zinc-100 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300">
          <div className="relative aspect-[3/4] bg-zinc-100">
            {record.item?.image_url ? (
              <Image 
                src={record.item.image_url} 
                alt={record.item.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-300">
                <Shirt className="w-12 h-12" />
              </div>
            )}
            <div className="absolute top-3 right-3">
              <Badge className="bg-white/90 backdrop-blur-md text-zinc-900 border-none shadow-sm capitalize">
                {record.bookings.status}
              </Badge>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div>
              <h4 className="font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors truncate">
                {record.item?.name || 'Unknown Item'}
              </h4>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                SKU: {record.item?.sku || 'N/A'} · SZ: {record.size}
              </p>
            </div>

            <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-50">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>Rented {format(new Date(record.bookings.created_at), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Tag className="w-3.5 h-3.5" />
                <span>Booking {record.bookings.id_display || record.bookings.id.slice(0,8)}</span>
              </div>
            </div>

            <Link 
              href={`/bookings/${record.bookings.id}`}
              className="flex items-center justify-between w-full mt-2 px-3 py-2 bg-zinc-50 hover:bg-[#ccff00] text-zinc-600 hover:text-zinc-900 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
            >
              View Booking
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
