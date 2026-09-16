'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { calculateBookingPricing, money } from '@/lib/booking-pricing'
import { updateBookingPricing } from '../pricing-actions'
type Line = { id: string; item_name: string; size: string; price: number; quantity: number; rental_days: number; discount_percent: number; rate_basis: string }
export function EditPricingDialog({ bookingId, items, updatedAt, existingDiscount = 0, tax = 0 }: { bookingId: string; items: Line[]; updatedAt: string; existingDiscount?: number; tax?: number }) {
  const router=useRouter()
  const [open,setOpen]=useState(false)
  const [saving,setSaving]=useState(false)
  const [lines,setLines]=useState(items)
  const totals=calculateBookingPricing(lines)
  const original=calculateBookingPricing(items)
  const legacyDiscount=Math.max(0,existingDiscount-original.discount_amount)
  const taxRate=original.total_amount>legacyDiscount ? tax/(original.total_amount-legacyDiscount) : 0
  const updatedTax=money((totals.total_amount-legacyDiscount)*taxRate)
  const total=money(totals.total_amount-legacyDiscount+updatedTax)
  const change=(id:string,field:'price'|'discount_percent',value:string)=> {
    const n=Number(value)
    if (Number.isFinite(n)) setLines(lines.map(line=>line.id===id?{...line,[field]:Math.min(field==='price'?99999999:100,Math.max(0,n))}:line))
  }
  const save=async()=>{
    setSaving(true)
    try {
      const result=await updateBookingPricing(bookingId,lines.map(({id,price,discount_percent})=>({id,price,discount_percent})),updatedAt)
      if(result.error) throw new Error(result.error)
      toast.success('Booking prices updated'); setOpen(false); router.refresh()
    } catch(error) { toast.error(error instanceof Error?error.message:'Could not update prices') } finally { setSaving(false) }
  }
  return <Dialog open={open} onOpenChange={value=>{if(saving)return;setOpen(value);if(value)setLines(items)}}><DialogTrigger asChild><Button variant="outline">Edit item prices</Button></DialogTrigger><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Edit item prices</DialogTitle><DialogDescription>Adjust each item’s price and discount for this booking.</DialogDescription></DialogHeader>
    <p className="text-sm text-muted-foreground">Changes update the booking total and remaining rental balance. Existing payments stay recorded.</p>
    {lines.map(line=><div key={line.id} className="space-y-2 border rounded-lg p-3"><p className="font-medium">{line.item_name} · {line.size} × {line.quantity}</p><p className="text-xs text-muted-foreground">{line.rate_basis==='booking'?'Entire booking':'Original daily rate · '+line.rental_days+' billable day(s)'}</p><div className="grid grid-cols-2 gap-3"><div><Label htmlFor={line.id+'-rate'}>Price per piece (₹)</Label><Input id={line.id+'-rate'} type="number" min="0" step="0.01" value={line.price} onChange={e=>change(line.id,'price',e.target.value)} /></div><div><Label htmlFor={line.id+'-discount'}>Discount (%)</Label><Input id={line.id+'-discount'} type="number" min="0" max="100" step="0.01" value={line.discount_percent} onChange={e=>change(line.id,'discount_percent',e.target.value)} /></div></div></div>)}
    {legacyDiscount>0&&<p className="text-sm">Existing booking discount: ₹{legacyDiscount.toLocaleString('en-IN')}</p>}{tax>0&&<p className="text-sm">Updated GST: ₹{updatedTax.toLocaleString('en-IN')}</p>}
    <p className="font-semibold">Updated rental total: ₹{total.toLocaleString('en-IN')}</p><Button disabled={saving||total<0} onClick={save}>{saving?'Saving…':'Save prices'}</Button></DialogContent></Dialog>
}
