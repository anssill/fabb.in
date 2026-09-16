'use client'
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { calculateBookingPricing, calculateItemPricing } from '@/lib/booking-pricing'
import { useAppStore } from '@/lib/store'
import { applyBookingTax } from '@/lib/booking-pricing'
import type { BookingItem } from '../page'
export function PricingStep({ items, setItems }: { items: BookingItem[]; setItems: (items: BookingItem[]) => void }) {
  const branch = useAppStore(state => state.activeBranch)
  const totals = applyBookingTax(calculateBookingPricing(items), branch?.settings?.invoice)
  const update = (id: string, field: 'price' | 'discount_percent', value: string) => {
    const number = Number(value)
    if (!Number.isFinite(number)) return
    setItems(items.map(item => item.variant_id === id ? { ...item, [field]: Math.min(field === 'discount_percent' ? 100 : 99999999, Math.max(0, number)) } : item))
  }
  return <><CardHeader><CardTitle>Item pricing</CardTitle><CardDescription>Per-piece prices cover the entire booking. Set a discount for each item.</CardDescription></CardHeader>
    <CardContent className="space-y-4">{items.map(item => {
      const line = calculateItemPricing(item)
      return <div key={item.variant_id} className="rounded-xl border p-4 space-y-3">
        <div><p className="font-medium">{item.name} · {item.size}</p><p className="text-sm text-muted-foreground">{item.quantity} piece(s) · entire booking</p></div>
        <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label htmlFor={item.variant_id + '-price'}>Price per piece (₹)</Label><Input id={item.variant_id + '-price'} type="number" min="0" step="0.01" value={item.price} onChange={e => update(item.variant_id, 'price', e.target.value)} /></div>
        <div className="space-y-1"><Label htmlFor={item.variant_id + '-discount'}>Discount (%)</Label><Input id={item.variant_id + '-discount'} type="number" min="0" max="100" step="0.01" value={item.discount_percent ?? 0} onChange={e => update(item.variant_id, 'discount_percent', e.target.value)} /></div></div>
        <div className="flex justify-between text-sm"><span>₹{line.subtotal.toLocaleString('en-IN')} − ₹{line.discount_amount.toLocaleString('en-IN')}</span><strong>₹{line.total_amount.toLocaleString('en-IN')}</strong></div>
      </div>
    })}<div className="rounded-xl bg-muted p-4 space-y-2"><div className="flex justify-between"><span>Subtotal</span><span>₹{totals.subtotal.toLocaleString('en-IN')}</span></div><div className="flex justify-between"><span>Item discounts</span><span>−₹{totals.discount_amount.toLocaleString('en-IN')}</span></div><div className="flex justify-between font-semibold border-t pt-2"><span>Total including GST ({totals.tax_amount.toLocaleString('en-IN')})</span><span>₹{totals.total_amount.toLocaleString('en-IN')}</span></div></div></CardContent></>
}
