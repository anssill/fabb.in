import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Search, Filter, CalendarCheck } from 'lucide-react'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  booked: 'bg-blue-100 text-blue-700',
  out: 'bg-amber-100 text-amber-700',
  returned: 'bg-green-100 text-green-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default async function BookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: staff } = await supabase.from('staff').select('business_id, branch_id').eq('id', user.id).single()
  if (!staff) return null

  const { data: bookings, count } = await supabase
    .from('bookings')
    .select(`
      id, booking_number, status, pickup_date, return_date, total_amount, created_at,
      customer:customers(id, name, phone)
    `, { count: 'exact' })
    .eq('business_id', staff.business_id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Bookings</h1>
          <p className="text-sm text-slate-500">{count ?? 0} total bookings</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" asChild>
          <Link href="/bookings/new">
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search by booking ID, customer name..." className="pl-10 h-9" />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
          <div className="flex gap-2 mt-3">
            {['all', 'booked', 'out', 'returned', 'completed', 'cancelled'].map((status) => (
              <Button
                key={status}
                variant={status === 'all' ? 'default' : 'outline'}
                size="sm"
                className="text-xs capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card>
        <CardContent className="p-0">
          {bookings && bookings.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {bookings.map((booking) => {
                const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer
                return (
                  <Link
                    key={booking.id}
                    href={`/bookings/${booking.id}`}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <CalendarCheck className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{booking.booking_number}</p>
                        <p className="text-xs text-slate-500">{customer?.name || 'Unknown'} · {customer?.phone || ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-sm font-medium text-slate-900">₹{booking.total_amount?.toLocaleString('en-IN') || '0'}</p>
                        <p className="text-xs text-slate-500">
                          {booking.pickup_date ? new Date(booking.pickup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''} → {booking.return_date ? new Date(booking.return_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                        </p>
                      </div>
                      <Badge className={`text-xs ${STATUS_COLORS[booking.status] || ''}`}>
                        {booking.status}
                      </Badge>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <CalendarCheck className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900">No bookings yet</h3>
              <p className="text-sm text-slate-500 mt-1">Create your first booking to get started.</p>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700" asChild>
                <Link href="/bookings/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Booking
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
