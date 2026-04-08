import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft, CalendarDays, User, Package, CreditCard,
  Clock, MapPin, Printer, Share2, MoreHorizontal, AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  draft: { color: 'bg-slate-100 text-slate-700', label: 'Draft' },
  booked: { color: 'bg-blue-100 text-blue-700', label: 'Booked' },
  out: { color: 'bg-amber-100 text-amber-700', label: 'Out' },
  returned: { color: 'bg-green-100 text-green-700', label: 'Returned' },
  completed: { color: 'bg-emerald-100 text-emerald-700', label: 'Completed' },
  cancelled: { color: 'bg-red-100 text-red-700', label: 'Cancelled' },
}

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      customer:customers(*),
      branch:branches(name, city),
      created_by_staff:staff!bookings_created_by_fkey(name),
      booking_items(
        id, quantity, unit_price, total_price, condition_out, condition_in,
        item:items(id, name, cover_image_url, sku),
        variant:item_variants(size, colour)
      ),
      booking_payments(id, type, amount, method, reference, notes, created_at, received_by_staff:staff(name))
    `)
    .eq('id', id)
    .single()

  if (!booking) notFound()

  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer
  const branch = Array.isArray(booking.branch) ? booking.branch[0] : booking.branch
  const createdBy = Array.isArray(booking.created_by_staff) ? booking.created_by_staff[0] : booking.created_by_staff
  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.draft

  const isOverdue = booking.status === 'out' && new Date(booking.return_date) < new Date()
  const rentalDays = Math.max(1, Math.ceil(
    (new Date(booking.return_date).getTime() - new Date(booking.pickup_date).getTime()) / (1000 * 60 * 60 * 24)
  ))

  const totalPaid = (booking.booking_payments || []).reduce(
    (sum: number, p: { amount: number }) => sum + Number(p.amount), 0
  )
  const balanceDue = Number(booking.total_amount) - totalPaid

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/bookings"><ChevronLeft className="w-4 h-4 mr-1" />Back</Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-900">{booking.booking_number}</h1>
              <Badge className={`${statusConfig.color} text-xs`}>{statusConfig.label}</Badge>
              {isOverdue && <Badge variant="destructive" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>}
            </div>
            <p className="text-sm text-slate-500">Created {new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} by {createdBy?.name || 'Staff'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Printer className="w-4 h-4 mr-1" />Print</Button>
          <Button variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1" />Share</Button>
          <Button variant="outline" size="sm"><MoreHorizontal className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{customer?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-500">{customer?.phone || ''} {customer?.email ? `· ${customer.email}` : ''}</p>
                  {customer?.address && <p className="text-xs text-slate-400 mt-1">{customer.address}</p>}
                </div>
                {customer?.id && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/customers/${customer.id}`}>View Profile</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                Items ({booking.booking_items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100">
                {(booking.booking_items || []).map((bi: Record<string, unknown>) => {
                  const item = Array.isArray(bi.item) ? bi.item[0] : bi.item
                  const variant = Array.isArray(bi.variant) ? bi.variant[0] : bi.variant
                  return (
                    <div key={bi.id as string} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center shrink-0">
                          {(item as Record<string, unknown>)?.cover_image_url ? (
                            <img src={(item as Record<string, unknown>).cover_image_url as string} alt="" className="w-full h-full object-cover rounded" />
                          ) : (
                            <Package className="w-6 h-6 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{(item as Record<string, unknown>)?.name as string || 'Item'}</p>
                          <p className="text-xs text-slate-500">
                            {(variant as Record<string, unknown>)?.size as string}{(variant as Record<string, unknown>)?.colour ? ` · ${(variant as Record<string, unknown>).colour}` : ''} · Qty: {bi.quantity as number}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-medium">₹{Number(bi.total_price).toLocaleString('en-IN')}</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Payment History
                </CardTitle>
                <Button variant="outline" size="sm">+ Record Payment</Button>
              </div>
            </CardHeader>
            <CardContent>
              {booking.booking_payments && booking.booking_payments.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {booking.booking_payments.map((p: Record<string, unknown>) => {
                    const receivedBy = Array.isArray(p.received_by_staff) ? p.received_by_staff[0] : p.received_by_staff
                    return (
                      <div key={p.id as string} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium capitalize">{p.type as string}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(p.created_at as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            {' · '}{(p.method as string).toUpperCase()}
                            {receivedBy ? ` · by ${(receivedBy as Record<string, unknown>).name}` : ''}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-green-600">+₹{Number(p.amount).toLocaleString('en-IN')}</p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">No payments recorded</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Dates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-purple-50 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Event Date</p>
                  <p className="text-sm font-medium">{booking.event_date ? new Date(booking.event_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-green-50 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Pickup</p>
                  <p className="text-sm font-medium">{booking.pickup_date ? new Date(booking.pickup_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-orange-50 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Return</p>
                  <p className="text-sm font-medium">{booking.return_date ? new Date(booking.return_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '-'}</p>
                </div>
              </div>
              <div className="p-2 bg-slate-50 rounded text-center">
                <p className="text-xs text-slate-500">{rentalDays} day{rentalDays !== 1 ? 's' : ''} rental</p>
              </div>
              {branch && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <MapPin className="w-3 h-3" />
                  {branch.name} · {branch.city}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span>₹{Number(booking.subtotal).toLocaleString('en-IN')}</span>
              </div>
              {Number(booking.discount_amount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-₹{Number(booking.discount_amount).toLocaleString('en-IN')}</span>
                </div>
              )}
              {Number(booking.delivery_fee) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Delivery</span>
                  <span>₹{Number(booking.delivery_fee).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold border-t pt-2">
                <span>Total</span>
                <span>₹{Number(booking.total_amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Paid</span>
                <span className="text-green-600">₹{totalPaid.toLocaleString('en-IN')}</span>
              </div>
              <div className={`flex justify-between text-sm font-semibold pt-1 ${balanceDue > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                <span>Balance Due</span>
                <span>₹{balanceDue.toLocaleString('en-IN')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-3 space-y-2">
              {booking.status === 'booked' && (
                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white" size="sm">
                  Mark as Picked Up
                </Button>
              )}
              {booking.status === 'out' && (
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white" size="sm">
                  Mark as Returned
                </Button>
              )}
              {booking.status === 'returned' && (
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
                  Complete Booking
                </Button>
              )}
              {['booked', 'draft'].includes(booking.status) && (
                <Button variant="outline" className="w-full text-red-600" size="sm">
                  Cancel Booking
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {booking.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{booking.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
