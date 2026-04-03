'use client'

import { useState, useMemo, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Clock,
  AlertTriangle,
  Search,
  Loader2,
  UserPlus,
  Timer,
  Truck,
  DollarSign,
  CheckSquare,
  Square,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  useWashingQueue,
  useWashingRealtime,
  useAdvanceWashingStage,
  useBulkAdvanceStage,
  useAssignWashingItem,
  useLogWashingExpense,
  WashingStage,
  STAGE_ORDER,
  STAGE_LABELS,
  WashingPriority,
} from '@/lib/queries/useWashingQueue'
import { differenceInHours, formatDistanceToNow, isPast } from 'date-fns'

export default function WashingQueuePage() {
  const { data: allItems = [], isLoading } = useWashingQueue()
  const bulkAdvance = useBulkAdvanceStage()

  // Enable realtime sync
  useWashingRealtime()

  const [activeTab, setActiveTab] = useState<WashingStage | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Filter items for the active tab
  const displayItems = useMemo(() => {
    let items = allItems
    if (activeTab !== 'all') {
      items = items.filter((i: any) => i.stage === activeTab)
    }
    if (search) {
      const s = search.toLowerCase()
      items = items.filter(
        (i: any) =>
          i.items?.name?.toLowerCase().includes(s) ||
          i.items?.sku?.toLowerCase().includes(s)
      )
    }
    return items
  }, [allItems, activeTab, search])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleBulkAdvance = async () => {
    const items = displayItems
      .filter((i: any) => selectedIds.has(i.id) && i.stage !== 'ready')
      .map((i: any) => ({ id: i.id, currentStage: i.stage as WashingStage }))

    if (!items.length) return
    if (!confirm(`Advance ${items.length} items to the next stage?`)) return

    await bulkAdvance.mutateAsync(items)
    setSelectedIds(new Set())
  }

  // Count per stage
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allItems.length }
    for (const stage of STAGE_ORDER) {
      counts[stage] = allItems.filter((i: any) => i.stage === stage).length
    }
    return counts
  }, [allItems])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Washing Ops
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Manage cleaning workflows, SLAs, and vendor tracking.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Search SKU or Item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white dark:bg-zinc-900"
            />
          </div>
        </div>
      </div>

      {/* Stage Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-zinc-900 text-white shadow-sm'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          All ({stageCounts.all})
        </button>
        {STAGE_ORDER.map((stage) => (
          <button
            key={stage}
            onClick={() => setActiveTab(stage)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === stage
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {STAGE_LABELS[stage]} ({stageCounts[stage] || 0})
          </button>
        ))}
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-300 bg-zinc-50 shadow-sm">
          <span className="text-sm font-semibold text-zinc-700">
            {selectedIds.size} selected
          </span>
          <Button
            size="sm"
            className="gap-2 bg-zinc-900 text-white"
            onClick={handleBulkAdvance}
            disabled={bulkAdvance.isPending}
          >
            {bulkAdvance.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
            <ArrowRight className="w-4 h-4" /> Advance Stage
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
            className="text-red-500"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading queue...
        </div>
      ) : displayItems.length === 0 ? (
        <div className="border-2 border-dashed rounded-xl p-12 text-center text-zinc-400">
          <p className="font-medium text-lg">No items in this stage</p>
          <p className="text-sm mt-1">Items will appear here as bookings are returned.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayItems.map((item: any) => (
            <WashingCard
              key={item.id}
              item={item}
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={() => toggleSelect(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function WashingCard({
  item,
  isSelected,
  onToggleSelect,
}: {
  item: any
  isSelected: boolean
  onToggleSelect: () => void
}) {
  const advanceMutation = useAdvanceWashingStage()
  const assignMutation = useAssignWashingItem()
  const logExpense = useLogWashingExpense()

  const [costInput, setCostInput] = useState('')

  const priority: WashingPriority = item.priority || 'normal'
  const isUrgent = priority === 'urgent'

  // Auto-detect URGENT: if booking return is within 24 hours
  const bookingReturn = item.booking?.return_date
  const autoUrgent =
    bookingReturn && differenceInHours(new Date(bookingReturn), new Date()) <= 24

  // SLA countdown (only for urgent items)
  const slaDeadline = item.sla_deadline
  const slaExpired = slaDeadline && isPast(new Date(slaDeadline))
  const slaRemaining = slaDeadline
    ? formatDistanceToNow(new Date(slaDeadline), { addSuffix: true })
    : null

  // External vendor
  const isExternal = item.is_external
  const vendorOverdue =
    isExternal &&
    item.vendor_expected_return &&
    isPast(new Date(item.vendor_expected_return))

  // Hours in current stage
  const hoursInStage = Math.floor(
    (Date.now() - new Date(item.entered_at).getTime()) / (1000 * 60 * 60)
  )

  const handleLogCost = async () => {
    if (!costInput) return
    await logExpense.mutateAsync({
      washingId: item.id,
      cost: Number(costInput),
      vendorName: item.external_vendor,
    })
    setCostInput('')
  }

  return (
    <div
      className={`p-4 rounded-xl border bg-white dark:bg-zinc-900 shadow-sm transition-all hover:shadow-md ${
        isUrgent || autoUrgent
          ? 'border-red-300 dark:border-red-900/50 ring-1 ring-red-200'
          : vendorOverdue
            ? 'border-amber-300 ring-1 ring-amber-200'
            : isSelected
              ? 'border-zinc-900 ring-1 ring-zinc-400'
              : 'border-zinc-200 dark:border-zinc-800'
      }`}
    >
      {/* Top Row */}
      <div className="flex justify-between items-start gap-2 mb-3">
        <div className="flex items-center gap-2">
          <button onClick={onToggleSelect} className="shrink-0">
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-zinc-900" />
            ) : (
              <Square className="w-5 h-5 text-zinc-300" />
            )}
          </button>
          <Badge
            className={`text-[10px] font-bold px-1.5 py-0 uppercase tracking-widest ${
              isUrgent || autoUrgent
                ? 'bg-red-100 text-red-700'
                : priority === 'high'
                  ? 'bg-orange-100 text-orange-700'
                  : priority === 'low'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-zinc-100 text-zinc-600'
            }`}
            variant="secondary"
          >
            {autoUrgent && !isUrgent ? '⚡ AUTO-URGENT' : priority.toUpperCase()}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Badge variant="secondary" className="bg-zinc-100 text-zinc-500 text-[10px] font-mono">
            {STAGE_LABELS[item.stage as WashingStage]}
          </Badge>
          {item.stage !== 'ready' && (
            <span className="flex items-center gap-1 text-zinc-500 font-medium">
              <Clock className="w-3 h-3" />
              {hoursInStage}h
            </span>
          )}
        </div>
      </div>

      {/* Item Info */}
      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm leading-tight mb-0.5">
        {item.items?.name || 'Unknown Item'}
      </h4>
      <p className="text-xs font-mono text-zinc-400 mb-3">
        {item.items?.sku || 'N/A'}
      </p>

      {/* SLA Countdown (URGENT only) */}
      {(isUrgent || autoUrgent) && slaDeadline && (
        <div
          className={`flex items-center gap-2 text-xs font-semibold px-2 py-1.5 rounded-lg mb-3 ${
            slaExpired
              ? 'bg-red-100 text-red-700'
              : 'bg-amber-50 text-amber-700'
          }`}
        >
          <Timer className="w-3.5 h-3.5" />
          SLA {slaExpired ? 'EXPIRED' : slaRemaining}
        </div>
      )}

      {/* External Vendor */}
      {isExternal && (
        <div
          className={`flex items-center gap-2 text-xs font-medium px-2 py-1.5 rounded-lg mb-3 ${
            vendorOverdue
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          {item.external_vendor || 'External'}{' '}
          {vendorOverdue && (
            <span className="ml-auto flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> OVERDUE
            </span>
          )}
        </div>
      )}

      {/* Assigned */}
      {item.assigned_staff ? (
        <p className="text-xs text-zinc-500 mb-3">
          Assigned to{' '}
          <span className="font-semibold text-zinc-700">
            {item.assigned_staff.name}
          </span>
        </p>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mb-3 text-xs h-7 bg-zinc-50 hover:bg-emerald-50 hover:text-emerald-700 transition-colors gap-1.5"
          onClick={() => assignMutation.mutate({ id: item.id })}
          disabled={assignMutation.isPending}
        >
          {assignMutation.isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <UserPlus className="w-3 h-3" />
          )}
          Take this item
        </Button>
      )}

      {/* Cost Logger (for external items) */}
      {isExternal && !item.cost && (
        <div className="flex gap-2 mb-3">
          <Input
            type="number"
            placeholder="₹ Cost"
            value={costInput}
            onChange={(e) => setCostInput(e.target.value)}
            className="h-7 text-xs"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 shrink-0"
            onClick={handleLogCost}
            disabled={logExpense.isPending || !costInput}
          >
            <DollarSign className="w-3 h-3" /> Log
          </Button>
        </div>
      )}
      {item.cost && (
        <p className="text-xs text-zinc-500 mb-3">
          Cost: <span className="font-mono font-semibold">₹{item.cost?.toLocaleString('en-IN')}</span>
        </p>
      )}

      {/* Action Button */}
      {item.stage !== 'ready' ? (
        <Button
          onClick={() =>
            advanceMutation.mutate({
              id: item.id,
              currentStage: item.stage as WashingStage,
            })
          }
          disabled={advanceMutation.isPending}
          variant="ghost"
          className="w-full h-8 text-xs font-medium bg-zinc-50 dark:bg-zinc-950 hover:bg-[#ccff00] hover:text-black transition-colors rounded-lg group text-zinc-600 dark:text-zinc-400"
        >
          {advanceMutation.isPending ? (
            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
          ) : null}
          Move to{' '}
          {STAGE_LABELS[
            STAGE_ORDER[STAGE_ORDER.indexOf(item.stage as WashingStage) + 1] as WashingStage
          ] || 'Next'}{' '}
          <ArrowRight className="w-3 h-3 ml-2 transition-transform group-hover:translate-x-1" />
        </Button>
      ) : (
        <div className="w-full h-8 flex items-center justify-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg">
          ✓ Ready — Item set to Available
        </div>
      )}
    </div>
  )
}
