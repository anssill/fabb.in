import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

// Page through every row so reports do not silently stop at the API row limit.
async function allRows(query: () => any): Promise<any[]> {
  const rows: any[] = []
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await query().range(offset, offset + 499)
    if (error) throw new Error('Dashboard data could not be loaded. Please retry.')
    rows.push(...data)
    if (data.length < 500) return rows
  }
}
const money = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
export async function DashboardOverview({ businessId, branchId, today }: { businessId: string; branchId: string; today: string }) {
  const db = await createClient() as any
  const start = `${Number(today.slice(0,4))-1}-${today.slice(5,7)}-01`
  const [bookings, payments, availability] = await Promise.all([
    allRows(() => db.from('bookings').select('id,booking_number,status,total_amount,balance_due,created_at,booking_items(item_id,item_name,quantity,line_total)').eq('business_id',businessId).eq('branch_id',branchId).order('id')),
    allRows(() => db.from('financial_entries').select('id,amount,entry_type,posted_at').eq('business_id',businessId).eq('branch_id',branchId).gte('posted_at',start).order('id')),
    db.rpc('get_rental_availability',{p_business_id:businessId,p_branch_id:branchId,p_from:today,p_to:today,p_item_id:null,p_requested_quantity:0}),
  ])
  if (availability.error) throw new Error('Stock availability could not be loaded. Please retry.')
  const currentMonth = today.slice(0,7)
  const current = bookings.filter(b => b.created_at.slice(0,7)===currentMonth && b.status!=='cancelled')
  const open = bookings.filter(b => b.status!=='cancelled' && Number(b.balance_due)>0)
  const available = (availability.data ?? []).reduce((n:number,v:any)=>n+Math.max(0,Number(v.available_quantity)),0)
  const physical = (availability.data ?? []).reduce((n:number,v:any)=>n+Number(v.physical_stock),0)
  const net = (rows:any[])=>rows.reduce((n,p)=>n+(['payment'].includes(p.entry_type)?Number(p.amount):['refund','reversal'].includes(p.entry_type)?-Number(p.amount):0),0)
  const popular = new Map<string,{name:string;quantity:number;amount:number}>()
  for (const b of current) for (const item of b.booking_items ?? []) {
    const row = popular.get(item.item_id) ?? {name:item.item_name,quantity:0,amount:0}
    row.quantity+=Number(item.quantity);row.amount+=Number(item.line_total);popular.set(item.item_id,row)
  }
  const months = Array.from({length:12},(_,i)=>{const d=new Date(`${today.slice(0,7)}-01T12:00:00Z`);d.setUTCMonth(d.getUTCMonth()-11+i);return d.toISOString().slice(0,7)})
  return <section className="space-y-5">
    <p className="text-sm text-muted-foreground">Current branch · This month and the last 12 months · Deposits excluded from collections</p>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[
      ['Booked value this month',money(current.reduce((n,b)=>n+Number(b.total_amount),0))],
      ['Net collections this month',money(net(payments.filter(p=>p.posted_at.slice(0,7)===currentMonth)))],
      ['Outstanding balances',money(open.reduce((n,b)=>n+Number(b.balance_due),0))],
      ['Available units today',`${available} / ${physical}`],
    ].map(([label,value])=><Card key={label}><CardContent className="p-4"><p className="text-xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card>)}</div>
    <Card><CardHeader><CardTitle>Monthly trends</CardTitle></CardHeader><CardContent className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left"><th className="py-2">Month</th><th>Bookings</th><th>Booked value</th><th>Net collections</th></tr></thead><tbody>{months.map(month=>{const rows=bookings.filter(b=>b.created_at.slice(0,7)===month && b.status!=='cancelled');return <tr className="border-t" key={month}><td className="py-2">{month}</td><td>{rows.length}</td><td>{money(rows.reduce((n,b)=>n+Number(b.total_amount),0))}</td><td>{money(net(payments.filter(p=>p.posted_at.slice(0,7)===month)))}</td></tr>})}</tbody></table></CardContent></Card>
    <div className="grid gap-5 lg:grid-cols-2"><Card><CardHeader><CardTitle>Popular items this month</CardTitle></CardHeader><CardContent>{[...popular.values()].sort((a,b)=>b.quantity-a.quantity).slice(0,10).map((v,i)=><div className="flex justify-between border-b py-2 text-sm" key={i}><span>{v.name} · {v.quantity} pcs</span><span>{money(v.amount)}</span></div>)}{!popular.size && <p className="text-sm text-muted-foreground">No bookings this month.</p>}</CardContent></Card>
    <Card><CardHeader><CardTitle>Largest outstanding balances</CardTitle></CardHeader><CardContent>{open.sort((a,b)=>Number(b.balance_due)-Number(a.balance_due)).slice(0,10).map(b=><Link className="flex justify-between border-b py-2 text-sm" href={`/bookings/${b.id}`} key={b.id}><span>{b.booking_number}</span><span>{money(Number(b.balance_due))}</span></Link>)}{!open.length && <p className="text-sm text-muted-foreground">No outstanding balances.</p>}</CardContent></Card></div>
    <Card><CardHeader><CardTitle>Booking status · All time</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-4">{['hold','confirmed','picked_up','partially_returned','returned','closed','cancelled'].map(status=><div key={status}><p className="text-xl font-bold">{bookings.filter(b=>b.status===status).length}</p><p className="text-xs capitalize">{status.replaceAll('_',' ')}</p></div>)}</CardContent></Card>
  </section>
}
