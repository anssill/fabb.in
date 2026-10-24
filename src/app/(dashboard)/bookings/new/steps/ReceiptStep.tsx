'use client'

import { InvoiceActions } from '@/components/invoices/InvoiceActions'
import { paymentSummary } from '@/lib/payment-splits'

import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { BookingCustomer, BookingItem, BookingDates, BookingPricing, BookingPayment } from '../page'
import { useAppStore } from '@/lib/store'
import { calculateItemPricing } from '@/lib/booking-pricing'

interface Props {
  onCreateAnother: () => void
  bookingNumber: string | null
  bookingId: string | null
  customer: BookingCustomer
  items: BookingItem[]
  dates: BookingDates
  pricing: BookingPricing
  payment: BookingPayment
}

export function ReceiptStep({ onCreateAnother, bookingNumber, bookingId, customer, items, dates, pricing, payment }: Props) {
  const business = useAppStore(state => state.business)
  const balanceDue = Math.max(0, pricing.total_amount - payment.advance_amount)

  return (
    <>
      <CardHeader className="text-center border-b">
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <CardTitle className="text-xl">Booking Confirmed! 🎉</CardTitle>
        <CardDescription>The booking has been created successfully.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Receipt / Summary */}
        <div className="border rounded-lg p-4 space-y-4 bg-muted/40">
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed">
            <p className="font-bold text-lg text-foreground">{business?.name || 'Your business'}</p>
            <p className="text-xs text-muted-foreground">Booking Summary</p>
            {bookingNumber && <p className="mt-1 break-all font-mono text-sm font-semibold">{bookingNumber}</p>}
          </div>

          {/* Customer info */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">Customer</p>
            <p className="text-sm font-medium">{customer.name}</p>
            <p className="text-xs text-muted-foreground">{customer.phone}</p>
            {customer.additional_phones?.filter(Boolean).map(phone => <p key={phone} className="text-xs text-muted-foreground">Additional: {phone}</p>)}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Event</p>
              <p className="text-sm font-medium">{dates.event_date ? new Date(dates.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Pickup</p>
              <p className="text-sm font-medium">{dates.pickup_date ? new Date(dates.pickup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Return</p>
              <p className="text-sm font-medium">{dates.return_date ? new Date(dates.return_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-'}</p>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase">Items · entire booking</p>
            {items.map((item) => (
              <div key={item.variant_id} className="flex justify-between text-sm">
                <span>{item.name} ({item.size}) ×{item.quantity} · ₹{item.price}/pc · {item.discount_flat != null ? `₹${item.discount_flat}` : `${item.discount_percent ?? 0}%`} off</span>
                <span className="font-medium">₹{calculateItemPricing(item).total_amount.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t pt-3 space-y-1.5">
            {payment.deposit_amount > 0 && <div className="flex justify-between text-sm"><span>Refundable deposit collected</span><span>₹{payment.deposit_amount.toLocaleString('en-IN')}</span></div>}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{pricing.subtotal.toLocaleString('en-IN')}</span>
            </div>
            {pricing.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                <span>Discount</span>
                <span>-₹{pricing.discount_amount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold border-t pt-2">
              <span>Total</span>
              <span>₹{pricing.total_amount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="border-t pt-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Advance Paid</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">₹{payment.advance_amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Method</span>
              <span className="capitalize">{paymentSummary(payment.advance_amount, payment)}</span>
            </div>
            {payment.deposit_amount > 0 && <div className="flex justify-between gap-3 text-sm"><span>Deposit</span><span>{paymentSummary(payment.deposit_amount, { method: payment.deposit_method ?? payment.method, splits: payment.deposit_splits })}</span></div>}
            <div className="flex justify-between text-sm font-semibold">
              <span>Balance Due</span>
              <Badge variant={balanceDue > 0 ? 'default' : 'secondary'} className="text-xs">
                ₹{balanceDue.toLocaleString('en-IN')}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {bookingId && <InvoiceActions bookingId={bookingId}/>}
          {bookingId && (
            <Button className="w-full" asChild>
              <Link href={`/bookings/${bookingId}`}>
                View Booking
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          )}
          <Button variant="ghost" onClick={onCreateAnother}>Create Another Booking</Button>
        </div>
      </CardContent>
    </>
  )
}
