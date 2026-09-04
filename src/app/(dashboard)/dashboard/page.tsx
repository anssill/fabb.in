import Link from 'next/link'
import { ArrowDownCircle, ArrowUpCircle, CalendarCheck, ChevronRight, CircleDollarSign, Clock3, Package, Plus, TriangleAlert, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: staff } = await supabase.from('staff').select('business_id, branch_id, name').eq('id', user.id).single()
  if (!staff?.business_id || !staff.branch_id) return null
  const db = supabase as any
  const today = new Date().toISOString().slice(0, 10)

  const [pickups, returns, functions, overdue, active, customers, payments, unavailable] = await Promise.all([
    db.from('bookings').select('id, booking_number, status, pickup_date, customer:customers(name)').eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).eq('pickup_date', today).not('status', 'in', '(cancelled,closed)'),
    db.from('bookings').select('id, booking_number, status, return_date, customer:customers(name)').eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).eq('return_date', today).in('status', ['picked_up', 'partially_returned']),
    db.from('bookings').select('id, booking_number, status, event_date, customer:customers(name)').eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).eq('event_date', today).not('status', 'eq', 'cancelled'),
    db.from('bookings').select('id, booking_number, return_date, customer:customers(name)').eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).lt('return_date', today).in('status', ['picked_up', 'partially_returned']),
    db.from('bookings').select('id', { count: 'exact', head: true }).eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).in('status', ['hold', 'confirmed', 'picked_up', 'partially_returned']),
    db.from('customers').select('id', { count: 'exact', head: true }).eq('business_id', staff.business_id),
    db.from('financial_entries').select('amount').eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).eq('entry_type', 'payment').gte('posted_at', `${today}T00:00:00`),
    db.from('inventory_unavailability').select('quantity, restored_quantity, reason').eq('business_id', staff.business_id).eq('branch_id', staff.branch_id),
  ])
  const collected = (payments.data ?? []).reduce((sum: number, entry: { amount: number }) => sum + Number(entry.amount), 0)
  const blocked = (unavailable.data ?? []).reduce((sum: number, entry: { quantity: number; restored_quantity: number }) => sum + Math.max(0, entry.quantity - entry.restored_quantity), 0)

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-sm text-muted-foreground">Welcome back, {staff.name || 'team'}</p><h1 className="text-2xl font-semibold tracking-tight">Rental command centre</h1></div><Button asChild><Link href="/bookings/new"><Plus className="mr-2 h-4 w-4" />New rental</Link></Button></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric icon={CalendarCheck} label="Active rentals" value={active.count ?? 0} /><Metric icon={CircleDollarSign} label="Collected today" value={`₹${collected.toLocaleString('en-IN')}`} /><Metric icon={Users} label="Customers" value={customers.count ?? 0} /><Metric icon={TriangleAlert} label="Damaged / missing" value={blocked} /></div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Schedule title="Pickups today" icon={ArrowUpCircle} rows={pickups.data ?? []} empty="No pickups scheduled" />
        <Schedule title="Returns today" icon={ArrowDownCircle} rows={returns.data ?? []} empty="No returns scheduled" />
        <Schedule title="Functions today" icon={CalendarCheck} rows={functions.data ?? []} empty="No functions today" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-base">Overdue with customer</CardTitle><p className="text-xs text-muted-foreground">Shown operationally; availability still follows the planned return date.</p></div><Badge variant={overdue.data?.length ? 'destructive' : 'secondary'}>{overdue.data?.length ?? 0}</Badge></CardHeader><CardContent>{overdue.data?.length ? <div className="divide-y">{overdue.data.map((booking: any) => <BookingRow key={booking.id} booking={booking} secondary={`Due ${booking.return_date}`} />)}</div> : <div className="py-8 text-center text-sm text-muted-foreground"><Clock3 className="mx-auto mb-2 h-8 w-8 opacity-30" />Nothing overdue.</div>}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Quick actions</CardTitle></CardHeader><CardContent className="grid gap-2">{[
          ['Create booking', '/bookings/new'], ['Check date availability', '/inventory'], ['Record customer', '/customers/new'], ['Open cash and payments', '/payments'], ['Review reports', '/reports'],
        ].map(([label, href]) => <Button key={href} variant="outline" className="justify-between" asChild><Link href={href}>{label}<ChevronRight className="h-4 w-4" /></Link></Button>)}</CardContent></Card>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: string | number }) { return <Card className="border-0 shadow-sm"><CardContent className="flex items-center gap-3 p-4"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><div><p className="text-xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></CardContent></Card> }
function Schedule({ title, icon: Icon, rows, empty }: { title: string; icon: typeof Package; rows: any[]; empty: string }) { return <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2 text-base"><Icon className="h-4 w-4 text-primary" />{title}</CardTitle><Badge variant="secondary">{rows.length}</Badge></CardHeader><CardContent>{rows.length ? <div className="divide-y">{rows.map((booking) => <BookingRow key={booking.id} booking={booking} secondary={booking.status} />)}</div> : <p className="py-8 text-center text-sm text-muted-foreground">{empty}</p>}</CardContent></Card> }
function BookingRow({ booking, secondary }: { booking: any; secondary: string }) { const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer; return <Link href={`/bookings/${booking.id}`} className="flex items-center justify-between rounded-lg py-3 hover:bg-muted/50"><div><p className="text-sm font-medium">{booking.booking_number}</p><p className="text-xs text-muted-foreground">{customer?.name || 'Customer'}</p></div><span className="text-xs capitalize text-muted-foreground">{secondary}</span></Link> }
