'use client'

import Image from 'next/image'
import { Package, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EditBookingItemsDialog, type EditBookingItemsProps } from './EditBookingItemsDialog'
import { EditPricingDialog } from './EditPricingDialog'
import type { BookingItem } from '../../new/page'

export type BookingPanelItem = BookingItem & { picked_up_quantity: number; returned_quantity: number; line_total: number }
export interface BookingItemsPanelProps extends EditBookingItemsProps {
  items: BookingPanelItem[]
  canManage: boolean
  status: string
}

export function BookingItemsPanel({ canManage, status, ...booking }: BookingItemsPanelProps) {
  const canChangeProducts = canManage && ['draft', 'quote', 'hold', 'confirmed'].includes(status)
  const canChangePrices = canManage && ['picked_up', 'partially_returned', 'returned'].includes(status)

  return <Card>
    <CardHeader className="gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-base"><Package className="h-5 w-5 text-primary" />Items in this booking</CardTitle>
        {canChangeProducts && <div className="flex flex-wrap gap-2">
          <EditBookingItemsDialog {...booking} prominent triggerLabel="Add new item" />
          <EditBookingItemsDialog {...booking} triggerLabel="Edit items" />
        </div>}
        {canChangePrices && <EditPricingDialog bookingId={booking.bookingId} updatedAt={booking.updatedAt} existingDiscount={booking.existingDiscount} tax={booking.tax} items={booking.items.map(item => ({
          id: item.booking_item_id!, item_name: item.name, size: item.size, quantity: item.quantity,
          price: item.price, rental_days: item.rental_days ?? 1, rate_basis: item.rate_basis ?? 'booking', discount_percent: item.discount_percent ?? 0, discount_flat: item.discount_flat,
        }))} />}
      </div>
      <CardDescription>
        {canChangeProducts ? 'Add another product, remove items, change quantities, and edit prices or discounts. Save all changes together.'
          : !canManage ? 'Your account needs booking management permission to edit items.'
          : canChangePrices ? 'Prices can be edited here. Products and quantities are locked after pickup to preserve pickup and return records.'
          : 'This booking is closed or cancelled. Its item history is read-only.'}
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      <div aria-label="Booked products scroll area" tabIndex={0} className="max-h-96 space-y-3 overflow-y-auto overscroll-y-contain rounded-xl border p-3 pr-2 touch-pan-y [scrollbar-gutter:stable] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {booking.items.map(item => <div key={item.booking_item_id ?? item.variant_id} className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-background">{item.cover_image_url ? <Image src={item.cover_image_url} alt={item.name} width={48} height={48} unoptimized className="h-full w-full object-cover" /> : <Package className="h-6 w-6 text-muted-foreground" />}</div>
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-semibold">{item.name}</p>
          <p className="text-xs text-muted-foreground">Size: {item.size} · Qty: {item.quantity} · ₹{item.price.toLocaleString('en-IN')}/pc · {item.discount_flat != null ? `₹${item.discount_flat}` : `${item.discount_percent ?? 0}%`} off · {item.rate_basis === 'day' ? `${item.rental_days} billable days` : 'entire booking'}</p>
          <p className="mt-1 text-xs text-muted-foreground">Picked up: {item.picked_up_quantity} · Returned: {item.returned_quantity} · Out: {Math.max(0, item.picked_up_quantity - item.returned_quantity)}</p>
        </div>
        <p className="text-sm font-bold">₹{item.line_total.toLocaleString('en-IN')}</p>
      </div>)}
      {!booking.items.length && <p className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground"><Plus className="h-4 w-4" />No products yet. Use Add new item to add products to this booking.</p>}
      </div>
    </CardContent>
  </Card>
}
