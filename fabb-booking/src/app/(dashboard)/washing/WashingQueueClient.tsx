'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Waves, CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react'
import { markAsReady } from './washing-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  normal: 'bg-blue-100 text-blue-700',
  low: 'bg-slate-100 text-slate-700',
}

const STAGE_COLORS: Record<string, string> = {
  in_washing: 'bg-amber-100 text-amber-700',
  ready: 'bg-green-100 text-green-700',
}

interface WashingQueueClientProps {
  initialLogs: any[]
  staffId: string
}

export function WashingQueueClient({ initialLogs, staffId }: WashingQueueClientProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const router = useRouter()

  async function handleMarkReady(queueId: string, itemId: string, branchId: string, businessId: string) {
    setLoadingId(queueId)
    try {
      await markAsReady(queueId, itemId, staffId, branchId, businessId)
      toast.success('Item marked as ready for pickup')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <Card>
      <CardContent className="p-0">
        {initialLogs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {initialLogs.map((log) => {
              const item = log.items
              const variant = log.item_variants
              const isUrgent = log.priority === 'urgent'
              const isReady = log.stage === 'ready'

              return (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isReady ? 'bg-green-50' : 'bg-cyan-50'}`}>
                      {isReady ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Waves className="w-5 h-5 text-cyan-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900">{item?.name || 'Item'}</p>
                        <Badge className={`text-[10px] px-1.5 py-0 uppercase ${PRIORITY_COLORS[log.priority]}`}>
                          {log.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {variant?.size || 'Standard'} {variant?.colour ? `· ${variant.colour}` : ''}
                        {log.notes && ` · ${log.notes}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-slate-400 uppercase font-medium">Added On</p>
                      <p className="text-xs text-slate-600">{new Date(log.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={`text-xs capitalize ${STAGE_COLORS[log.stage]}`}>
                        {log.stage?.replace('_', ' ')}
                      </Badge>

                      {!isReady && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-8 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                          onClick={() => handleMarkReady(log.id, item.id, log.branch_id, log.business_id)}
                          disabled={loadingId === log.id}
                        >
                          {loadingId === log.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Mark Ready'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Waves className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900">No items in queue</h3>
            <p className="text-sm text-slate-500 mt-1">Ready items will automatically move to your available inventory.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
