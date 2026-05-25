'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarClock, CheckCircle2, ClipboardCheck, CreditCard, Loader2, Package, RefreshCcw, Truck, Waves } from 'lucide-react'
import { toast } from 'sonner'
import { getOperationStatusClass, getOperationStatus } from '@/lib/operations'

interface Props {
  pickups: any[]
  returns: any[]
  fittings: any[]
  washing: any[]
  payments: any[]
  deliveries: any[]
  tasks: any[]
}

const tabs = [
  ['pickups', 'Pickups', Package],
  ['returns', 'Returns', RefreshCcw],
  ['fittings', 'Fittings', CalendarClock],
  ['washing', 'Washing', Waves],
  ['payments', 'Payments', CreditCard],
  ['delivery', 'Delivery', Truck],
  ['tasks', 'Tasks', ClipboardCheck],
] as const

function customerOf(booking: any) {
  return Array.isArray(booking?.customer) ? booking.customer[0] : booking?.customer
}

function itemSummary(booking: any) {
  const rows = booking?.booking_items || []
  if (!rows.length) return 'No items'
  return rows.map((item: any) => `${item.item_name}${item.size ? ` (${item.size})` : ''}`).join(', ')
}

function BookingRow({ booking, action }: { booking: any; action?: React.ReactNode }) {
  const customer = customerOf(booking)
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/bookings/${booking.id}`} className="font-mono text-sm font-semibold text-[#4f46e5] hover:underline">
            {booking.booking_number}
          </Link>
          <Badge className={`${getOperationStatusClass(booking.status)} border-0`}>{getOperationStatus(booking.status)}</Badge>
          {Number(booking.balance_due || 0) > 0 && <Badge className="border-0 bg-red-50 text-red-700">Balance ₹{Number(booking.balance_due).toLocaleString('en-IN')}</Badge>}
        </div>
        <p className="mt-1 text-sm font-medium text-slate-900">{customer?.name || 'Customer'}{customer?.phone ? ` · ${customer.phone}` : ''}</p>
        <p className="mt-0.5 max-w-[36rem] truncate text-xs text-slate-500">{itemSummary(booking)}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {action}
        <Button size="sm" variant="outline" asChild><Link href={`/bookings/${booking.id}`}>Open</Link></Button>
      </div>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <Card className="border-none bg-white shadow-sm">
      <CardContent className="py-12 text-center text-sm text-slate-500">
        <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
        {label}
      </CardContent>
    </Card>
  )
}

export function OperationsClient({ pickups, returns, fittings, washing, payments, deliveries, tasks }: Props) {
  const router = useRouter()
  const [loadingTask, setLoadingTask] = useState<string | null>(null)

  async function updateTask(task: any, status: string) {
    if (!task.booking_id) return
    setLoadingTask(task.id)
    try {
      const res = await fetch(`/api/bookings/${task.booking_id}/operations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, taskStatus: status }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Task update failed')
      toast.success('Task updated')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Task update failed')
    } finally {
      setLoadingTask(null)
    }
  }

  return (
    <Tabs defaultValue="pickups" className="space-y-4">
      <TabsList className="grid h-auto grid-cols-2 rounded-2xl bg-white p-1 shadow-sm sm:grid-cols-4 lg:grid-cols-7">
        {tabs.map(([value, label, Icon]) => (
          <TabsTrigger key={value} value={value} className="rounded-xl data-[state=active]:bg-[#4f46e5] data-[state=active]:text-white">
            <Icon className="mr-1.5 h-4 w-4" />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="pickups" className="space-y-3">
        {pickups.length ? pickups.map((booking) => (
          <BookingRow key={booking.id} booking={booking} action={<Button size="sm" asChild><Link href={`/bookings/${booking.id}/pickup`}>Pickup</Link></Button>} />
        )) : <EmptyState label="No pickups waiting right now" />}
      </TabsContent>

      <TabsContent value="returns" className="space-y-3">
        {returns.length ? returns.map((booking) => (
          <BookingRow key={booking.id} booking={booking} action={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" asChild><Link href={`/bookings/${booking.id}/return`}>Return</Link></Button>} />
        )) : <EmptyState label="No returns due today" />}
      </TabsContent>

      <TabsContent value="fittings" className="space-y-3">
        {fittings.length ? fittings.map((booking) => (
          <BookingRow key={booking.id} booking={booking} action={<Button size="sm" variant="outline" asChild><Link href={`/bookings/${booking.id}`}>Fitting notes</Link></Button>} />
        )) : <EmptyState label="No fitting appointments today" />}
      </TabsContent>

      <TabsContent value="washing" className="space-y-3">
        {washing.length ? washing.map((entry) => {
          const booking = Array.isArray(entry.booking) ? entry.booking[0] : entry.booking
          const item = Array.isArray(entry.items) ? entry.items[0] : entry.items
          return (
            <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div>
                <p className="text-sm font-semibold">{item?.name || 'Item'} <span className="font-normal text-slate-500">· {entry.stage}</span></p>
                <p className="text-xs text-slate-500">{booking?.booking_number || 'Manual entry'}{entry.damage_found ? ' · damage found' : ''}</p>
              </div>
              <Button size="sm" variant="outline" asChild><Link href="/washing">Open</Link></Button>
            </div>
          )
        }) : <EmptyState label="Washing queue is clear" />}
      </TabsContent>

      <TabsContent value="payments" className="space-y-3">
        {payments.length ? payments.map((booking) => (
          <BookingRow key={booking.id} booking={booking} action={<Button size="sm" variant="outline" asChild><Link href={`/bookings/${booking.id}`}>Collect</Link></Button>} />
        )) : <EmptyState label="No payment follow-ups" />}
      </TabsContent>

      <TabsContent value="delivery" className="space-y-3">
        {deliveries.length ? deliveries.map((delivery) => {
          const booking = Array.isArray(delivery.booking) ? delivery.booking[0] : delivery.booking
          return (
            <BookingRow key={delivery.id} booking={booking} action={<Badge variant="outline" className="capitalize">{delivery.status?.replace(/_/g, ' ')}</Badge>} />
          )
        }) : <EmptyState label="No deliveries pending" />}
      </TabsContent>

      <TabsContent value="tasks" className="space-y-3">
        {tasks.length ? tasks.map((task) => (
          <div key={task.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">{task.title}</p>
              <p className="text-xs text-slate-500">{task.priority} · {task.booking?.booking_number || 'No booking'}{task.due_at ? ` · due ${new Date(task.due_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              {loadingTask === task.id && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
              <Select value={task.status} onValueChange={(value) => updateTask(task, value)}>
                <SelectTrigger className="w-36 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['pending', 'doing', 'done', 'blocked'].map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )) : <EmptyState label="No open tasks" />}
      </TabsContent>
    </Tabs>
  )
}
