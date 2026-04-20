'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'
import { writeAuditLog } from '@/lib/audit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ReceiptPreview } from '@/components/bookings/ReceiptPreview'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  ArrowLeft, ChevronRight, AlertCircle, Check, Printer,
  MessageCircle, RotateCcw, Droplets, CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'

const RETURN_STEPS = [
  { id: 1, title: 'Condition' },
  { id: 2, title: 'Deposit' },
  { id: 3, title: 'Accessories' },
  { id: 4, title: 'Washing' },
  { id: 5, title: 'Confirm' },
]

const CONDITION_OPTIONS = ['excellent', 'good', 'fair', 'damaged', 'missing'] as const
type Condition = typeof CONDITION_OPTIONS[number]

const CONDITION_COLORS: Record<Condition, string> = {
  excellent: 'border-emerald-400 bg-emerald-50 text-emerald-700',
  good:      'border-blue-400 bg-blue-50 text-blue-700',
  fair:      'border-amber-400 bg-amber-50 text-amber-700',
  damaged:   'border-red-400 bg-red-50 text-red-700',
  missing:   'border-zinc-400 bg-zinc-50 text-zinc-700',
}

const WASHING_PRIORITIES = ['urgent', 'high', 'normal', 'low'] as const
type WashingPriority = typeof WASHING_PRIORITIES[number]

