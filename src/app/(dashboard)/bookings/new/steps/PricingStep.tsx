'use client'

import { useEffect } from 'react'
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calculator } from 'lucide-react'
import type { BookingPricing, BookingItem, BookingDates } from '../page'

interface Props {
  pricing: BookingPricing
  setPricing: (p: BookingPricing) => void
  items: BookingItem[]
  dates: BookingDates
}

export function PricingStep({ pricing, setPricing, items, dates }: Props) {
  const rentalDays = dates.pickup_date && dates.return_date
    ? Math.max(1, Math.ceil((new Date(dates.return_date).getTime() - new Date(dates.pickup_date).getTime()) / (1000 * 60 * 60 * 24)))
    : 1

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity * rentalDays, 0)

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
          <Calculator className="w-5 h-5 text-blue-600" />
          Pricing Summary
        </CardTitle>
        <CardDescription>Review and adjust pricing for this booking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Item breakdown */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase">Item Breakdown ({rentalDays} day{rentalDays !== 1 ? 's' : ''})</p>
          {items.map((item) => (
            <div key={item.variant_id} className="flex justify-between text-sm">
              <span className="text-slate-700">
                {item.name} ({item.size}) × {item.quantity} × {rentalDays}d
              </span>
              <span className="font-medium">₹{(item.price * item.quantity * rentalDays).toLocaleString('en-IN')}</span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between text-sm font-medium">
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Discount */}
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

        {/* Delivery fee */}
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

        {/* Total */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Subtotal</span>
            <span>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          {pricing.discount_amount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-₹{pricing.discount_amount.toLocaleString('en-IN')}</span>
            </div>
          )}
          {pricing.delivery_fee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Delivery</span>
              <span>+₹{pricing.delivery_fee.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between text-lg font-semibold text-blue-900">
            <span>Total</span>
            <span>₹{pricing.total_amount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </CardContent>
    </>
  )
}
