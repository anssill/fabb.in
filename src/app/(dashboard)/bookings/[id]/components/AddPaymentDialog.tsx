'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { IndianRupee } from 'lucide-react'
import { SplitPaymentFields } from '@/components/payments/SplitPaymentFields'
import { paymentParts, type PaymentPart, type PaymentMethod } from '@/lib/payment-splits'
import { safeJsonParse } from '@/lib/api-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  bookingId: string
  balanceDue: number
  depositAmount: number
}

const PAYMENT_TYPES = [
  { value: 'balance', label: 'Balance' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'penalty', label: 'Penalty' },
  { value: 'deposit_refund', label: 'Deposit Refund' },
  { value: 'refund', label: 'Refund' },
]

export function AddPaymentDialog({
  bookingId,
  balanceDue,
  depositAmount,
}: Props) {
  const router = useRouter()
  const request = useRef<{ payload: string; key: string } | null>(null)
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [paymentType, setPaymentType] = useState('balance')
  const [amount, setAmount] = useState(String(balanceDue > 0 ? balanceDue : 0))
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [reference, setReference] = useState('')
  const [splits, setSplits] = useState<PaymentPart[]>()
  const [notes, setNotes] = useState('')

  // Update default amount when payment type changes
  const handleTypeChange = (type: string) => {
    setPaymentType(type)
    setSplits(undefined)
    if (type === 'balance') {
      setAmount(String(balanceDue > 0 ? balanceDue : 0))
    } else if (type === 'deposit_refund') {
      setAmount(String(depositAmount > 0 ? depositAmount : 0))
    } else {
      setAmount('')
    }
  }


  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    let parts: PaymentPart[]
    try { parts = paymentParts(parsedAmount, { method, reference, splits }) } catch (error) { toast.error((error as Error).message); return }
    const payload = JSON.stringify({ paymentType, parsedAmount, parts, notes })
    if (request.current?.payload !== payload) request.current = { payload, key: crypto.randomUUID() }
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/bookings/${bookingId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        type: paymentType,
        amount: parsedAmount,
        parts,
        method,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
        idempotencyKey: request.current.key,
        }),
      })
      const result = await safeJsonParse(response)
      if (!response.ok) throw new Error(result.error || 'Payment failed')

      request.current = null
      toast.success('Payment recorded successfully')
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={value => { if (!isSubmitting) { setOpen(value); if (value) { setAmount(String(balanceDue)); setPaymentType("balance"); setSplits(undefined) } } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <IndianRupee className="w-4 h-4 mr-2" />
          Add Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>Record rental payments and refundable deposits separately.</DialogDescription>
        </DialogHeader>
        <fieldset disabled={isSubmitting} className="space-y-4 py-2">
          {/* Payment Type */}
          <div className="space-y-1.5">
            <Label htmlFor="payment-type">Payment Type</Label>
            <Select value={paymentType} onValueChange={handleTypeChange}>
              <SelectTrigger id="payment-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>

          <SplitPaymentFields total={Number(amount)} value={{ method, reference, splits }} onChange={value => { setMethod(value.method); setReference(value.reference ?? ''); setSplits(value.splits) }}/>
          <p className="text-xs text-muted-foreground">Collect part or all of the balance. Any unpaid rental amount stays due.</p>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes..."
              rows={2}
            />
          </div>

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Recording...' : 'Record Payment'}
          </Button>
        </fieldset>
      </DialogContent>
    </Dialog>
  )
}
