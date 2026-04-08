'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Waves, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Loader2, 
  ChevronDown,
  ShieldCheck,
  Activity
} from 'lucide-react'
import { markAsReady, updateQueueStage } from './washing-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  normal: 'bg-blue-100 text-blue-700',
  low: 'bg-slate-100 text-slate-700',
}

const STAGE_COLORS: Record<string, string> = {
  in_washing: 'bg-cyan-100 text-cyan-700',
  in_fitting: 'bg-purple-100 text-purple-700',
  maintenance: 'bg-rose-100 text-rose-700',
  ready: 'bg-emerald-100 text-emerald-700',
}

interface WashingQueueClientProps {
  initialLogs: any[]
  staffId: string
}

export function WashingQueueClient({ initialLogs, staffId }: WashingQueueClientProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const router = useRouter()

  async function handleMarkReady(queueId: string, itemId: string, branchId: string, businessId: string, condition: any = 'excellent') {
    setLoadingId(queueId)
    try {
      await markAsReady(queueId, itemId, staffId, branchId, businessId, condition)
      toast.success('Item marked as ready and condition updated')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleStageChange(queueId: string, itemId: string, newStage: any) {
    setLoadingId(queueId)
    try {
      await updateQueueStage(queueId, itemId, newStage)
      toast.success(`Stage updated to ${newStage.replace('_', ' ')}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update stage')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <CardContent className="p-0">
        {initialLogs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {initialLogs.map((log) => {
              const item = log.items
              const variant = log.item_variants
              const isUrgent = log.priority === 'urgent'
              const isReady = log.stage === 'ready'

              return (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 gap-4 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isReady ? 'bg-emerald-50' : 'bg-cyan-50'}`}>
                      {isReady ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Waves className="w-5 h-5 text-cyan-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900">{item?.name || 'Item'}</p>
                        <Badge className={`text-[10px] px-1.5 py-0 uppercase border-transparent ${PRIORITY_COLORS[log.priority]}`}>
                          {log.priority}
                        </Badge>
                        {item?.condition && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 border-slate-200 text-slate-500 font-normal">
                            {item.condition}
                          </Badge>
                        )}
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
                      {!isReady ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className={`h-7 px-2 text-xs capitalize gap-1 font-medium ${STAGE_COLORS[log.stage]}`}>
                              {log.stage?.replace('_', ' ')}
                              <ChevronDown className="w-3 h-3 opacity-50" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => handleStageChange(log.id, item.id, 'in_washing')}>
                              In Washing
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStageChange(log.id, item.id, 'in_fitting')}>
                              In Fitting
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStageChange(log.id, item.id, 'maintenance')}>
                              Maintenance
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Badge className={`text-xs capitalize ${STAGE_COLORS[log.stage]}`}>
                          {log.stage}
                        </Badge>
                      )}

                      {!isReady && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-1.5"
                              disabled={loadingId === log.id}
                            >
                              {loadingId === log.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Ready
                                </>
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-[10px] uppercase text-slate-400">Mark Condition</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleMarkReady(log.id, item.id, log.branch_id, log.business_id, 'excellent')}>
                              <ShieldCheck className="mr-2 h-4 w-4 text-emerald-500" />
                              <span>Excellent / New</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMarkReady(log.id, item.id, log.branch_id, log.business_id, 'good')}>
                              <Activity className="mr-2 h-4 w-4 text-blue-500" />
                              <span>Good / Used</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMarkReady(log.id, item.id, log.branch_id, log.business_id, 'fair')}>
                              <Clock className="mr-2 h-4 w-4 text-amber-500" />
                              <span>Fair (Minor Wear)</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[10px] uppercase text-slate-400">Issues</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleMarkReady(log.id, item.id, log.branch_id, log.business_id, 'damaged')}>
                              <AlertCircle className="mr-2 h-4 w-4 text-rose-500" />
                              <span>Damaged / Repair</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
