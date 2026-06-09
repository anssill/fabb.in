'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Package, IndianRupee, CheckCircle2, ChevronLeft,
  Loader2, ArrowRight, AlertTriangle, RefreshCcw,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { safeJsonParse, isValidUuid } from '@/lib/api-utils'

const CONDITIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'missing', label: 'Missing' },
]

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
]

type BookingItem = { id: string; item_name: string; size: string; quantity: number }

type Booking = {
  id: string
  booking_number: string
  status: string
  deposit_amount: number
  business_id: string
  branch_id: string
  customer: { id: string; name: string; phone: string } | null
  booking_items: BookingItem[]
}

export default function ReturnPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  // Step 1 — item conditions
  const [conditions, setConditions] = useState<Record<string, string>>({})
  const [conditionNotes, setConditionNotes] = useState<Record<string, string>>({})
  const [allAccountedFor, setAllAccountedFor] = useState(false)

  // Step 2 — deposit settlement
  const [deductionAmount, setDeductionAmount] = useState('0')
  const [deductionReason, setDeductionReason] = useState('')
  const [refundMethod, setRefundMethod] = useState('cash')
  const [refundRef, setRefundRef] = useState('')
  const [noDeposit, setNoDeposit] = useState(false)
  const [lateFee, setLateFee] = useState('0')
  const [signatureName, setSignatureName] = useState('')

  const { data: bookingData, isLoading } = useQuery({
    queryKey: ['booking-return', id],
    enabled: isValidUuid(id),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, booking_number, status, deposit_amount,
          business_id, branch_id,
          customer:customers(id, name, phone),
          booking_items(id, item_name, size, quantity)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (data) {
        const bk = data as any
        const customer = Array.isArray(bk.customer) ? bk.customer[0] : bk.customer
        return { ...bk, customer } as Booking
      }
      return null
    },
  })

  const booking = bookingData || null

  useEffect(() => {
    if (!bookingData) return
    const defaultConditions: Record<string, string> = {}
    const defaultNotes: Record<string, string> = {}
    for (const item of bookingData.booking_items || []) {
      defaultConditions[item.id] = 'good'
      defaultNotes[item.id] = ''
    }
    setConditions(defaultConditions)
    setConditionNotes(defaultNotes)
    if (!Number(bookingData.deposit_amount)) setNoDeposit(true)
  }, [bookingData])

  const depositHeld = booking ? Number(booking.deposit_amount ?? 0) : 0
  const deduction = parseFloat(deductionAmount || '0') || 0
  const refundAmount = Math.max(0, depositHeld - deduction)

  const hasDamagedOrMissing = Object.values(conditions).some(
    (c) => c === 'damaged' || c === 'missing'
  )

  const handleConfirmReturn = async () => {
    if (!booking) return
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const staffId = user?.id

      // 1. Update booking status to 'returned' (includes condition updates and washing queue insertion)
      const res = await fetch(`/api/bookings/${booking.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'returned',
          itemConditions: conditions,
          itemNotes: conditionNotes
        }),
      })
      if (!res.ok) {
        const d = await safeJsonParse(res)
        throw new Error(d.error || 'Failed to update booking status')
      }

      // 3. Insert late fee and deposit refund payment
      const lateFeeAmount = parseFloat(lateFee || '0') || 0
      if (lateFeeAmount > 0) {
        await supabase.from('booking_payments').insert({
          booking_id: booking.id,
          business_id: booking.business_id,
          branch_id: booking.branch_id,
          type: 'penalty',
          amount: lateFeeAmount,
          method: refundMethod,
          reference_number: refundRef.trim() || null,
          notes: 'Late fee collected during return',
          collected_by: staffId,
        })
      }

      if (!noDeposit && depositHeld > 0 && refundAmount > 0) {
        await supabase.from('booking_payments').insert({
          booking_id: booking.id,
          business_id: booking.business_id,
          branch_id: booking.branch_id,
          type: 'deposit_refund',
          amount: refundAmount,
          method: refundMethod,
          reference_number: refundRef.trim() || null,
          notes: deduction > 0
            ? `Deposit refund after ₹${deduction} deduction. Reason: ${deductionReason}`
            : 'Full deposit refund on return',
          collected_by: staffId,
        })
      }

      // 4. Insert timeline event
      await supabase.from('booking_timeline').insert({
        booking_id: booking.id,
        business_id: booking.business_id,
        event_type: 'RETURN_COMPLETED',
        event_description: 'Return processed — items collected from customer',
        performed_by: staffId,
      }).then(() => {})

      await fetch(`/api/bookings/${booking.id}/operations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature: {
            type: 'return',
            signer_name: signatureName.trim() || booking.customer?.name || 'Customer',
            signature_data: signatureName.trim() || booking.customer?.name || 'Customer',
            agreement_text: 'Customer acknowledged return condition, damage/missing charges, late fees, and deposit settlement.',
          },
          status: 'in_washing',
        }),
      }).catch(() => {})

      toast.success('Return completed! Booking marked as returned.')
      router.push(`/bookings/${booking.id}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to process return')
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Booking not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/bookings">Back to Bookings</Link>
        </Button>
      </div>
    )
  }

  if (booking.status !== 'out') {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/bookings/${id}`}><ChevronLeft className="w-4 h-4 mr-1" />Back to Booking</Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-400" />
            <p className="text-lg font-medium text-slate-900">Return not available</p>
            <p className="text-sm text-slate-500 mt-1">
              This booking is currently <span className="font-semibold capitalize">{booking.status}</span>. Only <span className="font-semibold">Out</span> bookings can be returned.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/bookings/${id}`}><ChevronLeft className="w-4 h-4 mr-1" />Back</Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Process Return</h1>
          <p className="text-sm text-slate-500 font-mono">{booking.booking_number}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 bg-white border border-slate-200 rounded-lg p-4">
        {[{ label: 'Conditions' }, { label: 'Deposit' }, { label: 'Confirm' }].map(({ label }, idx) => {
          const stepNum = idx + 1
          const isDone = step > stepNum
          const isCurrent = step === stepNum
          return (
            <div key={stepNum} className="flex items-center flex-1">
              <div className={`flex items-center gap-1.5 ${isCurrent || isDone ? 'text-green-600' : 'text-slate-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${isDone ? 'bg-green-600 text-white' :
                    isCurrent ? 'bg-green-100 text-green-700 ring-2 ring-green-300' :
                    'bg-slate-100 text-slate-400'}`}>
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
                </div>
                <span className="text-xs font-medium hidden sm:block">{label}</span>
              </div>
              {idx < 2 && (
                <div className={`flex-1 h-0.5 mx-2 ${isDone ? 'bg-green-400' : 'bg-slate-200'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step 1 — Item Conditions */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              Step 1 — Item Condition Check
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {booking.booking_items.map((item) => (
              <div key={item.id} className="space-y-3 p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.item_name}</p>
                    <p className="text-xs text-slate-500">Size {item.size} · Qty {item.quantity}</p>
                  </div>
                  {(conditions[item.id] === 'damaged' || conditions[item.id] === 'missing') && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                      {conditions[item.id] === 'damaged' ? 'Damaged' : 'Missing'}
                    </span>
                  )}
                </div>

                <RadioGroup
                  value={conditions[item.id] || 'good'}
                  onValueChange={(v) => setConditions((prev) => ({ ...prev, [item.id]: v }))}
                  className="flex flex-wrap gap-2"
                >
                  {CONDITIONS.map((c) => (
                    <div key={c.value} className="flex items-center gap-1.5">
                      <RadioGroupItem
                        value={c.value}
                        id={`${item.id}-${c.value}`}
                        className="sr-only"
                      />
                      <Label
                        htmlFor={`${item.id}-${c.value}`}
                        className={`px-3 py-1.5 text-xs rounded-full border cursor-pointer transition-colors
                          ${conditions[item.id] === c.value
                            ? c.value === 'damaged' || c.value === 'missing'
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                          }`}
                      >
                        {c.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {(conditions[item.id] === 'damaged' || conditions[item.id] === 'missing' || conditions[item.id] === 'poor') && (
                  <Textarea
                    value={conditionNotes[item.id] || ''}
                    onChange={(e) => setConditionNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    placeholder={`Describe the ${conditions[item.id] === 'missing' ? 'missing item situation' : 'damage'}...`}
                    rows={2}
                    className="text-sm"
                  />
                )}
              </div>
            ))}

            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <input
                type="checkbox"
                id="accounted"
                checked={allAccountedFor}
                onChange={(e) => setAllAccountedFor(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded"
              />
              <label htmlFor="accounted" className="text-sm cursor-pointer leading-relaxed text-green-800">
                All items have been physically checked and accounted for.
                {hasDamagedOrMissing && (
                  <span className="block text-red-600 font-medium mt-1">
                    Note: {Object.values(conditions).filter((c) => c === 'damaged' || c === 'missing').length} item(s) marked as damaged/missing.
                  </span>
                )}
              </label>
            </div>

            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={!allAccountedFor}
              onClick={() => setStep(2)}
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2 — Deposit Settlement */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-green-600" />
              Step 2 — Deposit Settlement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {noDeposit || depositHeld <= 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-center">
                <p className="text-base font-semibold text-slate-700">No deposit to settle</p>
                <p className="text-sm text-slate-500 mt-1">This booking had no deposit collected.</p>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-800">Deposit Held</span>
                  <span className="text-xl font-bold text-blue-900">₹{depositHeld.toLocaleString('en-IN')}</span>
                </div>

                <div className="space-y-1.5">
                  <Label>Deduction Amount (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    max={String(depositHeld)}
                    value={deductionAmount}
                    onChange={(e) => setDeductionAmount(e.target.value)}
                    placeholder="0"
                  />
                  <p className="text-xs text-slate-500">Enter 0 to return full deposit</p>
                </div>

                <div className="space-y-1.5">
                  <Label>Late fee (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={lateFee}
                    onChange={(e) => setLateFee(e.target.value)}
                    placeholder="0"
                  />
                  <p className="text-xs text-slate-500">Optional overdue fee collected at return.</p>
                </div>

                {deduction > 0 && (
                  <div className="space-y-1.5">
                    <Label>Reason for Deduction <span className="text-red-500">*</span></Label>
                    <Textarea
                      value={deductionReason}
                      onChange={(e) => setDeductionReason(e.target.value)}
                      placeholder="e.g. Damage to kurtha set — torn sleeve..."
                      rows={2}
                    />
                  </div>
                )}

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Deposit held</span>
                    <span>₹{depositHeld.toLocaleString('en-IN')}</span>
                  </div>
                  {deduction > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Deduction</span>
                      <span>-₹{deduction.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-green-800 pt-1 border-t border-green-200">
                    <span>Refund to customer</span>
                    <span>₹{refundAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {refundAmount > 0 && (
                  <>
                    <div className="space-y-1.5">
                      <Label>Refund Method</Label>
                      <Select value={refundMethod} onValueChange={setRefundMethod}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {(refundMethod === 'upi' || refundMethod === 'bank_transfer') && (
                      <div className="space-y-1.5">
                        <Label>Reference / UTR (optional)</Label>
                        <Input value={refundRef} onChange={(e) => setRefundRef(e.target.value)} placeholder="Transaction reference" />
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={deduction > 0 && !deductionReason.trim()}
                onClick={() => setStep(3)}
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3 — Confirm Return */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCcw className="w-5 h-5 text-green-600" />
              Step 3 — Confirm Return
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {/* Items summary */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Items Returned ✅ ({booking.booking_items.length})
                </p>
                {booking.booking_items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.item_name} <span className="text-slate-400">({item.size})</span></span>
                    <span className={`capitalize font-medium text-xs px-2 py-0.5 rounded-full
                      ${conditions[item.id] === 'damaged' || conditions[item.id] === 'missing'
                        ? 'bg-red-100 text-red-700'
                        : conditions[item.id] === 'excellent' ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                      }`}>
                      {conditions[item.id] || 'good'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Deposit summary */}
              {!noDeposit && depositHeld > 0 && (
                <div className="bg-green-50 rounded-lg p-4 space-y-1 text-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Deposit Settlement</p>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Held</span>
                    <span>₹{depositHeld.toLocaleString('en-IN')}</span>
                  </div>
                  {deduction > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Deduction</span>
                      <span>-₹{deduction.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-green-800 pt-1 border-t border-green-200">
                    <span>Refunded via {refundMethod}</span>
                    <span>₹{refundAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Return Signature</p>
                <Input value={signatureName} onChange={(e) => setSignatureName(e.target.value)} placeholder={booking.customer?.name || 'Customer name'} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)} disabled={submitting}>Back</Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
                onClick={handleConfirmReturn}
                disabled={submitting || !signatureName.trim()}
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 mr-2" />Confirm Return</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
