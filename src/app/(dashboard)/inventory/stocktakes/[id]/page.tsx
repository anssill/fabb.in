import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ClipboardCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { isValidUuid } from '@/lib/api-utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { approveStocktake, saveCounts } from '../stocktake-actions'

export default async function StocktakeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isValidUuid(id)) notFound()
  const supabase = await createClient()
  const db = supabase as any
  const { data: stocktake } = await db.from('stocktakes').select('id,status,blind_count,started_at,approved_at,notes,stocktake_lines(id,expected_quantity,counted_quantity,note,variant:item_variants(size,item:items(name,sku)))').eq('id', id).single()
  if (!stocktake) notFound()
  const open = ['counting', 'review'].includes(stocktake.status)
  const complete = stocktake.stocktake_lines?.every((line: any) => line.counted_quantity != null)
  return <div className="mx-auto max-w-4xl space-y-5"><div className="flex items-center gap-3"><Button variant="ghost" asChild><Link href="/inventory/stocktakes"><ChevronLeft className="mr-1 h-4 w-4" />Stocktakes</Link></Button><div className="flex-1"><h1 className="text-2xl font-semibold">Count {id.slice(0, 8).toUpperCase()}</h1><p className="text-sm text-muted-foreground">Expected quantities stay hidden until the review stage.</p></div><Badge variant="outline" className="capitalize">{stocktake.status}</Badge></div><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-4 w-4 text-primary" />Size counts</CardTitle></CardHeader><CardContent><form action={saveCounts.bind(null, id)} className="space-y-4"><div className="divide-y rounded-xl border">{stocktake.stocktake_lines?.map((line: any) => { const variant = Array.isArray(line.variant) ? line.variant[0] : line.variant; const item = Array.isArray(variant?.item) ? variant.item[0] : variant?.item; return <div key={line.id} className="grid grid-cols-[1fr_110px] items-center gap-4 p-3"><div><p className="text-sm font-medium">{item?.name} · {variant?.size}</p><p className="text-xs text-muted-foreground">SKU {item?.sku || '—'}{stocktake.status === 'review' || stocktake.status === 'approved' ? ` · expected ${line.expected_quantity} · variance ${(line.counted_quantity ?? 0) - line.expected_quantity}` : ''}</p></div><Input name={`count:${line.id}`} type="number" min={0} required defaultValue={line.counted_quantity ?? ''} disabled={!open} aria-label={`Count ${item?.name} ${variant?.size}`} /></div> })}</div>{open ? <Button type="submit">Save counts and review</Button> : null}</form></CardContent></Card>{open && complete ? <Card><CardHeader><CardTitle className="text-base">Approve variances</CardTitle></CardHeader><CardContent><form action={approveStocktake.bind(null, id)} className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="flex-1 space-y-1.5"><Label htmlFor="approval-note">Approval note</Label><Input id="approval-note" name="note" placeholder="Optional variance explanation" /></div><Button type="submit">Approve adjustments</Button></form></CardContent></Card> : null}</div>
}
