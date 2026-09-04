import Link from 'next/link'
import { ArrowLeftRight, ChevronLeft, Send, Truck, PackageCheck, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTransfer, advanceTransfer } from './transfer-actions'

export default async function TransfersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: staff } = await supabase.from('staff').select('business_id, branch_id').eq('id', user.id).single()
  if (!staff?.business_id || !staff.branch_id) return null
  const db = supabase as any
  const [{ data = [] }, { data: branches = [] }, { data: variants = [] }] = await Promise.all([
    db.from('inventory_transfers').select('id, transfer_number, status, source_branch_id, destination_branch_id, requested_at, dispatched_at, received_at, source:branches!inventory_transfers_source_branch_id_fkey(name), destination:branches!inventory_transfers_destination_branch_id_fkey(name), inventory_transfer_lines(id, quantity, received_quantity, discrepancy_note, item:items(name), variant:item_variants(size))').eq('business_id', staff.business_id).or(`source_branch_id.eq.${staff.branch_id},destination_branch_id.eq.${staff.branch_id}`).order('requested_at', { ascending: false }),
    supabase.from('branches').select('id,name').eq('business_id', staff.business_id).eq('status', 'active').neq('id', staff.branch_id).order('name'),
    db.from('item_variants').select('id,size,total_stock,item:items(name,sku)').eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).is('archived_at', null).gt('total_stock', 0).order('size'),
  ])

  return <div className="mx-auto max-w-6xl space-y-5">
    <div className="flex items-center gap-3"><Button variant="ghost" asChild><Link href="/inventory"><ChevronLeft className="mr-1 h-4 w-4" />Inventory</Link></Button><div><h1 className="text-2xl font-semibold">Branch transfers</h1><p className="text-sm text-muted-foreground">Request, dispatch, track and receive branch-owned size stock.</p></div></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Send className="h-4 w-4 text-primary" />New transfer request</CardTitle></CardHeader><CardContent><form action={createTransfer} className="grid gap-3 md:grid-cols-[1.2fr_1fr_120px_1fr_auto] md:items-end"><div className="space-y-1.5"><Label htmlFor="transfer-variant">Product / size</Label><select id="transfer-variant" name="item_variant_id" required className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="">Choose stock</option>{(variants ?? []).map((variant: any) => { const item = Array.isArray(variant.item) ? variant.item[0] : variant.item; return <option key={variant.id} value={variant.id}>{item?.name} · {variant.size} · {variant.total_stock} physical</option> })}</select></div><div className="space-y-1.5"><Label htmlFor="transfer-destination">Destination</Label><select id="transfer-destination" name="destination_branch_id" required className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="">Choose branch</option>{(branches ?? []).map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></div><div className="space-y-1.5"><Label htmlFor="transfer-qty">Quantity</Label><Input id="transfer-qty" name="quantity" type="number" min={1} defaultValue={1} required /></div><div className="space-y-1.5"><Label htmlFor="transfer-note">Note</Label><Input id="transfer-note" name="note" placeholder="Optional" /></div><Button type="submit">Request</Button></form></CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ArrowLeftRight className="h-4 w-4 text-primary" />Transfer ledger</CardTitle></CardHeader><CardContent>{data.length ? <div className="divide-y">{data.map((transfer: any) => {
      const source = Array.isArray(transfer.source) ? transfer.source[0] : transfer.source
      const destination = Array.isArray(transfer.destination) ? transfer.destination[0] : transfer.destination
      const line = transfer.inventory_transfer_lines?.[0]
      const item = Array.isArray(line?.item) ? line.item[0] : line?.item
      const variant = Array.isArray(line?.variant) ? line.variant[0] : line?.variant
      const isSource = transfer.source_branch_id === staff.branch_id
      const isDestination = transfer.destination_branch_id === staff.branch_id
      return <div key={transfer.id} className="space-y-3 py-4"><div className="flex flex-col justify-between gap-2 sm:flex-row"><div><p className="font-semibold">{transfer.transfer_number}</p><p className="text-sm text-muted-foreground">{source?.name} → {destination?.name}</p><p className="text-xs text-muted-foreground">{item?.name} · {variant?.size} · requested {line?.quantity ?? 0} · received {line?.received_quantity ?? 0}</p>{line?.discrepancy_note ? <p className="mt-1 text-xs text-amber-700">Discrepancy: {line.discrepancy_note}</p> : null}</div><Badge variant="outline" className="h-fit capitalize">{String(transfer.status).replaceAll('_', ' ')}</Badge></div><div className="flex flex-wrap gap-2">{isSource && transfer.status === 'requested' ? <><form action={advanceTransfer.bind(null, transfer.id, 'dispatch')}><Button size="sm"><Send className="mr-1 h-3.5 w-3.5" />Dispatch</Button></form><form action={advanceTransfer.bind(null, transfer.id, 'cancel')}><Button size="sm" variant="outline"><X className="mr-1 h-3.5 w-3.5" />Cancel</Button></form></> : null}{isSource && transfer.status === 'dispatched' ? <form action={advanceTransfer.bind(null, transfer.id, 'in_transit')}><Button size="sm"><Truck className="mr-1 h-3.5 w-3.5" />Mark in transit</Button></form> : null}{isDestination && ['dispatched', 'in_transit'].includes(transfer.status) ? <form action={advanceTransfer.bind(null, transfer.id, 'receive')} className="flex items-end gap-2"><div><Label className="text-xs" htmlFor={`receive-${transfer.id}`}>Received quantity</Label><Input id={`receive-${transfer.id}`} name="received_quantity" className="h-8 w-24" type="number" min={0} max={line?.quantity ?? 0} defaultValue={line?.quantity ?? 0} /></div><Input name="note" className="h-8 w-48" placeholder="Reason if different" /><Button size="sm"><PackageCheck className="mr-1 h-3.5 w-3.5" />Receive</Button></form> : null}</div></div>
    })}</div> : <p className="py-12 text-center text-sm text-muted-foreground">No transfers for this branch yet.</p>}</CardContent></Card>
  </div>
}
