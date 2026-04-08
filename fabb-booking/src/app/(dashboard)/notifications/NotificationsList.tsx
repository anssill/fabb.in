'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, CheckCheck, Trash2, ExternalLink } from 'lucide-react'
import { markAsRead, markAllAsRead, deleteNotification } from './notification-actions'
import { toast } from 'sonner'
import Link from 'next/link'

interface NotificationsListProps {
  initialNotifications: any[]
}

export function NotificationsList({ initialNotifications }: NotificationsListProps) {
  const [notifications, setNotifications] = useState(initialNotifications)

  async function handleMarkAllAsRead() {
    const res = await markAllAsRead()
    if (res.success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      toast.success('All notifications marked as read')
    }
  }

  async function handleMarkRead(id: string) {
    const res = await markAsRead(id)
    if (res.success) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    }
  }

  async function handleDelete(id: string) {
    const res = await deleteNotification(id)
    if (res.success) {
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success('Notification deleted')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500">Stay updated on your bookings and activities</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleMarkAllAsRead}
          disabled={!notifications.some(n => !n.is_read)}
        >
          <CheckCheck className="w-4 h-4 mr-2" />
          Mark all as read
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          {notifications && notifications.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors group ${
                    !notif.is_read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    notif.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                    notif.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                    notif.type === 'error' ? 'bg-rose-100 text-rose-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`text-sm ${!notif.is_read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                          {notif.title}
                        </p>
                        <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{notif.body}</p>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {notif.action_url && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" asChild>
                            <Link href={notif.action_url}>
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-rose-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(notif.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-slate-400">
                        {new Date(notif.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {!notif.is_read && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 px-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                You'll see notifications here for new bookings, low stock alerts, and overdue returns.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
