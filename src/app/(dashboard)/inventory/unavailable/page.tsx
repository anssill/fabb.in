import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { AlertTriangle, ChevronLeft, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default async function UnavailableStockPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: staff } = await supabase.from('staff').select('business_id, branch_id').eq('id', user.id).single()
  if (!staff?.business_id || !staff.branch_id) return null
  const db = supabase as any
  const { data = [] } = await db.from('inventory_unavailability').select('id, reason, quantity, restored_quantity, notes, recorded_at, item:items(name, sku), variant:item_variants(size), booking_item:booking_items(booking_id)').eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).order('recorded_at', { ascending: false })
  const open = data.filter((row: any) => Number(row.restored_quantity) < Number(row.quantity))

  async function restore(formData: FormData) {
    'use server'
    const client = await createClient()
    const id = String(formData.get('id'))
    const quantity = Number(formData.get('quantity'))
    const note = String(formData.get('note') || '')
    const rpc = client.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
    const { error } = await rpc('restore_unavailable_stock', { p_unavailability_id: id, p_quantity: quantity, p_note: note || null })
    if (error) throw new Error(error.message)
    revalidatePath('/inventory/unavailable'); revalidatePath('/inventory')
  }

  return <div className="mx-auto max-w-5xl space-y-5"><div className="flex items-center gap-3"><Button variant="ghost" asChild><Link href="/inventory"><ChevronLeft className="mr-1 h-4 w-4" />Inventory</Link></Button><div><h1 className="text-2xl font-semibold">Damaged and missing stock</h1><p className="text-sm text-muted-foreground">Open quantities remain unavailable until restored here.</p></div></div>
    <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-amber-500" />Open exceptions</CardTitle><span className="text-sm text-muted-foreground">{open.length} records</span></CardHeader><CardContent>{open.length ? <div className="space-y-3">{open.map((row: any) => { const item = Array.isArray(row.item) ? row.item[0] : row.item; const variant = Array.isArray(row.variant) ? row.variant[0] : row.variant; const remaining = Number(row.quantity) - Number(row.restored_quantity); return <div key={row.id} className="rounded-2xl border p-4"><div className="mb-3 flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{item?.name || 'Rental item'} · {variant?.size || 'Size'}</p><p className="text-xs text-muted-foreground">{item?.sku || 'No SKU'} · {row.reason} · recorded {new Date(row.recorded_at).toLocaleDateString('en-IN')}</p>{row.notes && <p className="mt-1 text-sm text-muted-foreground">{row.notes}</p>}</div><strong className="text-amber-700">{remaining} unavailable</strong></div><form action={restore} className="grid gap-2 sm:grid-cols-[100px_1fr_auto]"><input type="hidden" name="id" value={row.id} /><Input name="quantity" type="number" min={1} max={remaining} defaultValue={remaining} required /><Input name="note" placeholder="Restoration note (optional)" /><Button><RotateCcw className="mr-2 h-4 w-4" />Restore</Button></form></div>})}</div> : <p className="py-12 text-center text-sm text-muted-foreground">No damaged or missing stock.</p>}</CardContent></Card></div>
}
