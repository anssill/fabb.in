import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { isValidUuid } from '@/lib/api-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChevronLeft, User, Package, CreditCard, Clock, AlertTriangle,
  CalendarDays, IndianRupee, MessageSquare, Plus, CheckCircle2,
  Shield, Camera
} from 'lucide-react'
import Link from 'next/link'
import { BookingActions } from './components/BookingActions'
import { DownloadInvoiceButton } from './components/DownloadInvoiceButton'
import { BookingSmsButton } from './components/BookingSmsButton'
import { calculateBillableRentalDays } from '@/lib/booking-utils'

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  draft:     { color: 'bg-slate-100 text-slate-700',   label: 'Draft' },
  quote:     { color: 'bg-slate-100 text-slate-700',   label: 'Quote' },
  hold:      { color: 'bg-amber-100 text-amber-700',   label: 'Hold' },
  confirmed: { color: 'bg-blue-100 text-blue-700',     label: 'Confirmed' },
  picked_up: { color: 'bg-violet-100 text-violet-700', label: 'Picked up / Out' },
  partially_returned: { color: 'bg-cyan-100 text-cyan-700', label: 'Partially returned' },
  returned:  { color: 'bg-green-100 text-green-700',   label: 'Returned' },
  closed:    { color: 'bg-emerald-100 text-emerald-700', label: 'Closed' },
  cancelled: { color: 'bg-red-100 text-red-700',       label: 'Cancelled' },
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  advance: 'Advance', balance: 'Balance', deposit: 'Deposit',
  deposit_refund: 'Deposit Refund', penalty: 'Penalty', refund: 'Refund',
}

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isValidUuid(id)) {
    notFound()
  }

  const supabase = await createClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      customer:customers(*),
      branch:branches(name, city),
      created_by_staff:staff!bookings_created_by_fkey(name),
      booking_items(
        id, quantity, picked_up_quantity, returned_quantity, price, rental_days, subtotal, item_name, size,
        item:items(id, name, cover_image_url, sku),
        variant:item_variants(size)
      ),
      booking_payments(
        id, type, amount, method, reference_number, notes, created_at, is_voided,
        collected_by:staff!booking_payments_collected_by_fkey(name)
      )
    `)
    .eq('id', id)
    .single()

  // SMS log for this booking — fields: template_id, provider_response, created_at
  const { data: smsLogs } = await supabase
    .from('sms_log')
    .select('id, template_id, phone, status, provider_response, created_at')
    .eq('booking_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!booking) notFound()

  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer
  const branch = Array.isArray(booking.branch) ? booking.branch[0] : booking.branch
  const createdBy = Array.isArray(booking.created_by_staff) ? booking.created_by_staff[0] : booking.created_by_staff
  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.draft

  const isOverdue = ['picked_up', 'partially_returned'].includes(booking.status) && new Date(booking.return_date) < new Date()
  const rentalDays = (booking as any).rental_days ?? calculateBillableRentalDays(booking.pickup_date, booking.return_date)

  const payments = ((booking.booking_payments || []) as any[]).filter((p: any) => !p.is_voided)
  const rentalPaid = payments.filter((payment: any) => ['advance', 'balance'].includes(payment.type)).reduce((sum: number, payment: any) => sum + Number(payment.amount), 0)
    - payments.filter((payment: any) => payment.type === 'refund').reduce((sum: number, payment: any) => sum + Number(payment.amount), 0)
  const totalCollected = payments.filter((payment: any) => !['deposit_refund', 'refund'].includes(payment.type)).reduce((sum: number, payment: any) => sum + Number(payment.amount), 0)
  const balanceDue = Math.max(0, Number(booking.total_amount ?? 0) - rentalPaid)

  const statusSteps = ['hold', 'confirmed', 'picked_up', 'partially_returned', 'returned', 'closed']
  const currentStepIdx = statusSteps.indexOf(booking.status)

  // suppress unused variable warning
  void branch

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/bookings"><ChevronLeft className="w-4 h-4 mr-1" />Back</Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-slate-900 font-mono">{booking.booking_number}</h1>
              <Badge className={`${statusConfig.color} text-xs`}>{statusConfig.label}</Badge>
              {isOverdue && <Badge variant="destructive" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>}
            </div>
            <p className="text-sm text-slate-500">
              Created {new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} by {(createdBy as any)?.name || 'Staff'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <BookingSmsButton
            phone={(customer as any)?.phone || ''}
            customerName={(customer as any)?.name || 'Customer'}
            bookingNumber={booking.booking_number}
            bookingId={booking.id}
            customerId={(customer as any)?.id}
            pickupDate={booking.pickup_date}
            returnDate={booking.return_date}
          />
          <DownloadInvoiceButton booking={booking} />
          <BookingActions booking={{
            id: booking.id,
            status: booking.status,
            balance_due: Number(booking.balance_due ?? balanceDue),
            deposit_amount: Number((booking as any).deposit_amount ?? 0),
            booking_items: ((booking.booking_items || []) as any[]).map((bi: any) => ({
              id: bi.id,
              item_name: bi.item_name || (Array.isArray(bi.item) ? bi.item[0]?.name : bi.item?.name) || '',
              size: bi.size || '',
              quantity: bi.quantity || 1,
            })),
          }} />
        </div>
      </div>

      {/* Status Progress */}
      {!['cancelled', 'draft'].includes(booking.status) && (
        <div className="flex items-center gap-0 bg-white border border-slate-200 rounded-lg p-4">
          {statusSteps.map((step, idx) => (
            <div key={step} className="flex items-center flex-1">
              <div className={`flex items-center gap-1.5 ${idx <= currentStepIdx ? 'text-blue-600' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${idx < currentStepIdx ? 'bg-blue-600 text-white' :
                    idx === currentStepIdx ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300' :
                    'bg-slate-100 text-slate-400'}`}>
                  {idx < currentStepIdx ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span className="text-xs font-medium capitalize hidden sm:block">{step}</span>
              </div>
              {idx < statusSteps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${idx < currentStepIdx ? 'bg-blue-400' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Main content with tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
        </TabsList>

        {/* TAB 1 — OVERVIEW */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left col */}
            <div className="lg:col-span-2 space-y-4">
              {/* Customer */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />Customer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{(customer as any)?.name || '—'}</p>
                      <p className="text-sm text-slate-500">{(customer as any)?.phone || ''}</p>
                    </div>
                    {(customer as any)?.id && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/customers/${(customer as any).id}`}>View Profile</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Dates */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-blue-600" />Rental Period
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Pickup</p>
                      <p className="text-sm font-semibold">{booking.pickup_date ? new Date(booking.pickup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Return</p>
                      <p className="text-sm font-semibold">{booking.return_date ? new Date(booking.return_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Duration</p>
                      <p className="text-sm font-semibold">{rentalDays} day{rentalDays !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {(booking as any).occasion && (
                    <p className="text-sm text-slate-600 mt-3">Occasion: <span className="font-medium">{(booking as any).occasion}</span></p>
                  )}
                  {(booking as any).booking_source && (
                    <p className="text-sm text-slate-600 mt-1">Source: <span className="font-medium capitalize">{(booking as any).booking_source.replace('_', ' ')}</span></p>
                  )}
                </CardContent>
              </Card>

              {/* Items summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />Items ({(booking.booking_items as any[])?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {((booking.booking_items || []) as any[]).map((bi: any) => {
                      const item = Array.isArray(bi.item) ? bi.item[0] : bi.item
                      const subtotal = bi.subtotal ?? (Number(bi.price ?? 0) * Number(bi.quantity ?? 1) * rentalDays)
                      return (
                        <div key={bi.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-2">
                            {item?.cover_image_url ? (
                              <img src={item.cover_image_url} alt="" className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
                                <Package className="w-4 h-4 text-slate-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{bi.item_name || item?.name || '—'}</p>
                              <p className="text-xs text-slate-500">{bi.size} × {bi.quantity} · ₹{bi.price}/day</p>
                            </div>
                          </div>
                          <p className="font-semibold">₹{Number(subtotal).toLocaleString('en-IN')}</p>
                        </div>
                      )
                    })}
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t border-slate-200">
                      <span>Total</span>
                      <span>₹{Number(booking.total_amount ?? 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right col */}
            <div className="space-y-4">
              {/* Payment Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-blue-600" />Payment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Amount</span>
                    <span className="font-semibold">₹{Number(booking.total_amount ?? 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Advance Paid</span>
                    <span className="text-green-600 font-medium">₹{Number((booking as any).advance_amount ?? 0).toLocaleString('en-IN')}</span>
                  </div>
                  {Number((booking as any).deposit_amount ?? 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Deposit Held</span>
                      <span className="text-blue-600 font-medium">₹{Number((booking as any).deposit_amount ?? 0).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-100 pt-2 flex justify-between text-sm font-semibold">
                    <span className={balanceDue > 0 ? 'text-red-600' : 'text-green-700'}>
                      {balanceDue > 0 ? 'Balance Due' : 'Fully Paid'}
                    </span>
                    <span className={balanceDue > 0 ? 'text-red-600' : 'text-green-700'}>
                      {balanceDue > 0 ? `₹${balanceDue.toLocaleString('en-IN')}` : '✓'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />Booking Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Booking ID</span>
                    <span className="font-mono text-xs font-medium">{booking.id.slice(0, 8)}…</span>
                  </div>
                  {(booking as any).physical_bill_number && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Physical bill</span>
                      <span className="font-mono text-xs font-medium">{(booking as any).physical_bill_number}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Created by</span>
                    <span className="font-medium">{(createdBy as any)?.name || '—'}</span>
                  </div>
                  {booking.notes && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">Notes</p>
                      <p className="text-sm text-slate-700">{booking.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2 — PAYMENTS */}
        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />Payment History
                </CardTitle>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-1" />Add Payment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {((booking.booking_payments || []) as any[]).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 border-b">
                        <th className="pb-2 font-medium">Date</th>
                        <th className="pb-2 font-medium">Type</th>
                        <th className="pb-2 font-medium">Method</th>
                        <th className="pb-2 font-medium">Reference</th>
                        <th className="pb-2 font-medium text-right">Amount</th>
                        <th className="pb-2 font-medium">By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {((booking.booking_payments || []) as any[]).map((p: any) => {
                        const collector = Array.isArray(p.collected_by) ? p.collected_by[0] : p.collected_by
                        return (
                          <tr key={p.id} className={p.is_voided ? 'opacity-50' : ''}>
                            <td className="py-2 text-xs text-slate-500">
                              {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </td>
                            <td className="py-2">
                              <Badge variant="outline" className="text-xs capitalize">
                                {p.is_voided ? '⊘ ' : ''}{PAYMENT_TYPE_LABELS[p.type] || p.type}
                              </Badge>
                            </td>
                            <td className="py-2 capitalize text-slate-600">{p.method?.replace('_', ' ')}</td>
                            <td className="py-2 text-xs text-slate-500 font-mono">{p.reference_number || '—'}</td>
                            <td className="py-2 text-right font-semibold">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                            <td className="py-2 text-xs text-slate-500">{collector?.name || '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">No payments recorded yet</p>
              )}
              {/* Summary */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">Total Collected</span>
                <span className="text-base font-bold text-slate-900">₹{totalCollected.toLocaleString('en-IN')}</span>
              </div>
              {balanceDue > 0 && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm font-semibold text-red-600">Balance Due</span>
                  <span className="text-base font-bold text-red-600">₹{balanceDue.toLocaleString('en-IN')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3 — ITEMS */}
        <TabsContent value="items" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Items in this Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {((booking.booking_items || []) as any[]).map((bi: any) => {
                  const item = Array.isArray(bi.item) ? bi.item[0] : bi.item
                  const subtotal = bi.subtotal ?? (Number(bi.price ?? 0) * Number(bi.quantity ?? 1) * rentalDays)
                  return (
                    <div key={bi.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                      {item?.cover_image_url ? (
                        <img src={item.cover_image_url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-slate-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{bi.item_name || item?.name}</p>
                        <p className="text-xs text-slate-500">Size: {bi.size} · Qty: {bi.quantity} · ₹{bi.price}/day × {bi.rental_days ?? rentalDays} days</p>
                        <p className="text-xs text-slate-600 mt-1">
                          Picked up: {bi.picked_up_quantity || 0} · Returned: {bi.returned_quantity || 0} · Out: {Math.max(0, (bi.picked_up_quantity || 0) - (bi.returned_quantity || 0))}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-slate-900 flex-shrink-0">₹{Number(subtotal).toLocaleString('en-IN')}</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4 — TIMELINE */}
        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />Booking Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Booking Created</p>
                    <p className="text-xs text-slate-500">
                      {new Date(booking.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {(createdBy as any)?.name ? ` by ${(createdBy as any).name}` : ''}
                    </p>
                  </div>
                </div>
                {(booking as any).pickup_completed_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Pickup Completed</p>
                      <p className="text-xs text-slate-500">{new Date((booking as any).pickup_completed_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                )}
                {(booking as any).return_completed_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Return Completed</p>
                      <p className="text-xs text-slate-500">{new Date((booking as any).return_completed_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                )}
                {(booking as any).closed_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Booking Closed</p>
                      <p className="text-xs text-slate-500">{new Date((booking as any).closed_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5 — DOCUMENTS */}
        <TabsContent value="documents" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ID Proof */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />Identity Proof
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(customer as any)?.id_proof_url ? (
                  <div className="relative group rounded-lg overflow-hidden border border-slate-200">
                    <img src={(customer as any).id_proof_url} alt="ID Proof" className="w-full aspect-video object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="secondary" size="sm" asChild>
                        <a href={(customer as any).id_proof_url} target="_blank" rel="noopener noreferrer">View Full Image</a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <AlertTriangle className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">No ID proof uploaded</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pickup Photos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Package className="w-4 h-4 text-violet-600" />Pickup Documentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {booking.pickup_photos && Array.isArray(booking.pickup_photos) && booking.pickup_photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {booking.pickup_photos.map((photo: string, idx: number) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200">
                        <img src={photo} alt={`Pickup Photo ${idx + 1}`} className="w-full aspect-square object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Button variant="secondary" size="icon" className="h-8 w-8" asChild>
                            <a href={photo} target="_blank" rel="noopener noreferrer">
                              <span className="sr-only">View</span>
                              🔍
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <Camera className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">No pickup photos recorded</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 6 — SMS */}
        <TabsContent value="sms" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />SMS Log
                </CardTitle>
                <BookingSmsButton
                  phone={(customer as any)?.phone || ''}
                  customerName={(customer as any)?.name || 'Customer'}
                  bookingNumber={booking.booking_number}
                  bookingId={booking.id}
                  customerId={(customer as any)?.id}
                  pickupDate={booking.pickup_date}
                  returnDate={booking.return_date}
                />
              </div>
            </CardHeader>
            <CardContent>
              {smsLogs && smsLogs.length > 0 ? (
                <div className="space-y-3">
                  {smsLogs.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${log.status === 'sent' || log.status === 'delivered' ? 'bg-green-500' : log.status === 'failed' ? 'bg-red-500' : 'bg-amber-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-slate-900 capitalize">
                            {(log.template_id || 'sms').replace(/_/g, ' ')}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize
                            ${log.status === 'sent' || log.status === 'delivered' ? 'bg-green-100 text-green-700' :
                              log.status === 'failed' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'}`}>
                            {log.status || 'pending'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          To: {log.phone}
                        </p>
                        {log.provider_response && (log.provider_response as any)?.error && (
                          <p className="text-xs text-red-500 mt-0.5">{(log.provider_response as any).error}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(log.created_at).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">
                  No SMS messages sent for this booking yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
