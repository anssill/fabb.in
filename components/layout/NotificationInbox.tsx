'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
} from '@/lib/queries/useNotifications'
import { timeAgo } from '@/lib/format'
import type { Notification } from '@/lib/types/echo'
import {
  AlertTriangle,
  CheckCircle2,
  BellRing,
  Package,
  UserX,
  Megaphone,
  CreditCard,
  Check,
} from 'lucide-react'

const TYPE_META: Record<
  Notification['type'],
  { icon: React.ReactNode; colour: string; label: string }
> = {
  overdue: {
    icon: <AlertTriangle className="w-4 h-4" />,
    colour: 'text-red-500 bg-red-50 dark:bg-red-900/20',
    label: 'Overdue',
  },
  approval_pending: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    colour: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    label: 'Approval',
  },
  low_stock: {
    icon: <Package className="w-4 h-4" />,
    colour: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
    label: 'Stock',
  },
  washing_urgent: {
    icon: <BellRing className="w-4 h-4" />,
    colour: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
    label: 'Washing',
  },
  blacklist_attempt: {
    icon: <UserX className="w-4 h-4" />,
    colour: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    label: 'Blacklist',
  },
  announcement: {
    icon: <Megaphone className="w-4 h-4" />,
    colour: 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800',
    label: 'Notice',
  },
  payment_pending: {
    icon: <CreditCard className="w-4 h-4" />,
    colour: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
    label: 'Payment',
  },
}

interface Props {
  open: boolean
  onClose: () => void
}

export function NotificationInbox({ open, onClose }: Props) {
  const { data: notifications, isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllRead()

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-base font-semibold">Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Badge className="bg-[#ccff00] text-black text-xs font-bold h-5 px-1.5">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-zinc-500 hover:text-zinc-900"
              onClick={() => markAllRead.mutate()}
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !notifications?.length ? (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-400">
              <BellRing className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {notifications.map((n) => {
                const meta = TYPE_META[n.type] ?? TYPE_META.announcement
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markRead.mutate(n.id)}
                    className={`flex gap-3 px-5 py-4 cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                      !n.is_read ? 'bg-zinc-50/70 dark:bg-zinc-900/40' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${meta.colour}`}
                    >
                      {meta.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm leading-snug ${
                            !n.is_read
                              ? 'font-semibold text-zinc-900 dark:text-zinc-50'
                              : 'text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <div className="w-2 h-2 rounded-full bg-[#ccff00] shrink-0 mt-1.5" />
                        )}
                      </div>
                      {n.body && (
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{n.body}</p>
                      )}
                      <p className="text-xs text-zinc-400 mt-1">{timeAgo(n.created_at)}</p>

                      {/* Inline actions */}
                      {n.action_type && !n.is_read && (
                        <div className="flex gap-2 mt-2">
                          {n.action_type === 'approve' || n.action_type === 'reject' ? (
                            <>
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-[#ccff00] text-black hover:bg-[#bce600] font-semibold"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markRead.mutate(n.id)
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-zinc-200 dark:border-zinc-700"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markRead.mutate(n.id)
                                }}
                              >
                                Reject
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-zinc-200 dark:border-zinc-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                markRead.mutate(n.id)
                              }}
                            >
                              View
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
