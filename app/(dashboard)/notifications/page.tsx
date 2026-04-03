'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, MessageCircle, Search, Check, X, UserPlus, CreditCard, AlertTriangle, Package, Clock, ShieldCheck } from 'lucide-react'
import { useNotifications, useMarkNotificationRead, useMarkAllRead, useWhatsAppLog } from '@/lib/queries/useNotifications'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

const ICONS: Record<string, React.ReactNode> = {
  approval_pending: <UserPlus className="w-4 h-4 text-purple-500" />,
  overdue: <AlertTriangle className="w-4 h-4 text-red-500" />,
  payment_pending: <CreditCard className="w-4 h-4 text-emerald-500" />,
  low_stock: <Package className="w-4 h-4 text-blue-500" />,
  washing_urgent: <Clock className="w-4 h-4 text-amber-500" />,
  blacklist_attempt: <ShieldCheck className="w-4 h-4 text-red-500" />,
  announcement: <Bell className="w-4 h-4 text-zinc-500" />,
}

export default function NotificationsPage() {
  const [tab, setTab] = useState<'inbox' | 'whatsapp'>('inbox')
  
  const { data: notifications, isLoading: notifyLoading } = useNotifications()
  const { data: whatsappLog, isLoading: whatsappLoading } = useWhatsAppLog()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllRead()
  
  const unreadCount = notifications?.filter(n => !n.is_read).length ?? 0

  if (notifyLoading || whatsappLoading) {
    return (
      <div className="p-8 space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-2 mt-8">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Notifications</h1>
            {unreadCount > 0 && <Badge className="bg-red-500 text-white border-0 text-xs px-2">{unreadCount} new</Badge>}
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">In-app alerts and WhatsApp message log.</p>
        </div>
        <Button 
          variant="outline" 
          className="h-10 border-zinc-200 dark:border-zinc-800 text-sm"
          onClick={() => markAllRead.mutate()}
          disabled={unreadCount === 0 || markAllRead.isPending}
        >
          {markAllRead.isPending ? 'Marking...' : 'Mark all as read'}
        </Button>
      </div>

      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-lg w-fit">
        <button 
          onClick={() => setTab('inbox')} 
          className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${tab === 'inbox' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          <Bell className="w-4 h-4" /> Inbox {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center">{unreadCount}</span>}
        </button>
        <button 
          onClick={() => setTab('whatsapp')} 
          className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${tab === 'whatsapp' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          <MessageCircle className="w-4 h-4" /> WhatsApp Log
        </button>
      </div>

      {tab === 'inbox' && (
        <div className="space-y-3">
          {notifications?.map((n) => (
            <Card 
              key={n.id} 
              className={`border shadow-sm transition-all hover:shadow-md cursor-pointer ${!n.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}
              onClick={() => !n.is_read && markRead.mutate(n.id)}
            >
              <CardContent className="p-4 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!n.is_read ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                  {ICONS[n.type] || <Bell className="w-4 h-4 text-zinc-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-semibold truncate ${!n.is_read ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-700 dark:text-zinc-300'}`}>{n.title}</h3>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-2">{n.body || 'No message content'}</p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 font-medium uppercase tracking-wider">{format(new Date(n.created_at), 'MMM d, h:mm a')}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {notifications?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <Bell className="w-12 h-12 text-zinc-200 dark:text-zinc-800 mb-4" />
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Your notifications inbox is empty</p>
            </div>
          )}
        </div>
      )}

      {tab === 'whatsapp' && (
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-base text-zinc-900 dark:text-zinc-100">Meta Multi-agent WhatsApp History</CardTitle>
            <CardDescription className="text-zinc-500">Log of all manual and automated messages sent via API.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                  <tr>
                    <th className="text-left text-[10px] font-bold uppercase text-zinc-500 tracking-wider px-6 py-4">Recipient</th>
                    <th className="text-left text-[10px] font-bold uppercase text-zinc-500 tracking-wider px-6 py-4">Type</th>
                    <th className="text-left text-[10px] font-bold uppercase text-zinc-500 tracking-wider px-6 py-4">Content</th>
                    <th className="text-left text-[10px] font-bold uppercase text-zinc-500 tracking-wider px-6 py-4">Sent At</th>
                    <th className="text-center text-[10px] font-bold uppercase text-zinc-500 tracking-wider px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {whatsappLog?.map((msg) => (
                    <tr key={msg.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{msg.phone}</div>
                        <div className="text-[10px] text-zinc-400">Recipient ID: {msg.customer_id?.slice(0, 8) || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="text-[9px] font-bold uppercase border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
                          {msg.template_type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 max-w-[200px]">
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{msg.message_body}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500 dark:text-zinc-500">
                        {format(new Date(msg.sent_at), 'MMM d, HH:mm')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="outline" className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          msg.status === 'sent' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 
                          msg.status === 'pending' ? 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' : 
                          'border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {msg.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {whatsappLog?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-24">
                        <MessageCircle className="w-12 h-12 text-zinc-200 dark:text-zinc-800 mx-auto mb-4" />
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">No outbound messages recorded</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
