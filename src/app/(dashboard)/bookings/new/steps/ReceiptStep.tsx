'use client'

import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Printer, Share2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { BookingCustomer, BookingItem, BookingDates, BookingPricing, BookingPayment } from '../page'
import { calculateBillableRentalDays } from '@/lib/booking-utils'

interface Props {
  bookingId: string | null
  customer: BookingCustomer
  items: BookingItem[]
  dates: BookingDates
  pricing: BookingPricing
  payment: BookingPayment
}

export function ReceiptStep({ bookingId, customer, items, dates, pricing, payment }: Props) {
  const balanceDue = Math.max(0, pricing.total_amount - payment.advance_amount - (payment.deposit_amount ?? 0))
  const rentalDays = dates.pickup_date && dates.return_date
    ? calculateBillableRentalDays(dates.pickup_date, dates.return_date)
    : 1

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
        <div data-thermal-receipt className="border rounded-lg p-4 space-y-4 bg-muted/40">
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed">
            <p className="font-bold text-lg text-foreground">Fabb.booking</p>
            <p className="text-xs text-muted-foreground">Booking Receipt</p>
          </div>

          {/* Customer info */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">Customer</p>
            <p className="text-sm font-medium">{customer.name}</p>
            <p className="text-xs text-muted-foreground">{customer.phone}</p>
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
            <p className="text-xs font-medium text-muted-foreground uppercase">Items ({rentalDays} day{rentalDays !== 1 ? 's' : ''})</p>
            {items.map((item) => (
              <div key={item.variant_id} className="flex justify-between text-sm">
                <span>{item.name} ({item.size}) ×{item.quantity}</span>
                <span className="font-medium">₹{(item.price * item.quantity * rentalDays).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t pt-3 space-y-1.5">
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
              <span className="capitalize">{payment.method}</span>
            </div>
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
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              Print Receipt
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                const msg = encodeURIComponent(
                  `Dear ${customer.name}, your booking is confirmed at Fabb.booking.\nPickup: ${dates.pickup_date}\nReturn: ${dates.return_date}\nTotal: ₹${pricing.total_amount.toLocaleString('en-IN')}\nAdvance Paid: ₹${payment.advance_amount.toLocaleString('en-IN')}\nBalance Due: ₹${balanceDue.toLocaleString('en-IN')}`
                )
                window.open(`https://wa.me/91${customer.phone.replace(/\D/g, '')}?text=${msg}`, '_blank')
              }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share via WhatsApp
            </Button>
          </div>
          {bookingId && (
            <Button className="w-full" asChild>
              <Link href={`/bookings/${bookingId}`}>
                View Booking
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          )}
          <Button variant="ghost" asChild>
            <Link href="/bookings/new">Create Another Booking</Link>
          </Button>
        </div>
      </CardContent>
    </>
  )
}
