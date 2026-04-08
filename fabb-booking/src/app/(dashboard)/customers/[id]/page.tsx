import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChevronLeft, User, Phone, Mail, MapPin, CreditCard, CalendarCheck, IndianRupee, Edit, AlertTriangle, Shield, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: customer } = await supabase.from('customers').select('*').eq('id', id).single()
  if (!customer) notFound()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, booking_number, status, pickup_date, return_date, total_amount, balance_due')
    .eq('customer_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  const initials = customer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild><Link href="/customers"><ChevronLeft className="w-4 h-4 mr-1" />Back</Link></Button>
          <h1 className="text-xl font-semibold text-slate-900">Customer Profile</h1>
        </div>
        <Button variant="outline" size="sm"><Edit className="w-4 h-4 mr-1" />Edit</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16"><AvatarFallback className="text-lg bg-violet-100 text-violet-700">{initials}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{customer.name}</h2>
                    {customer.blacklisted && <Badge variant="destructive" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1" />Blacklisted</Badge>}
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-slate-600 flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" />{customer.phone}</p>
                    {customer.email && <p className="text-sm text-slate-600 flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" />{customer.email}</p>}
                    {customer.address && <p className="text-sm text-slate-600 flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" />{customer.address}</p>}
                    {customer.id_type && <p className="text-sm text-slate-600 flex items-center gap-2"><Shield className="w-4 h-4 text-slate-400" />{customer.id_type}: {customer.id_number}</p>}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Customer since {new Date(customer.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2"><CalendarCheck className="w-4 h-4 text-blue-600" />Booking History ({bookings?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {bookings && bookings.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {bookings.map((b) => (
                    <Link key={b.id} href={`/bookings/${b.id}`} className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded transition-colors">
                      <div>
                        <p className="text-sm font-medium">{b.booking_number}</p>
                        <p className="text-xs text-slate-500">{b.pickup_date ? new Date(b.pickup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''} → {b.return_date ? new Date(b.return_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-medium">₹{Number(b.total_amount).toLocaleString('en-IN')}</p>
                        <Badge variant="outline" className="text-xs capitalize">{b.status}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-400 text-center py-6">No bookings yet</p>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between"><span className="text-sm text-slate-600">Bookings</span><span className="text-lg font-semibold">{customer.total_bookings || 0}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-slate-600">Total Spent</span><span className="text-lg font-semibold">₹{Number(customer.total_spent || 0).toLocaleString('en-IN')}</span></div>
              {Number(customer.outstanding_balance) > 0 && <div className="flex items-center justify-between"><span className="text-sm text-slate-600">Outstanding</span><span className="text-lg font-semibold text-amber-600">₹{Number(customer.outstanding_balance).toLocaleString('en-IN')}</span></div>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 space-y-2">
              <Button className="w-full bg-blue-600 hover:bg-blue-700" size="sm" asChild><Link href="/bookings/new">New Booking</Link></Button>
              <Button variant="outline" className="w-full" size="sm" asChild><a href={`https://wa.me/91${customer.phone}`} target="_blank" rel="noopener noreferrer">WhatsApp</a></Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
