import Link from 'next/link'
import { ChevronLeft, ClipboardCheck, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { startStocktake } from './stocktake-actions'

export default async function StocktakesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: staff } = await supabase.from('staff').select('business_id, branch_id').eq('id', user.id).single()
  if (!staff?.business_id || !staff.branch_id) return null
  const db = supabase as any
  const { data = [] } = await db.from('stocktakes').select('id, status, blind_count, started_at, approved_at, notes, stocktake_lines(id, expected_quantity, counted_quantity)').eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).order('started_at', { ascending: false })
  return <div className="mx-auto max-w-5xl space-y-5">
    <div className="flex items-center gap-3"><Button variant="ghost" asChild><Link href="/inventory"><ChevronLeft className="mr-1 h-4 w-4" />Inventory</Link></Button><div><h1 className="text-2xl font-semibold">Stocktakes</h1><p className="text-sm text-muted-foreground">Blind branch counts, variance review and audited adjustments.</p></div></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Plus className="h-4 w-4 text-primary" />Start a count</CardTitle></CardHeader><CardContent><form action={startStocktake} className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="flex-1 space-y-1.5"><Label htmlFor="stocktake-note">Count note</Label><Input id="stocktake-note" name="note" placeholder="Example: September full branch count" /></div><Button type="submit"><ClipboardCheck className="mr-2 h-4 w-4" />Start blind count</Button></form></CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-4 w-4 text-primary" />Count sessions</CardTitle></CardHeader><CardContent>{data.length ? <div className="divide-y">{data.map((stocktake: any) => { const counted = stocktake.stocktake_lines?.filter((line: any) => line.counted_quantity != null).length ?? 0; const total = stocktake.stocktake_lines?.length ?? 0; return <Link href={`/inventory/stocktakes/${stocktake.id}`} key={stocktake.id} className="flex items-center justify-between rounded-lg py-4 hover:bg-muted/50"><div><p className="font-medium">Count {String(stocktake.id).slice(0, 8).toUpperCase()}</p><p className="text-xs text-muted-foreground">{new Date(stocktake.started_at).toLocaleString('en-IN')} · {counted}/{total} sizes counted</p></div><Badge className="capitalize" variant="outline">{stocktake.status}</Badge></Link> })}</div> : <p className="py-12 text-center text-sm text-muted-foreground">No stocktake sessions yet.</p>}</CardContent></Card>
  </div>
}
