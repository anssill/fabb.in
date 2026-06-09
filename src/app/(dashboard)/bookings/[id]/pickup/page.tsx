'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  User, Package, IndianRupee, CheckCircle2, ChevronLeft,
  Loader2, ArrowRight, ShieldCheck, AlertTriangle, Camera, Edit2, X
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { safeJsonParse, isValidUuid } from '@/lib/api-utils'
import { MediaUpload } from '@/components/shared/MediaUpload'

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
]

const DEPOSIT_SUGGESTIONS = [500, 1000, 2000, 3000, 5000, 10000]

type BookingItem = { id: string; item_name: string; size: string; quantity: number; price: number }

type Booking = {
  id: string
  booking_number: string
  status: string
  total_amount: number
  advance_amount: number
  balance_due: number
  deposit_amount: number
  pickup_date: string
  return_date: string
  business_id: string
  branch_id: string
  customer: { id: string; name: string; phone: string } | null
  booking_items: BookingItem[]
  booking_payments: Array<{ type: string; amount: number; is_voided: boolean }>
  rental_balance: number
  deposit_balance: number
}

export default function PickupPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  // Step 1
  const [customerVerified, setCustomerVerified] = useState(false)

  // Step 2 — balance payment
  const [balanceMethod, setBalanceMethod] = useState('cash')
  const [balanceAmount, setBalanceAmount] = useState('')
  const [balanceRef, setBalanceRef] = useState('')
  const [balanceNotes, setBalanceNotes] = useState('')
  const [skipBalance, setSkipBalance] = useState(false)

  // Step 3 — deposit
  const [depositMethod, setDepositMethod] = useState('cash')
  const [depositAmount, setDepositAmount] = useState('')
  const [depositRef, setDepositRef] = useState('')
  const [depositNotes, setDepositNotes] = useState('')
  const [skipDeposit, setSkipDeposit] = useState(false)
  const [depositAlreadyCollected, setDepositAlreadyCollected] = useState(false)

  const { data: bookingData, isLoading } = useQuery({
    queryKey: ['booking-pickup', id],
    enabled: isValidUuid(id),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, booking_number, status, total_amount, advance_amount,
          balance_due, deposit_amount, pickup_date, return_date,
          business_id, branch_id,
          customer:customers(id, name, phone),
          booking_items(id, item_name, size, quantity, price),
          booking_payments(type, amount, is_voided)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (data) {
        const bk = data as any
        const customer = Array.isArray(bk.customer) ? bk.customer[0] : bk.customer
        const payments = (bk.booking_payments || []).filter((p: any) => !p.is_voided)
        
        // Calculate rental payments only (advance, balance, penalty - refund)
        const rentalPaid = payments
          .filter((p: any) => !['deposit', 'deposit_refund'].includes(p.type))
          .reduce((s: number, p: any) => s + (p.type === 'refund' ? -Number(p.amount) : Number(p.amount)), 0)
        
        // Calculate deposit payments only (deposit - deposit_refund)
        const depositPaid = payments
          .filter((p: any) => ['deposit', 'deposit_refund'].includes(p.type))
          .reduce((s: number, p: any) => s + (p.type === 'deposit_refund' ? -Number(p.amount) : Number(p.amount)), 0)

        const rentalBalance = Math.max(0, Number(bk.total_amount) - rentalPaid)
        const depositBalance = Math.max(0, Number(bk.deposit_amount ?? 0) - depositPaid)

        return {
          ...bk, 
          customer, 
          rental_balance: rentalBalance, 
          deposit_balance: depositBalance 
        } as Booking
      }
      return null
    },
  })

  const [bookingOverride, setBookingOverride] = useState<Booking | null>(null)
  const booking = bookingOverride || bookingData || null

  useEffect(() => {
    if (!bookingData) return
    setBookingOverride(null)
    setBalanceAmount(String(bookingData.rental_balance))
    setDepositAmount(String(bookingData.deposit_balance))
    const collected = bookingData.deposit_balance <= 0
    setDepositAlreadyCollected(collected)
    if (collected) setSkipDeposit(true)
  }, [bookingData])

  const balanceDue = booking ? booking.rental_balance : 0
  const depositNeeded = booking ? booking.deposit_balance : 0
  const totalSteps = 5

  const [pickupPhotos, setPickupPhotos] = useState<string[]>([])
  const [isEditingDeposit, setIsEditingDeposit] = useState(false)
  const [newDepositTotal, setNewDepositTotal] = useState('')
  const [depositTotalEdited, setDepositTotalEdited] = useState(false)
  const [itemScanned, setItemScanned] = useState(false)
  const [signatureName, setSignatureName] = useState('')

  const handleConfirmPickup = async () => {
    if (!booking) return
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const staffId = user?.id

      // 0. Update deposit amount if edited
      if (depositTotalEdited && newDepositTotal) {
        const { error: updError } = await supabase
          .from('bookings')
          .update({ 
            deposit_amount: parseFloat(newDepositTotal),
            pickup_photos: pickupPhotos 
          })
          .eq('id', booking.id)
        
        if (updError) throw updError
      } else {
        // Just update photos if not editing deposit
        await supabase
          .from('bookings')
          .update({ pickup_photos: pickupPhotos })
          .eq('id', booking.id)
      }

      // 1. Record balance payment if applicable
      if (balanceDue > 0 && !skipBalance) {
        const amt = parseFloat(balanceAmount)
        if (amt > 0) {
          await supabase.from('booking_payments').insert({
            booking_id: booking.id,
            business_id: booking.business_id,
            branch_id: booking.branch_id,
            type: 'balance',
            amount: amt,
            method: balanceMethod,
            reference_number: balanceRef.trim() || null,
            notes: balanceNotes.trim() || null,
            collected_by: staffId,
          })
        }
      }

      // 2. Record deposit payment if applicable
      if (depositNeeded > 0 && !skipDeposit && !depositAlreadyCollected) {
        const amt = parseFloat(depositAmount)
        if (amt > 0) {
          await supabase.from('booking_payments').insert({
            booking_id: booking.id,
            business_id: booking.business_id,
            branch_id: booking.branch_id,
            type: 'deposit',
            amount: amt,
            method: depositMethod,
            reference_number: depositRef.trim() || null,
            notes: depositNotes.trim() || null,
            collected_by: staffId,
          })
        }
      }

      // 3. Update booking status to 'out'
      const res = await fetch(`/api/bookings/${booking.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'out' }),
      })
      if (!res.ok) {
        const d = await safeJsonParse(res)
        throw new Error(d.error || 'Failed to update booking status')
      }

      // 4. Insert timeline event
      await supabase.from('booking_timeline').insert({
        booking_id: booking.id,
        business_id: booking.business_id,
        event_type: 'PICKUP_COMPLETED',
        event_description: 'Pickup completed — items handed to customer',
        performed_by: staffId,
      }).then(() => {})  // non-critical

      await fetch(`/api/bookings/${booking.id}/operations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature: {
            type: 'pickup',
            signer_name: signatureName.trim() || booking.customer?.name || 'Customer',
            signature_data: signatureName.trim() || booking.customer?.name || 'Customer',
            agreement_text: 'Customer accepted pickup, item condition, return date, late fees, damage/missing charges, and deposit rules.',
          },
        }),
      }).catch(() => {})

      toast.success('Pickup confirmed! Booking is now active.')
      router.push(`/bookings/${booking.id}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm pickup')
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

  if (booking.status !== 'booked' && booking.status !== 'ready_for_pickup') {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/bookings/${id}`}><ChevronLeft className="w-4 h-4 mr-1" />Back to Booking</Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-400" />
            <p className="text-lg font-medium text-slate-900">Pickup not available</p>
            <p className="text-sm text-slate-500 mt-1">
              This booking is currently <span className="font-semibold capitalize">{booking.status}</span>. Only <span className="font-semibold">Booked/Ready</span> bookings can be picked up.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const customer = booking.customer

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/bookings/${id}`}><ChevronLeft className="w-4 h-4 mr-1" />Back</Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Process Pickup</h1>
          <p className="text-sm text-slate-500 font-mono">{booking.booking_number}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 bg-white border border-slate-200 rounded-lg p-4">
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const stepNum = idx + 1
          const isDone = step > stepNum
          const isCurrent = step === stepNum
          const labels = ['Verify', 'Balance', 'Deposit', 'Documentation', 'Confirm']
          return (
            <div key={stepNum} className="flex items-center flex-1">
              <div className={`flex items-center gap-1.5 ${isCurrent || isDone ? 'text-blue-600' : 'text-slate-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${isDone ? 'bg-blue-600 text-white' :
                    isCurrent ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300' :
                    'bg-slate-100 text-slate-400'}`}>
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
                </div>
                <span className="text-xs font-medium hidden sm:block">{labels[idx]}</span>
              </div>
              {idx < totalSteps - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${isDone ? 'bg-blue-400' : 'bg-slate-200'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step 1 — Verify Customer */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Step 1 — Verify Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-slate-50 rounded-lg p-5 text-center">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <User className="w-7 h-7 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{customer?.name || '—'}</p>
              <p className="text-lg text-slate-600 mt-1">{customer?.phone || ''}</p>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-slate-600">Items in this booking:</p>
              {booking.booking_items.map((bi) => (
                <div key={bi.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium">{bi.item_name}</span>
                  </div>
                  <span className="text-xs text-slate-500">Size {bi.size} × {bi.quantity}</span>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <Checkbox
                id="customer-verify"
                checked={customerVerified}
                onCheckedChange={(v) => setCustomerVerified(Boolean(v))}
                className="mt-0.5"
              />
              <Label htmlFor="customer-verify" className="text-sm cursor-pointer leading-relaxed">
                I have verified the customer is present and has confirmed their identity. The items listed above are correct.
              </Label>
            </div>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={!customerVerified}
              onClick={() => setStep(2)}
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2 — Balance Payment */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-blue-600" />
              Step 2 — Collect Balance Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {balanceDue <= 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-2" />
                <p className="text-base font-semibold text-green-800">No balance due</p>
                <p className="text-sm text-green-600 mt-1">Rental amount has been fully paid.</p>
              </div>
            ) : (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex justify-between items-center">
                  <span className="text-sm font-medium text-amber-800">Balance Due</span>
                  <span className="text-xl font-bold text-amber-900">₹{balanceDue.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <Checkbox
                    id="skip-balance"
                    checked={skipBalance}
                    onCheckedChange={(v) => setSkipBalance(Boolean(v))}
                  />
                  <Label htmlFor="skip-balance" className="text-sm cursor-pointer">
                    Skip balance collection (collect later)
                  </Label>
                </div>

                {!skipBalance && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Amount (₹)</Label>
                      <div className="flex flex-wrap gap-2 pb-1">
                        {DEPOSIT_SUGGESTIONS.map(amount => (
                          <Button
                            key={amount}
                            type="button"
                            size="sm"
                            variant={Number(depositAmount) === amount ? 'default' : 'outline'}
                            className="h-8"
                            onClick={() => setDepositAmount(String(amount))}
                          >
                            Rs {amount.toLocaleString('en-IN')}
                          </Button>
                        ))}
                      </div>
                      <Input
                        type="number"
                        value={balanceAmount}
                        onChange={(e) => setBalanceAmount(e.target.value)}
                        placeholder={String(balanceDue)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Payment Method</Label>
                      <Select value={balanceMethod} onValueChange={setBalanceMethod}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {(balanceMethod === 'upi' || balanceMethod === 'bank_transfer') && (
                      <div className="space-y-1.5">
                        <Label>Reference / UTR (optional)</Label>
                        <Input value={balanceRef} onChange={(e) => setBalanceRef(e.target.value)} placeholder="Transaction reference" />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label>Notes (optional)</Label>
                      <Textarea value={balanceNotes} onChange={(e) => setBalanceNotes(e.target.value)} rows={2} placeholder="Any notes..." />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => setStep(3)}>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3 — Deposit */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Step 3 — Collect Deposit
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-blue-600 h-8"
                onClick={() => setIsEditingDeposit(!isEditingDeposit)}
              >
                {isEditingDeposit ? 'Cancel' : <><Edit2 className="w-3 h-3 mr-1" /> Edit Amount</>}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditingDeposit ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <Label className="text-blue-800">New Deposit Amount (₹)</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    value={newDepositTotal} 
                    onChange={(e) => setNewDepositTotal(e.target.value)}
                    placeholder="Enter total deposit needed"
                  />
                  <Button onClick={() => {
                    const val = parseFloat(newDepositTotal)
                    if (!isNaN(val)) {
                      setBookingOverride((b) => (b || booking) ? { ...(b || booking)!, deposit_amount: val, deposit_balance: val } : b)
                      setDepositAmount(String(val))
                      setDepositTotalEdited(true)
                      setDepositAlreadyCollected(false)
                      setSkipDeposit(false)
                      setIsEditingDeposit(false)
                      toast.success('Deposit amount updated for this session.')
                    }
                  }}>Apply</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {DEPOSIT_SUGGESTIONS.map(amount => (
                    <Button
                      key={amount}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => setNewDepositTotal(String(amount))}
                    >
                      Rs {amount.toLocaleString('en-IN')}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-blue-600">This will update the booking record on confirmation.</p>
              </div>
            ) : (
              depositNeeded <= 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-center">
                  <p className="text-base font-semibold text-slate-700">No deposit required</p>
                  <p className="text-sm text-slate-500 mt-1">This booking has no deposit amount set.</p>
                </div>
              ) : depositAlreadyCollected ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-2" />
                  <p className="text-base font-semibold text-green-800">Deposit already collected</p>
                  <p className="text-sm text-green-600 mt-1">₹{depositNeeded.toLocaleString('en-IN')} was collected at booking time.</p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-800">Deposit Amount</span>
                  <span className="text-xl font-bold text-blue-900">₹{depositNeeded.toLocaleString('en-IN')}</span>
                </div>
              )
            )}

            {!depositAlreadyCollected && depositNeeded > 0 && !isEditingDeposit && (
              <>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <Checkbox
                    id="skip-deposit"
                    checked={skipDeposit}
                    onCheckedChange={(v) => setSkipDeposit(Boolean(v))}
                  />
                  <Label htmlFor="skip-deposit" className="text-sm cursor-pointer">
                    Skip deposit collection (collect later)
                  </Label>
                </div>

                {!skipDeposit && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Amount (₹)</Label>
                      <Input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder={String(depositNeeded)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Payment Method</Label>
                      <Select value={depositMethod} onValueChange={setDepositMethod}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {(depositMethod === 'upi' || depositMethod === 'bank_transfer') && (
                      <div className="space-y-1.5">
                        <Label>Reference / UTR (optional)</Label>
                        <Input value={depositRef} onChange={(e) => setDepositRef(e.target.value)} placeholder="Transaction reference" />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label>Notes (optional)</Label>
                      <Textarea value={depositNotes} onChange={(e) => setDepositNotes(e.target.value)} rows={2} placeholder="Any notes..." />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => setStep(4)}>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4 — Documentation */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              Step 4 — Documentation (Photos)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500">Take photos of the customer with the items or any specific condition notes.</p>
            
            <MediaUpload
              bucket="images"
              path={`${booking.business_id}/bookings/${id}/pickup`}
              value={pickupPhotos}
              onUploadComplete={(url) => setPickupPhotos(prev => [...prev, url])}
              onRemove={(url) => setPickupPhotos(prev => prev.filter(p => p !== url))}
              multiple={true}
            />

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>Back</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => setStep(5)}>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5 — Confirm */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              Step 5 — Confirm Pickup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</p>
                <p className="text-base font-semibold">{customer?.name} · {customer?.phone}</p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Items ({booking.booking_items.length})</p>
                {booking.booking_items.map((bi) => (
                  <div key={bi.id} className="flex justify-between text-sm">
                    <span>{bi.item_name} <span className="text-slate-400">({bi.size})</span></span>
                    <span className="text-slate-600">×{bi.quantity}</span>
                  </div>
                ))}
              </div>

              {(balanceDue > 0 && !skipBalance) && (
                <div className="bg-amber-50 rounded-lg p-4 flex justify-between text-sm">
                  <span className="font-medium text-amber-800">Balance to collect</span>
                  <span className="font-bold text-amber-900">₹{parseFloat(balanceAmount || '0').toLocaleString('en-IN')} via {balanceMethod}</span>
                </div>
              )}

              {(depositNeeded > 0 && !skipDeposit && !depositAlreadyCollected) && (
                <div className="bg-blue-50 rounded-lg p-4 flex justify-between text-sm">
                  <span className="font-medium text-blue-800">Deposit to collect</span>
                  <span className="font-bold text-blue-900">₹{parseFloat(depositAmount || '0').toLocaleString('en-IN')} via {depositMethod}</span>
                </div>
              )}

              {pickupPhotos.length > 0 && (
                <div className="bg-violet-50 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-semibold text-violet-500 uppercase tracking-wide">Documentation</p>
                  <p className="text-sm font-medium text-violet-800">{pickupPhotos.length} photos captured</p>
                </div>
              )}

              <div className="rounded-lg bg-slate-50 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="item-scan-confirm"
                    checked={itemScanned}
                    onCheckedChange={(value) => setItemScanned(Boolean(value))}
                    className="mt-0.5"
                  />
                  <Label htmlFor="item-scan-confirm" className="text-sm cursor-pointer leading-relaxed">
                    Exact items have been scanned or physically matched before handover.
                  </Label>
                </div>
                <div className="space-y-1.5">
                  <Label>Customer signature/name</Label>
                  <Input value={signatureName} onChange={(e) => setSignatureName(e.target.value)} placeholder={customer?.name || 'Customer name'} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(4)} disabled={submitting}>Back</Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                onClick={handleConfirmPickup}
                disabled={submitting || !itemScanned || !signatureName.trim()}
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 mr-2" />Confirm Pickup</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