export default function ReturnPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()
  const profile = useUserStore((s) => s.profile)
  const queryClient = useQueryClient()

  const [step, setStep] = useState(1)

  // Step 1: Item condition after return
  const [itemConditions, setItemConditions] = useState<Record<string, Condition>>({})
  const [damageNotes, setDamageNotes] = useState<Record<string, string>>({})

  // Step 2: Deposit decision
  const [depositDecision, setDepositDecision] = useState<'full' | 'partial' | 'forfeit'>('full')
  const [penaltyAmount, setPenaltyAmount] = useState('')
  const [penaltyReason, setPenaltyReason] = useState('')

  // Step 3: Accessories returned
  const [accessoriesReturned, setAccessoriesReturned] = useState<Record<string, boolean>>({})

  // Step 4: Washing queue
  const [addToWashing, setAddToWashing] = useState(true)
  const [washingPriority, setWashingPriority] = useState<WashingPriority>('normal')

  // Step 5: Confirm
  const [showReceipt, setShowReceipt] = useState(false)

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customers (*),
          booking_items (id, size, quantity, price, subtotal, condition_before, item:items(id, name, sku, category)),
          booking_payments (id, type, amount, method, is_voided),
          booking_accessories (id, accessory_type, given_at_pickup, returned_at_return)
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const confirmReturn = useMutation({
    mutationFn: async () => {
      if (!booking || !profile) throw new Error('Missing data')
      const activeBranchId = profile.branch_id

      // Calculate deposit refund
      const depositHeld = booking.deposit_collected ?? 0
      const penalty = Number(penaltyAmount) || 0
      const depositRefund =
        depositDecision === 'full' ? depositHeld
        : depositDecision === 'partial' ? Math.max(0, depositHeld - penalty)
        : 0

      // Update booking → returned
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'returned',
          // returned_at is a field we'll assume exists given its usage in the original code
          // even if not in the strict shared interface yet
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (bookingError) throw bookingError

      // Update booking_items condition_after in parallel
      const itemUpdatePromises = Object.entries(itemConditions).map(([itemId, condition]) =>
        supabase
          .from('booking_items')
          .update({ condition_after: condition })
          .eq('id', itemId)
      )
      await Promise.all(itemUpdatePromises)

      // Record deposit refund/forfeit payment
      if (depositHeld > 0) {
        const paymentBatch = []
        if (depositDecision === 'partial' && penalty > 0) {
          paymentBatch.push({
            business_id: booking.business_id,
            branch_id: activeBranchId,
            booking_id: id,
            type: 'penalty',
            amount: penalty,
            method: 'store_credit', // Usually deducted or credited
            staff_id: profile.id,
          })
        }
        if (depositRefund > 0) {
          paymentBatch.push({
            business_id: booking.business_id,
            branch_id: activeBranchId,
            booking_id: id,
            type: 'refund',
            amount: depositRefund,
            method: 'cash',
            staff_id: profile.id,
          })
        }
        if (paymentBatch.length > 0) {
          await supabase.from('booking_payments').insert(paymentBatch)
        }
      }

      // Update accessories returned status
      const givenAccessories = (booking.booking_accessories ?? []) as any[]
      const accUpdatePromises = givenAccessories.map(acc => {
        const returned = accessoriesReturned[acc.id] !== false
        return supabase
          .from('booking_accessories')
          .update({ returned_at_return: returned })
          .eq('id', acc.id)
      })
      await Promise.all(accUpdatePromises)

      // Add to washing queue
      if (addToWashing) {
        const items = (booking.booking_items ?? []) as any[]
        const washEntries = items.filter(bi => bi.item).map(bi => ({
          business_id: booking.business_id,
          branch_id: activeBranchId,
          item_id: bi.item!.id,
          booking_id: id,
          priority: washingPriority,
          stage: 'queue',
          staff_id: profile.id,
        }))
        if (washEntries.length > 0) {
          await supabase.from('washing_queue').insert(washEntries)
        }
      }

      // Timeline entry
      await supabase.from('booking_timeline').insert({
        business_id: booking.business_id,
        branch_id: activeBranchId,
        booking_id: id,
        event_type: 'returned',
        description: `Items returned by ${booking.customers?.name ?? 'customer'}. Deposit: ${depositDecision}.`,
        staff_name: profile.name,
      })

      await writeAuditLog({
        action: 'UPDATE',
        tableName: 'bookings',
        recordId: id,
        newValue: { status: 'returned' },
        branchId: activeBranchId || '',
        businessId: profile.business_id || '',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      router.push(`/bookings/${id}`)
    },
  })

  if (isLoading) return <ReturnSkeleton />
  if (!booking) return null

  const bookingItems = (booking.booking_items ?? []) as {
    id: string
    size: string
    quantity: number
    condition_before: string | null
    item: { name: string; sku: string } | null
  }[]

  const givenAccessories = (booking.booking_accessories ?? []) as {
    id: string
    accessory_type: string
    given_at_pickup: boolean
  }[]

  const depositHeld = booking.deposit_collected ?? 0
  const penalty = Number(penaltyAmount) || 0
  const depositRefund =
    depositDecision === 'full' ? depositHeld
    : depositDecision === 'partial' ? Math.max(0, depositHeld - penalty)
    : 0

  const hasDamaged = Object.values(itemConditions).some(c => c === 'damaged' || c === 'missing')
  const allConditioned = bookingItems.every(bi => !!itemConditions[bi.id])

  const canAdvance = () => {
    switch (step) {
      case 1: return allConditioned
      case 2: return depositDecision === 'partial' ? penalty > 0 && penaltyReason.trim().length > 0 : true
      default: return true
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/bookings/${id}`}>
          <Button variant="ghost" size="icon" className="h-10 w-10 border rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Return — {booking.booking_id_display ?? id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-sm text-zinc-500">{booking.customers?.name} · Step {step} of 5</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5">
        {RETURN_STEPS.map((s) => (
          <div key={s.id} className="flex-1">
            <div className={`h-1.5 rounded-full mb-1 transition-colors ${
              step > s.id ? 'bg-[#ccff00]' : step === s.id ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-800'
            }`} />
            <span className={`text-xs font-medium ${step === s.id ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}`}>
              {s.id}. {s.title}
            </span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 min-h-[360px]">
        {/* Step 1: Item Condition After */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-semibold">Return Condition Check</h3>
              <p className="text-sm text-zinc-500 mt-1">Record condition of each item as returned.</p>
            </div>
            <div className="space-y-4">
              {bookingItems.map((bi) => (
                <div key={bi.id} className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{bi.item?.name ?? 'Item'}</p>
                      <p className="text-xs text-zinc-500">SKU: {bi.item?.sku} · Size: {bi.size}</p>
                    </div>
                    {bi.condition_before && (
                      <Badge variant="outline" className="capitalize text-xs">
                        Before: {bi.condition_before}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {CONDITION_OPTIONS.map(cond => (
                      <button
                        key={cond}
                        onClick={() => setItemConditions(prev => ({ ...prev, [bi.id]: cond }))}
                        className={`px-3 py-1.5 rounded-lg border-2 text-xs font-semibold capitalize transition-all ${
                          itemConditions[bi.id] === cond
                            ? CONDITION_COLORS[cond]
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400'
                        }`}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                  {(itemConditions[bi.id] === 'damaged' || itemConditions[bi.id] === 'missing') && (
                    <div className="animate-in slide-in-from-top-1 duration-200">
                      <Input
                        value={damageNotes[bi.id] ?? ''}
                        onChange={e => setDamageNotes(prev => ({ ...prev, [bi.id]: e.target.value }))}
                        placeholder="Describe the damage or missing part..."
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {hasDamaged && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Damage detected. You can deduct from deposit in the next step.</span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Deposit Decision */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-semibold">Deposit Decision</h3>
              <p className="text-sm text-zinc-500 mt-1">
                Security deposit held: <span className="font-bold text-zinc-900 dark:text-zinc-100">₹{depositHeld.toLocaleString('en-IN')}</span>
              </p>
            </div>

            {depositHeld === 0 ? (
              <div className="p-4 border border-zinc-200 rounded-xl text-sm text-zinc-500">
                No deposit was collected for this booking.
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { value: 'full', label: 'Full Refund', desc: `Refund ₹${depositHeld.toLocaleString('en-IN')} to customer` },
                  { value: 'partial', label: 'Partial Refund', desc: 'Deduct penalty for damage/late return' },
                  { value: 'forfeit', label: 'Forfeit Deposit', desc: 'Customer forfeits full deposit' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDepositDecision(opt.value as typeof depositDecision)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                      depositDecision === opt.value
                        ? 'border-[#ccff00] bg-[#ccff00]/5'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        depositDecision === opt.value ? 'border-[#88aa00]' : 'border-zinc-300'
                      }`}>
                        {depositDecision === opt.value && <div className="w-2 h-2 rounded-full bg-[#88aa00]" />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{opt.label}</p>
                        <p className="text-xs text-zinc-500">{opt.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}

                {depositDecision === 'partial' && (
                  <div className="space-y-3 pl-4 border-l-2 border-zinc-200 animate-in slide-in-from-top-1 duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Penalty Amount (₹)</Label>
                        <Input
                          type="number"
                          value={penaltyAmount}
                          onChange={e => setPenaltyAmount(e.target.value)}
                          max={depositHeld}
                          className="h-11 font-mono"
                        />
                      </div>
                      <div className="flex flex-col justify-end pb-1">
                        <p className="text-xs text-zinc-500">Refund after deduction</p>
                        <p className="text-lg font-bold font-mono text-emerald-600">₹{Math.max(0, depositHeld - (Number(penaltyAmount) || 0)).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Reason *</Label>
                      <Input
                        value={penaltyReason}
                        onChange={e => setPenaltyReason(e.target.value)}
                        placeholder="e.g. Stain on lehenga, missing dupatta"
                        className="h-11"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Deposit held</span>
                    <span className="font-mono">₹{depositHeld.toLocaleString('en-IN')}</span>
                  </div>
                  {depositDecision === 'partial' && penalty > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Penalty</span>
                      <span className="font-mono">− ₹{penalty.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className={`flex justify-between font-bold pt-2 border-t border-zinc-200 dark:border-zinc-700 mt-2 ${depositRefund > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    <span>Refund to customer</span>
                    <span className="font-mono">₹{depositRefund.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Accessories Return */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-semibold">Accessories Returned</h3>
              <p className="text-sm text-zinc-500 mt-1">Mark which accessories were returned.</p>
            </div>

            {givenAccessories.length === 0 ? (
              <div className="p-6 text-center text-zinc-400 border border-dashed rounded-xl">
                <p className="text-sm">No accessories were given at pickup</p>
              </div>
            ) : (
              <div className="space-y-3">
                {givenAccessories.map(acc => {
                  const returned = accessoriesReturned[acc.id] !== false
                  return (
                    <button
                      key={acc.id}
                      onClick={() => setAccessoriesReturned(prev => ({ ...prev, [acc.id]: !returned }))}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 capitalize transition-colors ${
                        returned
                          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-red-300 bg-red-50 dark:bg-red-900/20'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                        returned ? 'border-emerald-500 bg-emerald-500' : 'border-red-300'
                      }`}>
                        {returned && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-medium">{acc.accessory_type}</span>
                      <span className={`ml-auto text-xs font-semibold ${returned ? 'text-emerald-600' : 'text-red-600'}`}>
                        {returned ? 'Returned' : 'Missing'}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {Object.values(accessoriesReturned).some(v => v === false) && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl text-sm text-amber-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Some accessories not returned. Consider deducting from deposit.</span>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Washing Queue */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-semibold">Add to Washing Queue</h3>
              <p className="text-sm text-zinc-500 mt-1">Items will be queued for cleaning before next rental.</p>
            </div>

            <div
              className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                addToWashing ? 'border-[#ccff00] bg-[#ccff00]/5' : 'border-zinc-200 dark:border-zinc-700'
              }`}
              onClick={() => setAddToWashing(!addToWashing)}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${addToWashing ? 'border-[#88aa00] bg-[#ccff00]' : 'border-zinc-300'}`}>
                {addToWashing && <Check className="w-3 h-3 text-black" />}
              </div>
              <div>
                <p className="font-semibold text-sm">Add {bookingItems.length} item{bookingItems.length > 1 ? 's' : ''} to washing queue</p>
                <p className="text-xs text-zinc-500">Recommended after every return</p>
              </div>
            </div>

            {addToWashing && (
              <div className="space-y-3 animate-in slide-in-from-top-1 duration-200">
                <Label>Washing Priority</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {WASHING_PRIORITIES.map(p => (
                    <button
                      key={p}
                      onClick={() => setWashingPriority(p)}
                      className={`py-2 px-3 rounded-lg border-2 text-sm font-medium capitalize transition-colors ${
                        washingPriority === p
                          ? p === 'urgent' ? 'border-red-400 bg-red-50 text-red-700'
                          : p === 'high' ? 'border-amber-400 bg-amber-50 text-amber-700'
                          : 'border-[#ccff00] bg-[#ccff00]/10 text-zinc-800'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-500'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {hasDamaged && washingPriority !== 'urgent' && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Items have damage — consider setting priority to Urgent.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Confirm Return */}
        {step === 5 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-semibold">Confirm Return</h3>
              <p className="text-sm text-zinc-500 mt-1">Review and finalize the return.</p>
            </div>

            <div className="space-y-3">
              {[
                {
                  label: 'Items condition',
                  value: Object.values(itemConditions).some(c => c === 'damaged' || c === 'missing')
                    ? `⚠ Damage / missing detected`
                    : 'All items checked ✓',
                  ok: allConditioned,
                },
                {
                  label: 'Deposit',
                  value: depositHeld === 0
                    ? 'No deposit held'
                    : `${depositDecision === 'full' ? 'Full refund' : depositDecision === 'partial' ? `Partial — ₹${depositRefund.toLocaleString('en-IN')} back` : 'Forfeited'} (₹${depositHeld.toLocaleString('en-IN')})`,
                  ok: true,
                },
                {
                  label: 'Accessories',
                  value: givenAccessories.length === 0
                    ? 'None tracked'
                    : `${givenAccessories.filter(a => accessoriesReturned[a.id] !== false).length}/${givenAccessories.length} returned`,
                  ok: true,
                },
                {
                  label: 'Washing queue',
                  value: addToWashing ? `${bookingItems.length} item${bookingItems.length > 1 ? 's' : ''} → ${washingPriority} priority` : 'Skipped',
                  ok: true,
                },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{row.label}</span>
                  <span className={`text-sm font-semibold ${row.ok ? 'text-emerald-600' : 'text-amber-600'}`}>{row.value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowReceipt(true)}>
                <Printer className="w-4 h-4" /> Return Receipt
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </Button>
            </div>

            {confirmReturn.isError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl text-sm text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {(confirmReturn.error as Error)?.message ?? 'Failed to confirm return'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <Button
          variant="outline"
          onClick={() => step > 1 ? setStep(s => s - 1) : router.push(`/bookings/${id}`)}
          className="h-11 px-6 font-semibold"
        >
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>
        {step < 5 ? (
          <Button
            onClick={() => canAdvance() && setStep(s => s + 1)}
            disabled={!canAdvance()}
            className="h-11 px-8 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold disabled:opacity-40"
          >
            Continue <ChevronRight className="w-4 h-4 ml-1.5" />
          </Button>
        ) : (
          <Button
            onClick={() => confirmReturn.mutate()}
            disabled={confirmReturn.isPending}
            className="h-11 px-8 bg-blue-600 text-white hover:bg-blue-700 font-bold"
          >
            {confirmReturn.isPending ? 'Processing...' : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" /> Confirm Return
              </>
            )}
          </Button>
        )}
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-sm p-0 bg-transparent border-0 shadow-none">
          <ReceiptPreview booking={booking} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ReturnSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="flex-1 h-1.5 rounded-full" />)}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  )
}
