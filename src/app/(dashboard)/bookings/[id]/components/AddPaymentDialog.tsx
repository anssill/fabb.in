'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { IndianRupee } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  businessId: string
  branchId: string
  staffId: string
  balanceDue: number
  depositAmount: number
  totalAmount: number
}

const PAYMENT_TYPES = [
  { value: 'balance', label: 'Balance' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'penalty', label: 'Penalty' },
  { value: 'deposit_refund', label: 'Deposit Refund' },
  { value: 'refund', label: 'Refund' },
]

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
]

export function AddPaymentDialog({
  bookingId,
  businessId,
  branchId,
  staffId,
  balanceDue,
  depositAmount,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [paymentType, setPaymentType] = useState('balance')
  const [amount, setAmount] = useState(String(balanceDue > 0 ? balanceDue : 0))
  const [method, setMethod] = useState('cash')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  // Update default amount when payment type changes
  const handleTypeChange = (type: string) => {
    setPaymentType(type)
    if (type === 'balance') {
      setAmount(String(balanceDue > 0 ? balanceDue : 0))
    } else if (type === 'deposit_refund') {
      setAmount(String(depositAmount > 0 ? depositAmount : 0))
    } else {
      setAmount('')
    }
  }

  const showReference = method === 'upi' || method === 'bank_transfer'

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('booking_payments').insert({
        booking_id: bookingId,
        business_id: businessId,
        branch_id: branchId,
        type: paymentType,
        amount: parsedAmount,
        method,
        reference_number: reference.trim() || null,
        notes: notes.trim() || null,
        collected_by: staffId,
      })

      if (error) throw new Error(error.message)

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <IndianRupee className="w-4 h-4 mr-2" />
          Add Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
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
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <Label htmlFor="method">Payment Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reference / UTR — shown for UPI and Bank Transfer */}
          {showReference && (
            <div className="space-y-1.5">
              <Label htmlFor="reference">Reference / UTR Number (optional)</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Enter transaction reference"
              />
            </div>
          )}

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
        </div>
      </DialogContent>
    </Dialog>
  )
}
