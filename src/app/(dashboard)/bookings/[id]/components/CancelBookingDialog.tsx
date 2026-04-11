'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  onSuccess: () => void
}

const CANCELLATION_REASONS = [
  { value: 'walk_in_cancelled', label: 'Walk-In Cancelled' },
  { value: 'customer_no_show', label: 'Customer No Show' },
  { value: 'payment_not_received', label: 'Payment Not Received' },
  { value: 'inventory_issue', label: 'Inventory Issue' },
  { value: 'other', label: 'Other' },
]

export function CancelBookingDialog({ bookingId, onSuccess }: Props) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a cancellation reason')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          cancellation_reason: reason,
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to cancel booking')
      }

      toast.success('Booking cancelled')
      setOpen(false)
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel booking')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="w-full">
          Cancel Booking
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Booking</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
            <p>This will release all reserved items back to available inventory.</p>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="cancel-reason">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes — visible when "Other" is selected */}
          {reason === 'other' && (
            <div className="space-y-1.5">
              <Label htmlFor="cancel-notes">Notes</Label>
              <Textarea
                id="cancel-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe the cancellation reason..."
                rows={3}
              />
            </div>
          )}

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
              variant="destructive"
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
