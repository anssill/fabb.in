'use client'

import { useCustomerActivity } from '@/lib/queries/useCustomers'
import { format } from 'date-fns'
import { 
  ShoppingBag, 
  MessageSquare, 
  CreditCard, 
  UserPlus, 
  Pin,
  ChevronRight,
  Loader2,
  Clock
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface ActivityItem {
  id: string
  type: string
  date: string
  title: string
  description: string
  status?: string
  link?: string
  author?: string
}

export function CustomerActivityTimeline({ customerId }: { customerId: string }) {
  const { data, isLoading } = useCustomerActivity(customerId)
  const activities = data as ActivityItem[] | undefined

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p className="text-sm">Loading activity history...</p>
      </div>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-400 bg-zinc-50 rounded-2xl border border-dashed">
        <Clock className="h-10 w-10 mb-3 opacity-20" />
        <p className="text-sm font-medium">No recent activity recorded</p>
      </div>
    )
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking': return <ShoppingBag className="h-4 w-4" />
      case 'note': return <MessageSquare className="h-4 w-4" />
      case 'pinned_note': return <Pin className="h-4 w-4" />
      case 'payment': return <CreditCard className="h-4 w-4" />
      default: return <UserPlus className="h-4 w-4" />
    }
  }

  const getIconBg = (type: string) => {
    switch (type) {
      case 'booking': return 'bg-indigo-100 text-indigo-600'
      case 'note': return 'bg-zinc-100 text-zinc-600'
      case 'pinned_note': return 'bg-amber-100 text-amber-600'
      case 'payment': return 'bg-emerald-100 text-emerald-600'
      default: return 'bg-blue-100 text-blue-600'
    }
  }

  return (
    <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-zinc-200 before:via-zinc-200 before:to-transparent">
      {activities.map((item, idx) => (
        <div key={item.id} className="relative flex items-start gap-6 group">
          {/* Connector Icon */}
          <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full shrink-0 shadow-sm border-4 border-white ${getIconBg(item.type)}`}>
            {getIcon(item.type)}
          </div>

          <div className="flex-1 pt-1.5 pb-2">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                {item.title}
                {item.status && (
                  <Badge variant="outline" className="px-1.5 py-0 h-4 text-[9px] uppercase font-bold tracking-wider">
                    {item.status}
                  </Badge>
                )}
              </h4>
              <time className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                {format(new Date(item.date), 'MMM d, yyyy · h:mm a')}
              </time>
            </div>
            
            <p className="text-sm text-zinc-600 leading-relaxed max-w-2xl">
              {item.description}
            </p>

            {item.link ? (
              <Link 
                href={item.link}
                className="inline-flex items-center mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                View Details
                <ChevronRight className="ml-1 h-3 w-3" />
              </Link>
            ) : item.author ? (
              <div className="mt-3 text-[10px] font-bold text-zinc-400 uppercase">
                Logged by {item.author}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}
