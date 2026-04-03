'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useBookings } from '@/lib/queries/bookings'
import { useUserStore } from '@/lib/stores/useUserStore'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, Filter, Calendar, ArrowUpDown, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

const STATUS_TABS = ['all', 'confirmed', 'active', 'overdue', 'returned', 'cancelled'] as const

const STATUS_COLORS: Record<string, string> = {
  draft:     'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  active:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  overdue:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  returned:  'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  cancelled: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
}

interface BookingRow {
  id: string
  booking_id_display?: string
  status: string
  pickup_date: string
  return_date: string
  total_amount: number
  advance_paid: number
  customers: { id: string; name: string; phone: string } | null
  items?: unknown[]
  [key: string]: unknown
}

export default function BookingsPage() {
  const activeBranchId = useUserStore((s) => s.activeBranchId)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const filters = {
    branchId: activeBranchId ?? '',
    status: activeTab !== 'all' ? activeTab : undefined,
    search: debouncedSearch || undefined,
  }

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useBookings(filters)

  // Infinite scroll via IntersectionObserver
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  )

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [handleObserver])

  const allBookings = (data?.pages.flatMap(p => p.data ?? []) ?? []) as BookingRow[]
  const totalCount = data?.pages[0]?.count ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Bookings</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            {totalCount > 0 ? `${totalCount} total` : 'Track all rental orders, pickups, and returns.'}
          </p>
        </div>
        <Link href="/bookings/new">
          <Button className="bg-[#ccff00] text-black hover:bg-[#bce600] font-semibold h-10 px-5 rounded-lg shadow-sm transition-transform active:scale-95">
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search ID, customer, phone..."
            className="pl-9 h-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm"
          />
        </div>
        <Button variant="outline" className="gap-2 h-10 hidden sm:flex border-zinc-200 dark:border-zinc-800">
          <Calendar className="w-4 h-4 text-zinc-500" /> Date Range
        </Button>
        <Button variant="outline" className="gap-2 h-10 border-zinc-200 dark:border-zinc-800">
          <Filter className="w-4 h-4 text-zinc-500" /> <span className="hidden sm:inline">Filter</span>
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-950/50">
            <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
              <TableHead className="font-semibold pl-5">Booking ID</TableHead>
              <TableHead className="font-semibold">Customer</TableHead>
              <TableHead className="font-semibold hidden lg:table-cell">Dates</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right pr-5">
                <span className="inline-flex items-center gap-1">Amount <ArrowUpDown className="w-3 h-3" /></span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="border-zinc-200 dark:border-zinc-800">
                  <TableCell className="pl-5"><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="pr-5 text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : allBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-zinc-500">
                  {debouncedSearch ? `No bookings matching "${debouncedSearch}"` : 'No bookings yet'}
                </TableCell>
              </TableRow>
            ) : (
              allBookings.map((booking) => {
                const balanceDue = booking.total_amount - booking.advance_paid
                return (
                  <TableRow
                    key={booking.id}
                    className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                  >
                    <TableCell className="pl-5">
                      <Link href={`/bookings/${booking.id}`} className="block">
                        <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {booking.booking_id_display ?? booking.id.slice(0, 8).toUpperCase()}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/bookings/${booking.id}`} className="block">
                        <div className="flex flex-col">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {(booking.customers as { name: string } | null)?.name ?? 'Walk-in'}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {(booking.customers as { phone: string } | null)?.phone}
                          </span>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Link href={`/bookings/${booking.id}`} className="block">
                        <div className="flex flex-col text-sm">
                          <span className="text-zinc-600 dark:text-zinc-300">
                            {booking.pickup_date ? format(new Date(booking.pickup_date), 'dd MMM') : '—'}
                          </span>
                          <span className="text-xs text-zinc-400">
                            → {booking.return_date ? format(new Date(booking.return_date), 'dd MMM') : '—'}
                          </span>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`${STATUS_COLORS[booking.status] ?? STATUS_COLORS.draft} border-0 font-medium capitalize`}
                      >
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <Link href={`/bookings/${booking.id}`} className="block">
                        <div className="flex flex-col items-end">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                            ₹{booking.total_amount?.toLocaleString('en-IN') ?? 0}
                          </span>
                          {balanceDue > 0 && (
                            <span className="text-xs text-amber-600 font-medium">
                              ₹{balanceDue.toLocaleString('en-IN')} due
                            </span>
                          )}
                        </div>
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="py-2 flex justify-center">
        {isFetchingNextPage && <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />}
        {!hasNextPage && allBookings.length > 0 && (
          <p className="text-xs text-zinc-400">All bookings loaded</p>
        )}
      </div>
    </div>
  )
}
