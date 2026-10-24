'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { ItemsStep } from '../../new/steps/ItemsStep'
import type { BookingItem, BookingDates } from '../../new/page'
import { calculateBookingPricing, money } from '@/lib/booking-pricing'
import { updateBookingItems } from '../item-actions'

export interface EditBookingItemsProps {
  triggerLabel?: string
  prominent?: boolean
  bookingId: string
  branchId: string
  updatedAt: string
  pickupDate: string
  returnDate: string
  items: BookingItem[]
  existingDiscount: number
  tax: number
  paid: number
  reservesStock: boolean
}

export function EditBookingItemsDialog(props: EditBookingItemsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lines, setLines] = useState(props.items)
  const [dates, setDates] = useState<BookingDates>({ event_date: '', pickup_date: props.pickupDate, return_date: props.returnDate })
  const [reserved, setReserved] = useState<Record<string, number>>({})
  const original = calculateBookingPricing(props.items)
  const totals = calculateBookingPricing(lines)
  const legacyDiscount = Math.max(0, props.existingDiscount - original.discount_amount)
  const originalNet = original.total_amount - legacyDiscount
  const net = totals.total_amount - legacyDiscount
  const tax = originalNet > 0 ? money(net * props.tax / originalNet) : props.tax
  const total = money(net + tax)
  const invalid = !lines.length || net < 0 || total < props.paid

  const changeLines = (next: BookingItem[]) => setLines(next.map(line => {
    const existing = props.items.find(item => item.variant_id === line.variant_id)
    return existing ? { ...line, booking_item_id: existing.booking_item_id, rental_days: existing.rental_days, rate_basis: existing.rate_basis } : line
  }))
  const onOpenChange = (value: boolean) => {
    if (saving) return
    if (value) {
      setLines(props.items)
      setDates({ event_date: '', pickup_date: props.pickupDate, return_date: props.returnDate })
      setReserved(props.reservesStock ? Object.fromEntries(props.items.map(item => [item.variant_id, item.quantity])) : {})
    }
    setOpen(value)
  }
  const save = async () => {
    if (invalid || saving) return
    setSaving(true)
    try {
      const result = await updateBookingItems(props.bookingId, lines, props.updatedAt, dates.overbook_reason ?? '')
      if (result.error) throw new Error(result.error)
      toast.success('Booking products and totals updated')
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update booking products')
    } finally { setSaving(false) }
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogTrigger asChild><Button variant={props.prominent ? "default" : "outline"}>{props.triggerLabel ?? "Edit booking items"}</Button></DialogTrigger>
    <DialogContent className="flex h-[90dvh] flex-col overflow-hidden p-0 sm:max-w-3xl">
      <DialogHeader className="px-6 pt-6"><DialogTitle>{props.triggerLabel === 'Add new item' ? 'Add items to this booking' : 'Edit booking items'}</DialogTitle><DialogDescription>Search for a product below and select its size to add it to this same booking. Existing items stay selected. Save to update the items, total and remaining balance before pickup.</DialogDescription></DialogHeader>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 sm:px-6" tabIndex={0} aria-label="Edit selected booking products">
        <fieldset disabled={saving} className="min-w-0 space-y-4">
        <Card><ItemsStep items={lines} setItems={changeLines} dates={dates} setDates={setDates} branchId={props.branchId} reservedQuantities={reserved} /></Card>
        <div className="space-y-2 rounded-xl border bg-muted/30 p-4 text-sm" aria-live="polite">
          {legacyDiscount > 0 && <p>Existing booking discount: ₹{legacyDiscount.toLocaleString('en-IN')}</p>}
          {props.tax > 0 && <p>Updated GST: ₹{Math.max(0, tax).toLocaleString('en-IN')}</p>}
          <p className="font-semibold">Updated rental total: ₹{Math.max(0, total).toLocaleString('en-IN')}</p>
          <p>Already paid: ₹{props.paid.toLocaleString('en-IN')} · Remaining: ₹{Math.max(0, money(total - props.paid)).toLocaleString('en-IN')}</p>
          {!lines.length && <p className="text-destructive">Add at least one product to save the booking.</p>}
          {net < 0 && <p className="text-destructive">The existing booking discount exceeds the new product total.</p>}
          {total < props.paid && <p className="text-destructive">Record a rental refund before reducing the total below the amount already paid.</p>}
        </div>
        </fieldset>
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t bg-background px-6 py-4"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="button" disabled={invalid || saving} onClick={save}>{saving ? 'Saving…' : 'Save booking items'}</Button></div>
      </div>
    </DialogContent>
  </Dialog>
}
