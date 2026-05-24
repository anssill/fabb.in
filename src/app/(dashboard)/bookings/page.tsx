'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Search, CalendarArrowUp, CalendarArrowDown, ChevronRight, AlertTriangle, CalendarDays, List } from 'lucide-react'
import Link from 'next/link'
import { useAppStore } from '@/lib/store'
import { calculateBillableRentalDays } from '@/lib/booking-utils'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  booked: 'bg-indigo-50 text-indigo-700',
  out: 'bg-blue-50 text-blue-700',
  returned: 'bg-emerald-50 text-emerald-700',
  closed: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-rose-50 text-rose-700',
}

const STATUS_BAR: Record<string, string> = {
  pending: 'bg-amber-400',
  booked: 'bg-[#4f46e5]',
  out: 'bg-blue-500',
  returned: 'bg-emerald-500',
  closed: 'bg-slate-400',
  cancelled: 'bg-rose-400',
}

type StatusFilter = 'all' | 'booked' | 'out' | 'returned' | 'pending' | 'closed' | 'cancelled'

function formatInputDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function BookingsPage() {
  const { activeBranch } = useAppStore()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [scheduleDate, setScheduleDate] = useState(() => formatInputDate(new Date()))

  useEffect(() => {
    async function fetchBookings() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: staff } = await supabase
        .from('staff')
        .select('business_id, branch_id')
        .eq('id', user.id)
        .single()
      if (!staff) return

      const { data } = await supabase
        .from('bookings')
        .select(`
          id, booking_number, physical_bill_number, status, pickup_date, return_date, total_amount, balance_due, advance_amount, created_at,
          occasion, booking_source,
          customer:customers(id, name, phone),
          booking_items(item_name, size, quantity)
        `)
        .eq('business_id', staff.business_id)
        .eq('branch_id', staff.branch_id)
        .order('created_at', { ascending: false })
        .limit(200)

      setBookings(data || [])
      setLoading(false)
    }
    fetchBookings()
  }, [activeBranch?.id])

  // Count per status
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: bookings.length }
    bookings.forEach(b => { c[b.status] = (c[b.status] || 0) + 1 })
    return c
  }, [bookings])

  // Apply search + status filter client-side
  const filtered = useMemo(() => {
    return bookings.filter((booking) => {
      const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
      if (!matchesStatus) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        booking.booking_number?.toLowerCase().includes(q) ||
        booking.physical_bill_number?.toLowerCase().includes(q) ||
        (customer as any)?.name?.toLowerCase().includes(q) ||
        (customer as any)?.phone?.includes(q)
      )
    }).sort((a, b) => {
      if (statusFilter !== 'all') return 0
      if (a.status === 'closed' && b.status !== 'closed') return 1
      if (a.status !== 'closed' && b.status === 'closed') return -1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [bookings, search, statusFilter])

  const scheduledBookings = useMemo(() => {
    return filtered
      .filter((booking) => !['cancelled', 'closed'].includes(booking.status))
      .filter((booking) => {
        if (!scheduleDate) return true
        return booking.pickup_date <= scheduleDate && scheduleDate <= booking.return_date
      })
      .sort((a, b) => String(a.pickup_date || '').localeCompare(String(b.pickup_date || '')))
  }, [filtered, scheduleDate])

  const scheduledDays = useMemo(
    () => scheduleDate && scheduledBookings.length > 0 ? [[scheduleDate, scheduledBookings] as const] : [],
    [scheduleDate, scheduledBookings]
  )

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[1.65rem] font-semibold tracking-normal text-slate-950">Bookings</h1>
          <p className="text-sm text-slate-500">{bookings.length} total bookings across this branch</p>
        </div>
        <Button className="h-10 w-full px-4 sm:w-auto" asChild>
          <Link href="/bookings/new">
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Link>
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto rounded-[1.25rem] bg-white p-2 shadow-sm sm:rounded-[1.65rem]">
        {(['all', 'booked', 'out', 'returned', 'pending', 'closed', 'cancelled'] as StatusFilter[]).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors
              ${statusFilter === status
                ? 'bg-[#4f46e5] text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
          >
            <span className="capitalize">{status}</span>
            {counts[status] ? (
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${statusFilter === status ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {counts[status]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by booking ID, bill number, or customer..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex w-full gap-2 sm:w-auto">
        <Button type="button" variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
          <List className="mr-2 h-4 w-4" />
          List
        </Button>
        <Button type="button" variant={viewMode === 'calendar' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('calendar')}>
          <CalendarDays className="mr-2 h-4 w-4" />
          Schedule
        </Button>
      </div>

      {viewMode === 'calendar' && (
        <div className="grid gap-3 rounded-[1.25rem] bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-full flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">Schedule date</p>
              <p className="text-xs text-slate-500">Shows bookings and items reserved on the selected date.</p>
            </div>
            <Input
              type="date"
              value={scheduleDate}
              onChange={(event) => setScheduleDate(event.target.value)}
              className="w-full sm:w-48"
            />
          </div>
          {scheduledDays.length > 0 ? scheduledDays.map(([date, dayBookings]) => (
            <div key={date} className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-950">
                {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })}
              </p>
              <div className="mt-3 space-y-2">
                {dayBookings.map((booking) => {
                  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer
                  return (
                    <Link key={booking.id} href={`/bookings/${booking.id}`} className="block rounded-md bg-slate-50 p-2 hover:bg-slate-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-slate-800">{(customer as any)?.name || booking.booking_number}</span>
                        <Badge className={`shrink-0 text-[10px] capitalize ${STATUS_COLORS[booking.status] || ''}`}>{booking.status}</Badge>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        Pickup {booking.pickup_date ? new Date(booking.pickup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-'} · Return {booking.return_date ? new Date(booking.return_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-'}
                      </p>
                      <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                        {((booking.booking_items || []) as any[]).length > 0 ? ((booking.booking_items || []) as any[]).map((item, index) => (
                          <p key={`${booking.id}-${index}`} className="truncate text-xs font-medium text-slate-700">
                            {item.item_name} · {item.size} · Qty {item.quantity}
                          </p>
                        )) : (
                          <p className="text-xs text-slate-400">No item details</p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )) : (
            <div className="col-span-full py-10 text-center text-sm text-slate-500">No scheduled bookings found.</div>
          )}
        </div>
      )}

      {/* Booking Cards */}
      {viewMode === 'list' && <div className="space-y-2">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Loading bookings...</div>
        ) : filtered.length > 0 ? (
          filtered.map((booking) => {
            const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer
            const items = booking.booking_items || []
            const itemSummary = (items as any[]).map((i: any) => `${i.item_name} (${i.size}×${i.quantity})`).join(', ')
            const isOverdue = booking.status === 'out' && new Date(booking.return_date) < new Date()
            const rentalDays = booking.pickup_date && booking.return_date
              ? calculateBillableRentalDays(booking.pickup_date, booking.return_date)
              : 0
            const balanceDue = Number(booking.balance_due ?? 0)
            const statusKey = isOverdue ? 'out' : booking.status

            return (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="group flex items-stretch overflow-hidden rounded-[1.25rem] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:rounded-[1.65rem]"
              >
                {/* Colored left status bar */}
                <div className={`w-1 flex-shrink-0 ${STATUS_BAR[statusKey] || 'bg-slate-300'}`} />

                {/* Content */}
                <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
                  {/* Column 1: booking info */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-0.5 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-mono font-semibold text-slate-700">{booking.booking_number}</span>
                      {booking.physical_bill_number && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Bill {booking.physical_bill_number}</span>
                      )}
                      {isOverdue ? (
                        <Badge variant="destructive" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1" />OVERDUE</Badge>
                      ) : (
                        <Badge className={`text-xs capitalize ${STATUS_COLORS[booking.status] || ''}`}>{booking.status}</Badge>
                      )}
                    </div>
                    <p className="text-base font-semibold text-slate-900 truncate">{(customer as any)?.name || 'Unknown'}</p>
                    <p className="text-sm text-slate-500 truncate">
                      {(customer as any)?.phone || ''}
                      {itemSummary ? ` · ${itemSummary.slice(0, 50)}${itemSummary.length > 50 ? '…' : ''}` : ''}
                    </p>
                  </div>

                  {/* Column 2: dates */}
                  <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 sm:block sm:w-44 sm:bg-transparent sm:p-0">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <CalendarArrowUp className="w-3.5 h-3.5 text-blue-500" />
                      {booking.pickup_date ? new Date(booking.pickup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-600 mt-0.5">
                      <CalendarArrowDown className="w-3.5 h-3.5 text-amber-500" />
                      {booking.return_date ? new Date(booking.return_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                    </div>
                    {rentalDays > 0 && <p className="text-xs text-slate-400 mt-0.5">{rentalDays} day{rentalDays !== 1 ? 's' : ''}</p>}
                  </div>

                  {/* Column 3: amount */}
                  <div className="flex items-center justify-between gap-3 sm:block sm:w-28 sm:text-right">
                    <p className="text-base font-semibold text-slate-900">₹{Number(booking.total_amount ?? 0).toLocaleString('en-IN')}</p>
                    {balanceDue > 0 ? (
                      <p className="text-xs text-red-600 font-medium">Balance ₹{balanceDue.toLocaleString('en-IN')}</p>
                    ) : (
                      <p className="text-xs text-green-600 font-medium">Paid</p>
                    )}
                  </div>

                  <ChevronRight className="hidden h-4 w-4 flex-shrink-0 text-slate-400 group-hover:text-slate-600 sm:block" />
                </div>
              </Link>
            )
          })
        ) : (
          <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white py-20 text-center shadow-sm sm:rounded-[1.65rem]">
            <div className="w-12 h-12 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <Plus className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              {search ? 'No bookings match your search' : 'No bookings yet'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {search ? 'Try a different search term.' : 'Create your first booking to get started.'}
            </p>
            {!search && (
              <Button className="mt-4" asChild>
                <Link href="/bookings/new"><Plus className="w-4 h-4 mr-2" />New Booking</Link>
              </Button>
            )}
          </div>
        )}
      </div>}
    </div>
  )
}
