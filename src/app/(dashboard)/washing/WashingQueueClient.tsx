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
  Activity,
  List,
  LayoutGrid
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

const STAGE_LABELS: Record<string, string> = {
  in_washing: 'In Washing',
  in_fitting: 'In Fitting',
  maintenance: 'Maintenance',
  ready: 'Ready',
}

interface WashingQueueClientProps {
  initialLogs: any[]
  staffId: string
}

function ItemCard({
  log,
  loadingId,
  onMarkReady,
  onStageChange,
  compact = false,
}: {
  log: any
  loadingId: string | null
  onMarkReady: (id: string, itemId: string, branchId: string, businessId: string, condition: string) => void
  onStageChange: (id: string, itemId: string, stage: string) => void
  compact?: boolean
}) {
  const item = log.items
  const variant = log.item_variants
  const itemId = log.item_id || item?.id
  const isUrgent = log.priority === 'urgent'
  const isReady = log.stage === 'ready'

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border p-3 ${isUrgent ? 'border-red-200 bg-red-50/30' : 'border-slate-100 bg-white'} ${compact ? '' : 'sm:flex-row sm:items-center'}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${isReady ? 'bg-emerald-50' : 'bg-cyan-50'}`}>
          {isReady ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Waves className="w-4 h-4 text-cyan-600" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-medium text-slate-900 truncate">{item?.name || 'Item'}</p>
            <Badge className={`text-[10px] px-1.5 py-0 uppercase border-transparent shrink-0 ${PRIORITY_COLORS[log.priority]}`}>
              {log.priority}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 truncate">
            {variant?.size || 'Std'}{variant?.colour ? ` · ${variant.colour}` : ''}
            {log.notes ? ` · ${log.notes}` : ''}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {new Date(log.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 justify-end">
        {!isReady ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={`h-7 px-2 text-xs capitalize gap-1 font-medium ${STAGE_COLORS[log.stage]}`}>
                {STAGE_LABELS[log.stage] || log.stage}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onStageChange(log.id, itemId, 'in_washing')}>In Washing</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStageChange(log.id, itemId, 'in_fitting')}>In Fitting</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStageChange(log.id, itemId, 'maintenance')}>Maintenance</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Badge className={`text-xs capitalize ${STAGE_COLORS[log.stage]}`}>Ready</Badge>
        )}

        {!isReady && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1"
                disabled={loadingId === log.id}
              >
                {loadingId === log.id
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <><CheckCircle2 className="w-3 h-3" />Ready</>
                }
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-[10px] uppercase text-slate-400">Mark Condition</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onMarkReady(log.id, itemId, log.branch_id, log.business_id, 'excellent')}>
                <ShieldCheck className="mr-2 h-4 w-4 text-emerald-500" />Excellent / New
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMarkReady(log.id, itemId, log.branch_id, log.business_id, 'good')}>
                <Activity className="mr-2 h-4 w-4 text-blue-500" />Good / Used
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMarkReady(log.id, itemId, log.branch_id, log.business_id, 'fair')}>
                <Clock className="mr-2 h-4 w-4 text-amber-500" />Fair (Minor Wear)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] uppercase text-slate-400">Issues</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onMarkReady(log.id, itemId, log.branch_id, log.business_id, 'damaged')}>
                <AlertCircle className="mr-2 h-4 w-4 text-rose-500" />Damaged / Repair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

export function WashingQueueClient({ initialLogs, staffId }: WashingQueueClientProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const router = useRouter()

  async function handleMarkReady(queueId: string, itemId: string, branchId: string, businessId: string, condition: string) {
    setLoadingId(queueId)
    try {
      await markAsReady(queueId, itemId, staffId, branchId, businessId, condition as any)
      toast.success('Item marked as ready')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleStageChange(queueId: string, itemId: string, newStage: string) {
    setLoadingId(queueId)
    try {
      await updateQueueStage(queueId, itemId, newStage as any)
      toast.success(`Stage updated to ${STAGE_LABELS[newStage] || newStage}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update stage')
    } finally {
      setLoadingId(null)
    }
  }

  const KANBAN_STAGES = ['in_washing', 'in_fitting', 'maintenance', 'ready']

  if (initialLogs.length === 0) {
    return (
      <Card className="border-none shadow-sm">
        <CardContent className="py-16 text-center">
          <Waves className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900">No items in queue</h3>
          <p className="text-sm text-slate-500 mt-1">Ready items will automatically move to your available inventory.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex justify-end">
        <div className="flex items-center gap-1 rounded-2xl bg-white p-1 shadow-sm">
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'h-8 px-3 bg-[#4f46e5] text-white shadow-sm hover:bg-[#4338ca]' : 'h-8 px-3 text-slate-600 hover:bg-slate-50'}
          >
            <List className="w-3.5 h-3.5 mr-1.5" />
            List
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            onClick={() => setViewMode('kanban')}
            className={viewMode === 'kanban' ? 'h-8 px-3 bg-[#4f46e5] text-white shadow-sm hover:bg-[#4338ca]' : 'h-8 px-3 text-slate-600 hover:bg-slate-50'}
          >
            <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
            Kanban
          </Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        /* LIST VIEW */
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {initialLogs.map((log) => (
                <div key={log.id} className="p-4">
                  <ItemCard
                    log={log}
                    loadingId={loadingId}
                    onMarkReady={handleMarkReady}
                    onStageChange={handleStageChange}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* KANBAN VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {KANBAN_STAGES.map(stage => {
            const stageItems = initialLogs.filter(l => l.stage === stage)
            return (
              <div key={stage} className="flex flex-col gap-2">
                <div className={`flex items-center justify-between px-3 py-2 rounded-2xl ${STAGE_COLORS[stage]}`}>
                  <span className="text-sm font-semibold">{STAGE_LABELS[stage]}</span>
                  <Badge variant="outline" className="bg-white/60 border-transparent text-current h-5 px-1.5 text-xs">
                    {stageItems.length}
                  </Badge>
                </div>
                <div className="space-y-2 min-h-[120px]">
                  {stageItems.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl h-24 flex items-center justify-center">
                      <p className="text-xs text-slate-400">No items</p>
                    </div>
                  ) : (
                    stageItems.map(log => (
                      <ItemCard
                        key={log.id}
                        log={log}
                        loadingId={loadingId}
                        onMarkReady={handleMarkReady}
                        onStageChange={handleStageChange}
                        compact
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
