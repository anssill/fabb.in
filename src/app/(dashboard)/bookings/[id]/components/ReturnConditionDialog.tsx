'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { safeJsonParse } from '@/lib/api-utils'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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
import { RefreshCcw } from 'lucide-react'

interface BookingItem {
  id: string
  item_name: string
  size: string
  quantity: number
}

interface Props {
  bookingId: string
  bookingItems: BookingItem[]
  depositAmount: number
  onSuccess: () => void
}

const CONDITIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'damaged', label: 'Damaged' },
]

export function ReturnConditionDialog({
  bookingId,
  bookingItems,
  depositAmount,
  onSuccess,
}: Props) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Map item id -> condition
  const [conditions, setConditions] = useState<Record<string, string>>(
    Object.fromEntries(bookingItems.map((item) => [item.id, 'good']))
  )
  const [refundDeposit, setRefundDeposit] = useState(depositAmount > 0)
  const [notes, setNotes] = useState('')

  const handleConditionChange = (itemId: string, condition: string) => {
    setConditions((prev) => ({ ...prev, [itemId]: condition }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // 1. Mark booking as returned (triggers stock return via API)
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'returned' }),
      })

      if (!res.ok) {
        const data = await safeJsonParse(res)
        throw new Error(data.error || 'Failed to update booking status')
      }

      const supabase = createClient()

      // 2. Update condition_on_return for each item
      for (const item of bookingItems) {
        const condition = conditions[item.id]
        if (condition) {
          const { error } = await supabase
            .from('booking_items')
            .update({
              condition_on_return: condition,
              ...(notes.trim() ? { condition_notes_on_return: notes.trim() } : {}),
            })
            .eq('id', item.id)

          if (error) {
            console.error(`Failed to update condition for item ${item.id}:`, error.message)
          }
        }
      }

      // 3. Insert deposit refund payment if applicable
      if (refundDeposit && depositAmount > 0) {
        const { error: paymentError } = await supabase.from('booking_payments').insert({
          booking_id: bookingId,
          type: 'deposit_refund',
          amount: depositAmount,
          method: 'cash',
          notes: 'Deposit refunded on return',
        })

        if (paymentError) {
          console.error('Failed to record deposit refund:', paymentError.message)
        }
      }

      toast.success('Return processed successfully')
      setOpen(false)
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Failed to process return')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-green-600 hover:bg-green-700 text-white" size="sm">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Mark as Returned
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Process Return</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Per-item condition selects */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700">Item Conditions</Label>
            {bookingItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{item.item_name}</p>
                  <p className="text-xs text-slate-500">
                    Size: {item.size} · Qty: {item.quantity}
                  </p>
                </div>
                <div className="w-36 flex-shrink-0">
                  <Select
                    value={conditions[item.id] || 'good'}
                    onValueChange={(val) => handleConditionChange(item.id, val)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value} className="text-xs">
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          {/* Deposit refund checkbox — only shown when deposit > 0 */}
          {depositAmount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <Checkbox
                id="refund-deposit"
                checked={refundDeposit}
                onCheckedChange={(checked) => setRefundDeposit(Boolean(checked))}
              />
              <Label htmlFor="refund-deposit" className="text-sm cursor-pointer">
                Refund Deposit of ₹{depositAmount.toLocaleString('en-IN')}
              </Label>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="return-notes">Notes (optional)</Label>
            <Textarea
              id="return-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about the returned items..."
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Confirm Return'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
