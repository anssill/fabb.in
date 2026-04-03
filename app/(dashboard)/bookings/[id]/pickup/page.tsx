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
  ArrowLeft, ChevronRight, Upload, Camera, CheckCircle2,
  AlertCircle, Printer, MessageCircle, Package, Check,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

const PICKUP_STEPS = [
  { id: 1, title: 'Aadhaar' },
  { id: 2, title: 'Condition' },
  { id: 3, title: 'Payment' },
  { id: 4, title: 'Accessories' },
  { id: 5, title: 'Confirm' },
]

const CONDITION_OPTIONS = ['excellent', 'good', 'fair', 'damaged'] as const
type Condition = typeof CONDITION_OPTIONS[number]

const CONDITION_COLORS: Record<Condition, string> = {
  excellent: 'border-emerald-400 bg-emerald-50 text-emerald-700',
  good:      'border-blue-400 bg-blue-50 text-blue-700',
  fair:      'border-amber-400 bg-amber-50 text-amber-700',
  damaged:   'border-red-400 bg-red-50 text-red-700',
}

const DEFAULT_ACCESSORIES = ['dupatta', 'mojri', 'jewellery', 'belt', 'stole', 'bag']

interface AccessoryState {
  type: string
  given: boolean
}

export default function PickupPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()
  const profile = useUserStore((s) => s.profile)
  const queryClient = useQueryClient()

  const [step, setStep] = useState(1)

  // Step 1 state
  const [aadhaarCollected, setAadhaarCollected] = useState(false)
  const [aadhaarFrontUrl, setAadhaarFrontUrl] = useState('')
  const [aadhaarBackUrl, setAadhaarBackUrl] = useState('')

  // Step 2 state
  const [itemConditions, setItemConditions] = useState<Record<string, Condition>>({})

  // Step 3 state
  const [balanceCollected, setBalanceCollected] = useState(false)
  const [balanceMethod, setBalanceMethod] = useState('Cash')
  const [balanceAmount, setBalanceAmount] = useState('')
  const [depositCollected, setDepositCollected] = useState(false)
  const [depositMethod, setDepositMethod] = useState('Cash')

  // Step 4 state
  const [accessories, setAccessories] = useState<AccessoryState[]>(
    DEFAULT_ACCESSORIES.map(type => ({ type, given: false }))
  )

  // Step 5 state
  const [showReceipt, setShowReceipt] = useState(false)

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customers (*),
          booking_items (id, size, quantity, daily_rate, subtotal, item:items(id, name, sku, category)),
          booking_payments (id, type, amount, method, is_voided),
          booking_accessories (id, accessory_type, given_at_pickup)
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const confirmPickup = useMutation({
    mutationFn: async () => {
      if (!booking || !profile) throw new Error('Missing data')
      const activeBranchId = profile.branch_id

      // Update booking status → active
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'active',
          aadhaar_collected: aadhaarCollected,
          aadhaar_front_url: aadhaarFrontUrl || null,
          aadhaar_back_url: aadhaarBackUrl || null,
          cctv_timestamp: new Date().toISOString(),
        })
        .eq('id', id)
      if (bookingError) throw bookingError

      // Update item conditions on booking_items
      for (const [itemId, condition] of Object.entries(itemConditions)) {
        await supabase
          .from('booking_items')
          .update({ condition_before: condition })
          .eq('id', itemId)
      }

      // Record balance payment if collected
      if (balanceCollected && Number(balanceAmount) > 0) {
        await supabase.from('booking_payments').insert({
          business_id: booking.business_id,
          branch_id: activeBranchId,
          booking_id: id,
          type: 'balance',
          amount: Number(balanceAmount),
          method: balanceMethod,
          staff_id: profile.id,
        })
      }

      // Record deposit if collected
      if (depositCollected && (booking.deposit_amount ?? 0) > 0) {
        await supabase.from('booking_payments').insert({
          business_id: booking.business_id,
          branch_id: activeBranchId,
          booking_id: id,
          type: 'deposit',
          amount: booking.deposit_amount,
          method: depositMethod,
          staff_id: profile.id,
        })
        await supabase
          .from('bookings')
          .update({ deposit_collected: booking.deposit_amount })
          .eq('id', id)
      }

      // Insert/update accessories
      const accessoriesToGive = accessories.filter(a => a.given)
      if (accessoriesToGive.length > 0) {
        // Delete existing then insert fresh
        await supabase.from('booking_accessories').delete().eq('booking_id', id)
        await supabase.from('booking_accessories').insert(
          accessoriesToGive.map(a => ({
            business_id: booking.business_id,
            branch_id: activeBranchId,
            booking_id: id,
            accessory_type: a.type,
            given_at_pickup: true,
          }))
        )
      }

      // Timeline entry
      await supabase.from('booking_timeline').insert({
        business_id: booking.business_id,
        branch_id: activeBranchId,
        booking_id: id,
        event_type: 'picked_up',
        description: `Items picked up by ${booking.customers?.name ?? 'customer'}`,
        staff_name: profile.name,
      })

      await writeAuditLog({
        action: 'UPDATE',
        tableName: 'bookings',
        recordId: id,
        newValue: { status: 'active', event: 'pickup' },
        branchId: activeBranchId,
        businessId: profile.business_id,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      router.push(`/bookings/${id}`)
    },
  })

  if (isLoading) return <PickupSkeleton />
  if (!booking) return null

  const balanceDue = (booking.total_amount ?? 0) - (booking.advance_paid ?? 0)
  const allItemsConditioned = (booking.booking_items ?? []).every(
    (bi: { id: string }) => !!itemConditions[bi.id]
  )

  const canAdvance = () => {
    switch (step) {
      case 1: return true // Aadhaar is optional
      case 2: return allItemsConditioned
      case 3: return true // Balance payment optional
      case 4: return true // Accessories optional
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
          <h1 className="text-2xl font-bold">Pickup — {booking.booking_id_display ?? id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-sm text-zinc-500">{booking.customers?.name} · Step {step} of 5</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5">
        {PICKUP_STEPS.map((s) => (
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
        {/* Step 1: Aadhaar */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-semibold">Customer Verification</h3>
              <p className="text-sm text-zinc-500 mt-1">Collect Aadhaar ID for verification. Optional but recommended.</p>
            </div>

            <div className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors select-none
              border-zinc-200 dark:border-zinc-700 hover:border-[#ccff00]"
              onClick={() => setAadhaarCollected(!aadhaarCollected)}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                aadhaarCollected ? 'border-[#ccff00] bg-[#ccff00]' : 'border-zinc-300'
              }`}>
                {aadhaarCollected && <Check className="w-3 h-3 text-black" />}
              </div>
              <div>
                <p className="font-semibold text-sm">Aadhaar physically verified</p>
                <p className="text-xs text-zinc-500">Checked original ID in-store</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Aadhaar Front Photo URL <span className="text-zinc-400 font-normal">(optional)</span></Label>
                <div className="flex gap-2">
                  <Input
                    value={aadhaarFrontUrl}
                    onChange={e => setAadhaarFrontUrl(e.target.value)}
                    placeholder="Upload or paste URL"
                    className="h-11"
                  />
                  <Button variant="outline" size="icon" className="h-11 w-11 shrink-0">
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Aadhaar Back Photo URL <span className="text-zinc-400 font-normal">(optional)</span></Label>
                <div className="flex gap-2">
                  <Input
                    value={aadhaarBackUrl}
                    onChange={e => setAadhaarBackUrl(e.target.value)}
                    placeholder="Upload or paste URL"
                    className="h-11"
                  />
                  <Button variant="outline" size="icon" className="h-11 w-11 shrink-0">
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {!aadhaarCollected && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl text-sm text-amber-700 dark:text-amber-400">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Aadhaar not verified. Proceed only if customer is known or documented.</span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Item Condition */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-semibold">Item Condition Check</h3>
              <p className="text-sm text-zinc-500 mt-1">Record condition before handing over each item.</p>
            </div>
            <div className="space-y-4">
              {(booking.booking_items as {
                id: string
                size: string
                quantity: number
                item: { name: string; sku: string } | null
              }[] ?? []).map((bi) => (
                <div key={bi.id} className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
                  <div>
                    <p className="font-semibold">{bi.item?.name ?? 'Item'}</p>
                    <p className="text-xs text-zinc-500">SKU: {bi.item?.sku} · Size: {bi.size} · Qty: {bi.quantity}</p>
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
                  {!itemConditions[bi.id] && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Select condition to continue
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Balance Payment */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-semibold">Collect Payments</h3>
              <p className="text-sm text-zinc-500 mt-1">Collect any outstanding balance or security deposit.</p>
            </div>

            {/* Balance due */}
            <div className="space-y-4">
              <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                <div className="flex justify-between mb-3">
                  <span className="font-semibold">Rental Balance</span>
                  <span className={`font-mono font-bold ${balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {balanceDue > 0 ? `₹${balanceDue.toLocaleString('en-IN')} due` : 'Fully paid ✓'}
                  </span>
                </div>
                {balanceDue > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setBalanceCollected(!balanceCollected)}>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${balanceCollected ? 'border-[#ccff00] bg-[#ccff00]' : 'border-zinc-300'}`}>
                        {balanceCollected && <Check className="w-3 h-3 text-black" />}
                      </div>
                      <span className="text-sm font-medium">Collecting balance now</span>
                    </div>
                    {balanceCollected && (
                      <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-1 duration-200">
                        <select
                          value={balanceMethod}
                          onChange={e => setBalanceMethod(e.target.value)}
                          className="h-11 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm"
                        >
                          {['Cash', 'UPI', 'Bank Transfer', 'Store Credit'].map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <Input
                          type="number"
                          value={balanceAmount || balanceDue.toString()}
                          onChange={e => setBalanceAmount(e.target.value)}
                          className="h-11 font-mono"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Deposit */}
              {(booking.deposit_amount ?? 0) > 0 && (
                <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <div className="flex justify-between mb-3">
                    <span className="font-semibold">Security Deposit</span>
                    <span className="font-mono font-bold">₹{booking.deposit_amount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => setDepositCollected(!depositCollected)}>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${depositCollected ? 'border-[#ccff00] bg-[#ccff00]' : 'border-zinc-300'}`}>
                      {depositCollected && <Check className="w-3 h-3 text-black" />}
                    </div>
                    <span className="text-sm font-medium">Collecting deposit now</span>
                  </div>
                  {depositCollected && (
                    <div className="mt-3 animate-in slide-in-from-top-1 duration-200">
                      <select
                        value={depositMethod}
                        onChange={e => setDepositMethod(e.target.value)}
                        className="h-11 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm max-w-[200px]"
                      >
                        {['Cash', 'UPI', 'Bank Transfer'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Accessories */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-semibold">Accessories Handover</h3>
              <p className="text-sm text-zinc-500 mt-1">Mark which accessories are given with the outfit.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {accessories.map((acc, idx) => (
                <button
                  key={acc.type}
                  onClick={() => setAccessories(prev => prev.map((a, i) => i === idx ? { ...a, given: !a.given } : a))}
                  className={`p-4 rounded-xl border-2 text-left capitalize transition-all ${
                    acc.given
                      ? 'border-[#ccff00] bg-[#ccff00]/10 text-zinc-900'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${acc.given ? 'border-[#88aa00] bg-[#ccff00]' : 'border-zinc-300'}`}>
                      {acc.given && <Check className="w-2.5 h-2.5 text-black" />}
                    </div>
                    <span className="text-sm font-medium">{acc.type}</span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500">
              {accessories.filter(a => a.given).length} accessories selected
            </p>
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === 5 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-semibold">Confirm Pickup</h3>
              <p className="text-sm text-zinc-500 mt-1">Review and finalize the pickup.</p>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Aadhaar', value: aadhaarCollected ? 'Verified ✓' : 'Not verified', ok: aadhaarCollected },
                { label: 'Items condition', value: allItemsConditioned ? 'All recorded ✓' : 'Incomplete', ok: allItemsConditioned },
                { label: 'Balance', value: balanceDue <= 0 ? 'Fully paid ✓' : balanceCollected ? `₹${balanceAmount} collected` : `₹${balanceDue} outstanding`, ok: balanceDue <= 0 || balanceCollected },
                { label: 'Accessories', value: `${accessories.filter(a => a.given).length} items given`, ok: true },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{row.label}</span>
                  <span className={`text-sm font-semibold ${row.ok ? 'text-emerald-600' : 'text-amber-600'}`}>{row.value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowReceipt(true)}
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </Button>
            </div>

            {confirmPickup.isError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl text-sm text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {(confirmPickup.error as Error)?.message ?? 'Failed to confirm pickup'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <Button variant="outline" onClick={() => step > 1 ? setStep(s => s - 1) : router.push(`/bookings/${id}`)} className="h-11 px-6 font-semibold">
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
            onClick={() => confirmPickup.mutate()}
            disabled={confirmPickup.isPending}
            className="h-11 px-8 bg-[#ccff00] text-black hover:bg-[#bce600] font-bold"
          >
            {confirmPickup.isPending ? 'Confirming...' : (
              <>
                <Package className="w-4 h-4 mr-2" /> Confirm Pickup
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

function PickupSkeleton() {
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
