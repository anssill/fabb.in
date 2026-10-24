'use client'
import { useId } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { money, type PricedItem } from '@/lib/booking-pricing'

export function ItemDiscountInput({ item, onChange }: { item: PricedItem; onChange: (value: { discount_flat: number | null; discount_percent: number }) => void }) {
  const id = useId()
  const flat = item.discount_flat != null
  const subtotal = money(money(item.price) * item.quantity * (item.rental_days ?? 1))
  return <div className="space-y-1">
    <Label htmlFor={id}>Discount {flat ? '(₹ for this line)' : '(%)'}</Label>
    <div className="flex gap-2">
      <select aria-label="Discount type" className="h-9 rounded-md border bg-background px-2 text-sm" value={flat ? 'flat' : 'percentage'} onChange={event => onChange(event.target.value === 'flat' ? { discount_flat: money(subtotal * (item.discount_percent ?? 0) / 100), discount_percent: 0 } : { discount_flat: null, discount_percent: subtotal ? Math.round((item.discount_flat ?? 0) / subtotal * 10000) / 100 : 0 })}>
        <option value="flat">₹ Amount</option><option value="percentage">% Percent</option>
      </select>
      <Input id={id} type="number" min={0} max={flat ? subtotal : 100} step="0.01" value={flat ? item.discount_flat ?? 0 : item.discount_percent ?? 0} onChange={event => {
        const value = Number(event.target.value)
        if (!Number.isFinite(value)) return
        const normalized = money(Math.min(flat ? subtotal : 100, Math.max(0, value)))
        onChange(flat ? { discount_flat: normalized, discount_percent: 0 } : { discount_flat: null, discount_percent: normalized })
      }} />
    </div>
  </div>
}
