'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Printer,
  Package,
  RotateCcw,
  Plus,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { ReceiptPreview } from '@/components/bookings/ReceiptPreview'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft:      { label: 'Draft',     color: 'bg-zinc-200 text-zinc-700',                icon: Clock },
  confirmed:  { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700',          icon: CheckCircle2 },
  active:     { label: 'Active',    color: 'bg-blue-100 text-blue-700',                icon: Package },
  overdue:    { label: 'Overdue',   color: 'bg-red-100 text-red-700',                  icon: AlertTriangle },
  returned:   { label: 'Returned',  color: 'bg-zinc-100 text-zinc-600',                icon: RotateCcw },
  cancelled:  { label: 'Cancelled', color: 'bg-orange-100 text-orange-700',            icon: XCircle },
}

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  Cash:          'bg-emerald-50 text-emerald-700 border-emerald-200',
  UPI:           'bg-blue-50 text-blue-700 border-blue-200',
  'Bank Transfer': 'bg-purple-50 text-purple-700 border-purple-200',
  'Store Credit':  'bg-amber-50 text-amber-700 border-amber-200',
}

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [showReceipt, setShowReceipt] = useState(false)

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customers (*),
          booking_items (
            id, size, quantity, daily_rate, subtotal,
            condition_before, condition_after,
            item:items (id, name, sku, category, condition_grade)
          ),
          booking_payments (id, type, amount, method, void_reason, is_voided, timestamp),
          booking_accessories (id, accessory_type, given_at_pickup, returned_at_return),
          booking_timeline (id, event_type, description, staff_name, timestamp),
          booking_notes (id, content, is_pinned, created_at)
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  if (isLoading) return <BookingDetailSkeleton />
  if (!booking) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4 text-zinc-500">
      <AlertTriangle className="w-12 h-12 opacity-30" />
      <p className="font-medium">Booking not found</p>
      <Button variant="outline" onClick={() => router.push('/bookings')}>Back to Bookings</Button>
    </div>
  )

  const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.draft
  const StatusIcon = status.icon
  const balanceDue = booking.total_amount - booking.advance_paid
  const allPayments = booking.booking_payments ?? []
  const activePayments = allPayments.filter((p: any) => !p.is_voided)
  const timelineEvents = (booking.booking_timeline ?? []).sort(
    (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const canPickup = booking.status === 'confirmed'
  const canReturn = booking.status === 'active' || booking.status === 'overdue'

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Link href="/bookings">
          <Button variant="ghost" size="icon" className="h-9 w-9 border rounded-full shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight font-mono">
              {booking.booking_id_display ?? id.slice(0, 8).toUpperCase()}
            </h1>
            <Badge className={`${status.color} border-0 gap-1 font-semibold`}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </Badge>
          </div>
          <p className="text-sm text-zinc-500 mt-0.5">
            Created {format(new Date(booking.created_at), 'dd MMM yyyy, HH:mm')}
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowReceipt(true)}>
          <Printer className="w-4 h-4" /> Print Receipt
        </Button>
        <Button variant="outline" size="sm" className="gap-2" disabled>
          <QrCode className="w-4 h-4" /> Print Label
        </Button>
        {canPickup && (
          <Link href={`/bookings/${id}/pickup`}>
            <Button size="sm" className="bg-[#CCFF00] text-black hover:bg-[#bce600] gap-2 font-semibold">
              <Package className="w-4 h-4" /> Mark Pickup
            </Button>
          </Link>
        )}
        {canReturn && (
          <Link href={`/bookings/${id}/return`}>
            <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 gap-2 font-semibold">
              <RotateCcw className="w-4 h-4" /> Mark Return
            </Button>
          </Link>
        )}
        <Link href={`/bookings/${id}/payment`} className="ml-auto">
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Add Payment
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Amount', value: `₹${booking.total_amount?.toLocaleString('en-IN') ?? 0}` },
          { label: 'Advance Paid', value: `₹${booking.advance_paid?.toLocaleString('en-IN') ?? 0}`, highlight: false },
          { label: 'Balance Due',  value: `₹${balanceDue?.toLocaleString('en-IN') ?? 0}`, highlight: balanceDue > 0 },
          { label: 'Deposit Held', value: `₹${booking.deposit_collected?.toLocaleString('en-IN') ?? 0}` },
        ].map((card) => (
          <div key={card.label} className={`p-4 rounded-xl border ${card.highlight ? 'bg-red-50 border-red-200 dark:bg-red-900/20' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{card.label}</p>
            <p className={`text-xl font-bold mt-1 ${card.highlight ? 'text-red-600' : ''}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList className="grid grid-cols-5 h-11 rounded-lg bg-zinc-100 dark:bg-zinc-900">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* ── Details ── */}
        <TabsContent value="details" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <SectionCard title="Customer">
                <Row label="Name"  value={booking.customers?.name} />
                <Row label="Phone" value={booking.customers?.phone} />
                <Row label="Tier"  value={booking.customers?.tier} />
              </SectionCard>
              <SectionCard title="Booking Info">
                <Row label="Pickup"  value={booking.pickup_date  ? format(new Date(booking.pickup_date),  'EEE, dd MMM yyyy') : '—'} />
                <Row label="Return"  value={booking.return_date  ? format(new Date(booking.return_date),  'EEE, dd MMM yyyy') : '—'} />
                <Row label="Occasion"value={booking.occasion ?? '—'} />
                <Row label="Source"  value={booking.booking_source ?? '—'} />
              </SectionCard>
            </div>
            <div className="space-y-4">
              <SectionCard title="CCTV & Verification">
                <Row label="Aadhaar Collected" value={booking.aadhaar_collected ? 'Yes ✓' : 'No'} />
                <Row label="CCTV Timestamp"    value={booking.cctv_timestamp ? format(new Date(booking.cctv_timestamp), 'dd MMM, HH:mm') : '—'} />
                <Row label="Camera Zone"       value={booking.cctv_zone ?? '—'} />
              </SectionCard>
              <SectionCard title="Accessories">
                {(booking.booking_accessories ?? []).length === 0 ? (
                  <p className="text-sm text-zinc-400">None tracked</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {(booking.booking_accessories as any[]).map((acc) => (
                      <div key={acc.id} className="flex items-center gap-2 text-sm capitalize">
                        <span className={`w-2 h-2 rounded-full ${acc.given_at_pickup ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                        {acc.accessory_type}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        </TabsContent>

        {/* ── Payments ── */}
        <TabsContent value="payments" className="mt-4">
          <div className="space-y-3">
            {activePayments.length === 0 ? (
              <EmptyState message="No payments recorded yet." />
            ) : (
              activePayments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`capitalize text-xs ${PAYMENT_METHOD_COLORS[p.method] ?? ''}`}>
                      {p.method}
                    </Badge>
                    <div>
                      <p className="font-semibold capitalize text-sm">{p.type}</p>
                      <p className="text-xs text-zinc-500">{format(new Date(p.timestamp), 'dd MMM yyyy, HH:mm')}</p>
                    </div>
                  </div>
                  <p className="font-mono font-bold text-lg">₹{p.amount?.toLocaleString('en-IN')}</p>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* ── Items ── */}
        <TabsContent value="items" className="mt-4">
          <div className="space-y-3">
            {(booking.booking_items ?? []).length === 0 ? (
              <EmptyState message="No items in this booking." />
            ) : (
              (booking.booking_items as any[]).map((bi) => (
                <div key={bi.id} className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900">
                  <div>
                    <p className="font-semibold">{bi.item?.name}</p>
                    <p className="text-sm text-zinc-500">
                      SKU: {bi.item?.sku} · Size: {bi.size ?? '—'} · Qty: {bi.quantity}
                    </p>
                    {bi.condition_after && (
                      <Badge variant="outline" className="mt-1 text-xs capitalize">{bi.condition_after}</Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold">₹{bi.subtotal?.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-zinc-400">₹{bi.daily_rate}/day</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* ── Notes ── */}
        <TabsContent value="notes" className="mt-4">
          <div className="space-y-3">
            {(booking.booking_notes ?? []).length === 0 ? (
              <EmptyState message="No notes added. Only managers can view notes." />
            ) : (
              (booking.booking_notes as any[]).map((note) => (
                <div key={note.id} className={`p-4 border rounded-xl ${note.is_pinned ? 'border-[#CCFF00] bg-[#CCFF00]/5' : 'border-zinc-200 dark:border-zinc-800'}`}>
                  {note.is_pinned && <p className="text-xs font-semibold text-yellow-600 mb-1">📌 Pinned</p>}
                  <p className="text-sm">{note.content}</p>
                  <p className="text-xs text-zinc-400 mt-2">{format(new Date(note.created_at), 'dd MMM yyyy, HH:mm')}</p>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* ── Timeline ── */}
        <TabsContent value="timeline" className="mt-4">
          {timelineEvents.length === 0 ? (
            <EmptyState message="No events recorded yet." />
          ) : (
            <div className="relative space-y-0 pl-6 border-l-2 border-zinc-200 dark:border-zinc-800 ml-3">
              {timelineEvents.map((event: any, i: number) => (
                <div key={event.id} className="relative pb-6 last:pb-0">
                  <div className="absolute -left-[1.625rem] top-1 w-3 h-3 rounded-full bg-white dark:bg-zinc-950 border-2 border-[#CCFF00]" />
                  <div className="pl-2">
                    <p className="font-semibold text-sm">{event.event_type}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {event.staff_name ?? 'System'} · {format(new Date(event.timestamp), 'dd MMM, HH:mm')}
                    </p>
                    {event.description && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{event.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-sm p-0 bg-transparent border-0 shadow-none overflow-visible">
          <div className="flex justify-end mb-2 isolate">
            <Button variant="secondary" size="sm" onClick={() => window.print()} className="font-semibold gap-2 border shadow-sm">
              <Printer className="w-4 h-4" /> Print Receipt
            </Button>
          </div>
          <ReceiptPreview booking={booking} className="rounded-sm overflow-hidden" />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      <div className="bg-zinc-50 dark:bg-zinc-900/60 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">{title}</h3>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between items-start gap-4 text-sm">
      <span className="text-zinc-500 shrink-0">{label}</span>
      <span className="font-medium text-right">{value ?? '—'}</span>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
      <p className="text-sm">{message}</p>
    </div>
  )
}

function BookingDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="flex gap-2">
        {[1,2,3].map(i => <Skeleton key={i} className="h-8 w-28" />)}
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <Skeleton className="h-11 rounded-lg" />
      <div className="space-y-3">
        {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    </div>
  )
}
