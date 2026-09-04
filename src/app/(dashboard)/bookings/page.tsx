'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Search, CalendarArrowUp, CalendarArrowDown, ChevronRight, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useAppStore } from '@/lib/store'
import { calculateBillableRentalDays } from '@/lib/booking-utils'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  quote: 'bg-slate-100 text-slate-700',
  hold: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-indigo-50 text-indigo-700',
  picked_up: 'bg-blue-50 text-blue-700',
  partially_returned: 'bg-cyan-50 text-cyan-700',
  returned: 'bg-emerald-50 text-emerald-700',
  closed: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-rose-50 text-rose-700',
}

const STATUS_BAR: Record<string, string> = {
  draft: 'bg-slate-300',
  quote: 'bg-slate-300',
  hold: 'bg-amber-400',
  confirmed: 'bg-[#4f46e5]',
  picked_up: 'bg-blue-500',
  partially_returned: 'bg-cyan-500',
  returned: 'bg-emerald-500',
  closed: 'bg-slate-400',
  cancelled: 'bg-rose-400',
}

type StatusFilter = 'all' | 'draft' | 'quote' | 'hold' | 'confirmed' | 'picked_up' | 'partially_returned' | 'returned' | 'closed' | 'cancelled'

export default function BookingsPage() {
  const { activeBranch } = useAppStore()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

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

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[1.65rem] font-semibold tracking-normal text-slate-950">Bookings</h1>
          <p className="text-sm text-slate-500">{bookings.length} total bookings across this branch</p>
        </div>
        <Button className="h-10 px-4" asChild>
          <Link href="/bookings/new">
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Link>
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto rounded-[1.65rem] bg-white p-2 shadow-sm">
        {(['all', 'draft', 'quote', 'hold', 'confirmed', 'picked_up', 'partially_returned', 'returned', 'closed', 'cancelled'] as StatusFilter[]).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors
              ${statusFilter === status
                ? 'bg-[#4f46e5] text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
          >
            <span className="capitalize">{status.replaceAll('_', ' ')}</span>
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

      {/* Booking Cards */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Loading bookings...</div>
        ) : filtered.length > 0 ? (
          filtered.map((booking) => {
            const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer
            const items = booking.booking_items || []
            const itemSummary = (items as any[]).map((i: any) => `${i.item_name} (${i.size}×${i.quantity})`).join(', ')
            const isOverdue = ['picked_up', 'partially_returned'].includes(booking.status) && new Date(booking.return_date) < new Date()
            const rentalDays = booking.pickup_date && booking.return_date
              ? calculateBillableRentalDays(booking.pickup_date, booking.return_date)
              : 0
            const balanceDue = Number(booking.balance_due ?? 0)
            const statusKey = booking.status

            return (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="flex items-stretch overflow-hidden rounded-[1.65rem] bg-white shadow-sm transition-all group hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* Colored left status bar */}
                <div className={`w-1 flex-shrink-0 ${STATUS_BAR[statusKey] || 'bg-slate-300'}`} />

                {/* Content */}
                <div className="flex flex-1 items-center gap-4 p-4">
                  {/* Column 1: booking info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-mono font-semibold text-slate-700">{booking.booking_number}</span>
                      {booking.physical_bill_number && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Bill {booking.physical_bill_number}</span>
                      )}
                      {isOverdue ? (
                        <Badge variant="destructive" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1" />OVERDUE</Badge>
                      ) : (
                        <Badge className={`text-xs capitalize ${STATUS_COLORS[booking.status] || ''}`}>{booking.status.replaceAll('_', ' ')}</Badge>
                      )}
                    </div>
                    <p className="text-base font-semibold text-slate-900 truncate">{(customer as any)?.name || 'Unknown'}</p>
                    <p className="text-sm text-slate-500 truncate">
                      {(customer as any)?.phone || ''}
                      {itemSummary ? ` · ${itemSummary.slice(0, 50)}${itemSummary.length > 50 ? '…' : ''}` : ''}
                    </p>
                  </div>

                  {/* Column 2: dates */}
                  <div className="w-44 hidden sm:block">
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
                  <div className="w-28 text-right">
                    <p className="text-base font-semibold text-slate-900">₹{Number(booking.total_amount ?? 0).toLocaleString('en-IN')}</p>
                    {balanceDue > 0 ? (
                      <p className="text-xs text-red-600 font-medium">Balance ₹{balanceDue.toLocaleString('en-IN')}</p>
                    ) : (
                      <p className="text-xs text-green-600 font-medium">Paid</p>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
                </div>
              </Link>
            )
          })
        ) : (
          <div className="rounded-[1.65rem] border border-dashed border-slate-200 bg-white py-20 text-center shadow-sm">
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
      </div>
    </div>
  )
}
