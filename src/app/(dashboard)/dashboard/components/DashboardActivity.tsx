'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDistanceToNow } from 'date-fns'
import {
  PlusCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity,
} from 'lucide-react'

interface ActivityItem {
  id: string
  action: string
  entity_type: string
  staff_name: string
  created_at: string
}

interface Props {
  activities: ActivityItem[]
}

const getActionMeta = (action: string, entity: string) => {
  const a = action.toLowerCase()
  if (a.includes('create'))  return { icon: PlusCircle,     color: 'text-emerald-500', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700' }
  if (a.includes('pickup') || a.includes('out')) return { icon: ArrowUpCircle,   color: 'text-blue-500',    bg: 'bg-blue-50',    badge: 'bg-blue-100 text-blue-700' }
  if (a.includes('return'))  return { icon: ArrowDownCircle, color: 'text-orange-500', bg: 'bg-orange-50',  badge: 'bg-orange-100 text-orange-700' }
  if (a.includes('complete') || a.includes('close')) return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700' }
  if (a.includes('cancel'))  return { icon: XCircle,        color: 'text-rose-500',    bg: 'bg-rose-50',    badge: 'bg-rose-100 text-rose-700' }
  return { icon: AlertCircle, color: 'text-slate-400', bg: 'bg-slate-50', badge: 'bg-slate-100 text-slate-700' }
}

const initials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

export function DashboardActivity({ activities }: Props) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-500" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        <ScrollArea className="h-[340px]">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Activity className="w-8 h-8 mb-2 text-slate-300" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="divide-y">
              {activities.map((activity) => {
                const meta = getActionMeta(activity.action, activity.entity_type)
                const Icon = meta.icon
                return (
                  <div key={activity.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                    <div className={`mt-0.5 w-8 h-8 rounded-full ${meta.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-[10px] bg-slate-200 text-slate-700">
                            {initials(activity.staff_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {activity.staff_name}
                        </span>
                        <Badge variant="outline" className={`text-xs border-0 px-1.5 py-0 ${meta.badge}`}>
                          {activity.action}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                        {activity.entity_type.replace(/_/g, ' ')} &middot;{' '}
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
