'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { 
  PlusCircle, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  CheckCircle2, 
  XCircle,
  AlertCircle
} from 'lucide-react'

interface Activity {
  id: string
  action: string
  entity_type: string
  staff_name: string
  created_at: string
}

interface Props {
  activities: Activity[]
}

const getActionIcon = (action: string) => {
  const a = action.toLowerCase()
  if (a.includes('create')) return <PlusCircle className="w-4 h-4 text-emerald-500" />
  if (a.includes('pickup') || a.includes('out')) return <ArrowUpCircle className="w-4 h-4 text-blue-500" />
  if (a.includes('return')) return <ArrowDownCircle className="w-4 h-4 text-orange-500" />
  if (a.includes('complete') || a.includes('close')) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
  if (a.includes('cancel')) return <XCircle className="w-4 h-4 text-rose-500" />
  return <AlertCircle className="w-4 h-4 text-slate-500" />
}

export function RecentActivity({ activities }: Props) {
  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No recent activity</p>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="mt-1">
                    {getActionIcon(activity.action)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.staff_name} <span className="text-slate-500 font-normal">{activity.action}</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {activity.entity_type} • {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
