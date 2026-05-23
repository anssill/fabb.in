'use client'

import { useEffect } from 'react'
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calculator } from 'lucide-react'
import type { BookingPricing, BookingItem, BookingDates } from '../page'
import { calculateBillableRentalDays } from '@/lib/booking-utils'

interface Props {
  pricing: BookingPricing
  setPricing: (p: BookingPricing) => void
  items: BookingItem[]
  setItems: (items: BookingItem[]) => void
  dates: BookingDates
}

export function PricingStep({ pricing, setPricing, items, setItems, dates }: Props) {
  const rentalDays = dates.pickup_date && dates.return_date
    ? calculateBillableRentalDays(dates.pickup_date, dates.return_date)
    : 1

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity * rentalDays, 0)

  const updateItemRate = (variantId: string, price: number) => {
    setItems(items.map((item) => (
      item.variant_id === variantId ? { ...item, price: Math.max(0, price) } : item
    )))
  }

  useEffect(() => {
    const discountAmount = pricing.discount_type === 'percentage'
      ? Math.round(subtotal * pricing.discount_value / 100)
      : pricing.discount_value

    const total = Math.max(0, subtotal - discountAmount + pricing.delivery_fee)
    setPricing({
      ...pricing,
      subtotal,
      discount_amount: discountAmount,
      total_amount: total,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal, pricing.discount_type, pricing.discount_value, pricing.delivery_fee])

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Pricing Summary
        </CardTitle>
        <CardDescription>Review and adjust pricing for this booking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Item Breakdown ({rentalDays} day{rentalDays !== 1 ? 's' : ''})
          </p>
          {items.map((item) => (
            <div key={item.variant_id} className="grid grid-cols-1 gap-2 rounded-md border border-border/60 bg-background p-2 text-sm sm:grid-cols-[1fr_120px_auto] sm:items-center">
              <span className="min-w-0 text-foreground">
                {item.name} ({item.size}) x {item.quantity} x {rentalDays}d
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Pc rate</span>
                <Input
                  type="number"
                  value={item.price || ''}
                  min={0}
                  onChange={(e) => updateItemRate(item.variant_id, Number(e.target.value))}
                  className="h-8"
                />
              </div>
              <span className="font-semibold text-foreground">₹{(item.price * item.quantity * rentalDays).toLocaleString('en-IN')}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 flex justify-between text-sm font-bold text-foreground">
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Discount type</Label>
            <Select
              value={pricing.discount_type}
              onValueChange={(v) => setPricing({ ...pricing, discount_type: v as 'flat' | 'percentage' })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="flat">Flat (₹)</SelectItem>
                <SelectItem value="percentage">Percentage (%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Discount value</Label>
            <Input
              type="number"
              value={pricing.discount_value || ''}
              onChange={(e) => setPricing({ ...pricing, discount_value: Number(e.target.value) })}
              placeholder="0"
              min={0}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Delivery fee</Label>
          <Input
            type="number"
            value={pricing.delivery_fee || ''}
            onChange={(e) => setPricing({ ...pricing, delivery_fee: Number(e.target.value) })}
            placeholder="0"
            min={0}
          />
        </div>

        <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold text-foreground">₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          {pricing.discount_amount > 0 && (
            <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              <span>Discount</span>
              <span>-₹{pricing.discount_amount.toLocaleString('en-IN')}</span>
            </div>
          )}
          {pricing.delivery_fee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              <span className="font-semibold text-foreground">+₹{pricing.delivery_fee.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="border-t border-border pt-2 flex justify-between text-lg font-bold text-foreground">
            <span>Total</span>
            <span>₹{pricing.total_amount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </CardContent>
    </>
  )
}
