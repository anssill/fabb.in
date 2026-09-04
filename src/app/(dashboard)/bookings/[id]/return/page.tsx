'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, ChevronLeft, Loader2, Package } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { isValidUuid, safeJsonParse } from '@/lib/api-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

type AssetAssignment = { asset_id: string; released_at: string | null; asset: { id: string; asset_code: string; status: string } | null }
type BookingItem = { id: string; item_id: string; item_variant_id: string; item_name: string; size: string; quantity: number; picked_up_quantity: number; returned_quantity: number; replacement_value: number; item: { tracking_mode: string } | null; booking_item_assets: AssetAssignment[] }
type Booking = { id: string; booking_number: string; status: string; deposit_amount: number; business_id: string; branch_id: string; customer_id: string | null; customer: { name: string; phone: string } | null; booking_items: BookingItem[] }
type ReturnLine = { quantity: number; reason: '' | 'damaged' | 'missing'; unavailableQuantity: number; notes: string; assetIds: string[] }

export default function ReturnPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [lines, setLines] = useState<Record<string, ReturnLine>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deduction, setDeduction] = useState(0)
  const [deductionReason, setDeductionReason] = useState('')
  const [refundMethod, setRefundMethod] = useState('cash')
  const [refundReference, setRefundReference] = useState('')

  useEffect(() => {
    async function load() {
      if (!isValidUuid(id)) { setLoading(false); return }
      const db = createClient() as any
      const { data } = await db.from('bookings').select('id, booking_number, status, deposit_amount, business_id, branch_id, customer_id, customer:customers(name, phone), booking_items(id, item_id, item_variant_id, item_name, size, quantity, picked_up_quantity, returned_quantity, replacement_value, item:items(tracking_mode), booking_item_assets(asset_id, released_at, asset:inventory_assets(id, asset_code, status)))').eq('id', id).single()
      if (data) {
        const normalized = { ...data, customer: Array.isArray(data.customer) ? data.customer[0] : data.customer } as Booking
        setBooking(normalized)
        setLines(Object.fromEntries(normalized.booking_items.map((item) => {
          const remaining = Math.max(0, Number(item.picked_up_quantity || item.quantity) - Number(item.returned_quantity || 0))
          const itemRecord = Array.isArray(item.item) ? item.item[0] : item.item
          const activeAssets = (item.booking_item_assets ?? []).filter((entry) => !entry.released_at && entry.asset?.status === 'out').map((entry) => entry.asset_id)
          const assetIds = itemRecord?.tracking_mode === 'asset' ? activeAssets.slice(0, remaining) : []
          return [item.id, { quantity: itemRecord?.tracking_mode === 'asset' ? assetIds.length : remaining, reason: '', unavailableQuantity: 0, notes: '', assetIds }]
        })))
      }
      setLoading(false)
    }
    void load()
  }, [id])

  const depositHeld = Number(booking?.deposit_amount ?? 0)
  const refund = Math.max(0, depositHeld - deduction)
  const totalReturning = useMemo(() => Object.values(lines).reduce((sum, line) => sum + Number(line.quantity || 0), 0), [lines])

  function updateLine(itemId: string, patch: Partial<ReturnLine>) {
    setLines((current) => ({ ...current, [itemId]: { ...current[itemId], ...patch } }))
  }

  async function submit() {
    if (!booking || totalReturning <= 0) return toast.error('Choose at least one quantity to return')
    if (deduction > 0 && !deductionReason.trim()) return toast.error('Enter a reason for the deposit deduction')
    setSubmitting(true)
    try {
      const response = await fetch(`/api/bookings/${booking.id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'returned', returns: booking.booking_items.map((item) => ({ bookingItemId: item.id, ...lines[item.id] })) }),
      })
      if (!response.ok) { const body = await safeJsonParse(response); throw new Error(body.error || 'Return failed') }

      const supabase = createClient()
      const db = supabase as any
      const { data: { user } } = await supabase.auth.getUser()
      if (deduction > 0) await db.from('deposit_ledger').insert({ business_id: booking.business_id, branch_id: booking.branch_id, booking_id: booking.id, entry_type: 'deduction', amount: deduction, note: deductionReason, created_by: user?.id })
      if (refund > 0) {
        await Promise.all([
          db.from('deposit_ledger').insert({ business_id: booking.business_id, branch_id: booking.branch_id, booking_id: booking.id, entry_type: 'refund', amount: refund, payment_method: refundMethod, reference_number: refundReference || null, created_by: user?.id }),
          db.from('booking_payments').insert({ business_id: booking.business_id, branch_id: booking.branch_id, booking_id: booking.id, type: 'deposit_refund', amount: refund, method: refundMethod, reference_number: refundReference || null, collected_by: user?.id, notes: deduction ? `Refund after ₹${deduction} deduction` : 'Full deposit refund' }),
        ])
      }
      toast.success('Return recorded. Available quantities were released immediately.')
      router.push(`/bookings/${booking.id}`); router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Return failed')
    } finally { setSubmitting(false) }
  }

  if (loading) return <div className="grid min-h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
  if (!booking) return <Empty title="Booking not found" href="/bookings" />
  if (!['picked_up', 'partially_returned'].includes(booking.status)) return <Empty title={`Return is not available while booking is ${booking.status}`} href={`/bookings/${id}`} />

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3"><Button variant="ghost" asChild><Link href={`/bookings/${id}`}><ChevronLeft className="mr-1 h-4 w-4" />Back</Link></Button><div><h1 className="text-xl font-semibold">Record return</h1><p className="text-sm text-muted-foreground">{booking.booking_number} · {booking.customer?.name}</p></div></div>
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Package className="h-5 w-5 text-primary" />Returned quantities</CardTitle></CardHeader><CardContent className="space-y-4">
        {booking.booking_items.map((item) => {
          const remaining = Math.max(0, Number(item.picked_up_quantity || item.quantity) - Number(item.returned_quantity || 0))
          const line = lines[item.id]
          const itemRecord = Array.isArray(item.item) ? item.item[0] : item.item
          const isAssetTracked = itemRecord?.tracking_mode === 'asset'
          const activeAssets = (item.booking_item_assets ?? []).filter((entry) => !entry.released_at && entry.asset?.status === 'out')
          return <div key={item.id} className="space-y-3 rounded-2xl border bg-muted/20 p-4"><div className="flex justify-between"><div><p className="font-semibold">{item.item_name}</p><p className="text-xs text-muted-foreground">Size {item.size} · {remaining} currently out</p></div><div className="w-28"><Label className="text-xs">Returning now</Label><Input type="number" min={0} max={remaining} value={line?.quantity ?? 0} disabled={isAssetTracked} onChange={(event) => updateLine(item.id, { quantity: Math.min(remaining, Math.max(0, Number(event.target.value))) })} /></div></div>
            {isAssetTracked ? <div className="space-y-2 rounded-xl border bg-background p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Exact asset pieces</p>{activeAssets.length ? activeAssets.map((assignment) => { const asset = Array.isArray(assignment.asset) ? assignment.asset[0] : assignment.asset; const checked = line?.assetIds.includes(assignment.asset_id) ?? false; return <label key={assignment.asset_id} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-muted"><span className="font-mono text-sm">{asset?.asset_code || assignment.asset_id}</span><Checkbox checked={checked} onCheckedChange={(value) => { const nextIds = value ? [...(line?.assetIds ?? []), assignment.asset_id] : (line?.assetIds ?? []).filter((assetId) => assetId !== assignment.asset_id); updateLine(item.id, { assetIds: nextIds, quantity: nextIds.length, unavailableQuantity: Math.min(line?.unavailableQuantity ?? 0, nextIds.length) }) }} /></label> }) : <p className="text-sm text-amber-700">No issued asset records found. Check the pickup audit before returning.</p>}</div> : null}
            <div className="grid gap-3 sm:grid-cols-[1fr_140px]"><div><Label className="text-xs">Exception</Label><Select value={line?.reason || 'none'} onValueChange={(value) => updateLine(item.id, { reason: value === 'none' ? '' : value as 'damaged' | 'missing', unavailableQuantity: value === 'none' ? 0 : line.quantity })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No exception</SelectItem><SelectItem value="damaged">Damaged</SelectItem><SelectItem value="missing">Missing</SelectItem></SelectContent></Select></div>{line?.reason && <div><Label className="text-xs">Affected quantity</Label><Input type="number" min={1} max={line.quantity} value={line.unavailableQuantity} onChange={(event) => updateLine(item.id, { unavailableQuantity: Math.min(line.quantity, Math.max(0, Number(event.target.value))) })} /></div>}</div>
            {line?.reason && <Textarea value={line.notes} onChange={(event) => updateLine(item.id, { notes: event.target.value })} placeholder={`Describe the ${line.reason} item`} />}
          </div>
        })}
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="text-base">Deposit settlement</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-3 gap-3 rounded-2xl bg-muted/50 p-4 text-center"><Value label="Held" value={depositHeld} /><Value label="Deduction" value={deduction} /><Value label="Refund" value={refund} /></div><div className="grid gap-3 sm:grid-cols-2"><div><Label>Deduction amount</Label><Input type="number" min={0} max={depositHeld} value={deduction} onChange={(event) => setDeduction(Math.min(depositHeld, Math.max(0, Number(event.target.value))))} /></div><div><Label>Refund method</Label><Select value={refundMethod} onValueChange={setRefundMethod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="upi">UPI</SelectItem><SelectItem value="card">Card</SelectItem><SelectItem value="bank_transfer">Bank transfer</SelectItem></SelectContent></Select></div></div>{deduction > 0 && <Textarea value={deductionReason} onChange={(event) => setDeductionReason(event.target.value)} placeholder="Mandatory deduction reason" />}<Input value={refundReference} onChange={(event) => setRefundReference(event.target.value)} placeholder="Refund reference (optional)" /></CardContent></Card>
      <Button className="w-full" size="lg" disabled={submitting || totalReturning <= 0} onClick={submit}>{submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Recording…</> : <><CheckCircle2 className="mr-2 h-4 w-4" />Confirm return</>}</Button>
    </div>
  )
}

function Value({ label, value }: { label: string; value: number }) { return <div><p className="text-lg font-bold">₹{value.toLocaleString('en-IN')}</p><p className="text-xs text-muted-foreground">{label}</p></div> }
function Empty({ title, href }: { title: string; href: string }) { return <Card className="mx-auto max-w-xl"><CardContent className="py-14 text-center"><AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" /><p className="font-semibold">{title}</p><Button className="mt-4" variant="outline" asChild><Link href={href}>Go back</Link></Button></CardContent></Card> }
