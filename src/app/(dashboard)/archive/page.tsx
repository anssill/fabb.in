import { Archive, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default async function ArchivePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return null
  const { data: staff } = await supabase.from('staff').select('business_id').eq('id', user.id).single(); if (!staff?.business_id) return null
  const db = supabase as any
  let query = db.from('legacy_bookings_archive').select('*').eq('business_id', staff.business_id).order('pickup_date', { ascending: false }).limit(100)
  if (q.trim()) query = query.or(`booking_number.ilike.%${q.trim()}%,customer_name.ilike.%${q.trim()}%`)
  const { data = [] } = await query
  return <div className="mx-auto max-w-6xl space-y-5"><div><h1 className="text-2xl font-semibold">Legacy archive</h1><p className="text-sm text-muted-foreground">Read-only historical bookings and financial snapshots retained for lookup.</p></div><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Archive className="h-4 w-4 text-primary" />Historical bookings</CardTitle></CardHeader><CardContent className="space-y-4"><form className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input name="q" defaultValue={q} className="pl-10" placeholder="Booking number or customer" /></div><Button type="submit">Search</Button></form>{data.length ? <div className="overflow-x-auto rounded-xl border"><table className="w-full text-sm"><thead className="bg-muted/60 text-left text-xs text-muted-foreground"><tr><th className="p-3">Booking</th><th className="p-3">Customer</th><th className="p-3">Rental period</th><th className="p-3">Status</th><th className="p-3 text-right">Total / paid</th></tr></thead><tbody className="divide-y">{data.map((row: any) => <tr key={row.id}><td className="p-3 font-medium">{row.booking_number || String(row.id).slice(0, 8)}</td><td className="p-3">{row.customer_name || '—'}</td><td className="p-3">{row.pickup_date || '—'} → {row.return_date || '—'}</td><td className="p-3 capitalize">{row.status || 'archived'}</td><td className="p-3 text-right">₹{Number(row.total_amount || 0).toLocaleString('en-IN')} / ₹{Number(row.amount_paid || 0).toLocaleString('en-IN')}</td></tr>)}</tbody></table></div> : <p className="py-12 text-center text-sm text-muted-foreground">No archived bookings found.</p>}<p className="text-xs text-muted-foreground">Archive records cannot be edited, returned or financially changed.</p></CardContent></Card></div>
}
