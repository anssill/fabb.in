'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  startOfWeek, endOfWeek, addWeeks, subWeeks, 
  eachDayOfInterval, format, isWithinInterval, 
  parseISO, differenceInCalendarDays, isBefore, isAfter
} from 'date-fns'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [search, setSearch] = useState('')
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  // Calculations for current week
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1))
  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1))

  // Fetch Items
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['calendar-items', activeBranchId, search],
    queryFn: async () => {
      let q = supabase.from('items').select('id, name, sku, category').eq('branch_id', activeBranchId)
      if (search) {
        q = q.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
      }
      const { data, error } = await q.limit(50) // Limit to 50 for performance
      if (error) throw error
      return data || []
    },
    enabled: !!activeBranchId,
  })

  // Fetch Reservations
  const { data: reservations = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ['calendar-reservations', activeBranchId, format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: bData, error: bError } = await supabase
        .from('bookings')
        .select(`
          status, pickup_date, return_date,
          customers ( name ),
          booking_items ( item_id )
        `)
        .eq('branch_id', activeBranchId)
        .in('status', ['confirmed', 'active', 'overdue'])
        .gte('return_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('pickup_date', format(weekEnd, 'yyyy-MM-dd'))

      if (bError) throw bError

      // Fetch washing queue
      const { data: wData } = await supabase
        .from('washing_queue')
        .select('item_id, created_at, stage')
        .eq('branch_id', activeBranchId)
        .in('stage', ['queue', 'washing'])

      const resList: Array<{
        itemId: string,
        startDayIndex: number,
        duration: number,
        status: string,
        customer: string,
      }> = []

      // Map Bookings
      for (const b of (bData || [])) {
        const pDate = parseISO(b.pickup_date)
        const rDate = parseISO(b.return_date)
        
        let startDayIndex = 0
        let effectiveStartDate = pDate
        if (isBefore(pDate, weekStart)) {
          startDayIndex = 0
          effectiveStartDate = weekStart
        } else {
          startDayIndex = differenceInCalendarDays(pDate, weekStart)
        }

        let effectiveEndDate = rDate
        if (isAfter(rDate, weekEnd)) {
          effectiveEndDate = weekEnd
        }
        
        // duration in days (+1 to include the last day)
        let duration = differenceInCalendarDays(effectiveEndDate, effectiveStartDate) + 1

        if (startDayIndex < 0 || startDayIndex > 6) continue
        if (startDayIndex + duration > 7) {
          duration = 7 - startDayIndex
        }

        const customerName = b.customers && typeof b.customers === 'object' && 'name' in b.customers 
          ? String(b.customers.name) 
          : 'Customer'

        const biList = Array.isArray(b.booking_items) ? b.booking_items : []
        for (const bi of biList) {
          if (bi.item_id) {
            resList.push({
              itemId: bi.item_id,
              startDayIndex,
              duration,
              status: b.status,
              customer: customerName,
            })
          }
        }
      }

      // Map Washing
      for (const w of (wData || [])) {
        const wDate = parseISO(w.created_at)
        let startDayIndex = 0
        let effectiveStartDate = wDate
        if (isBefore(wDate, weekStart)) {
          startDayIndex = 0
          effectiveStartDate = weekStart
        } else {
          startDayIndex = differenceInCalendarDays(wDate, weekStart)
        }
        
        // Let's assume washing takes 2 days from created_at
        let duration = differenceInCalendarDays(effectiveStartDate, wDate) < 2 ? 
          2 - differenceInCalendarDays(effectiveStartDate, wDate) : 0

        if (duration > 0 && startDayIndex >= 0 && startDayIndex < 7) {
          if (startDayIndex + duration > 7) duration = 7 - startDayIndex
          resList.push({
            itemId: w.item_id,
            startDayIndex,
            duration,
            status: 'washing',
            customer: 'Internal',
          })
        }
      }

      return resList
    },
    enabled: !!activeBranchId,
  })

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Availability Calendar</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Gantt view of item bookings and washing blocks.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 shadow-sm">
            <Button variant="ghost" size="icon" onClick={prevWeek} className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center justify-center min-w-[140px] font-medium text-sm text-zinc-900 dark:text-zinc-100 px-2">
              <CalendarIcon className="w-4 h-4 mr-2 text-zinc-500" />
              {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd')}
            </div>
            <Button variant="ghost" size="icon" onClick={nextWeek} className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline" className="h-10 border-zinc-200 dark:border-zinc-800 hidden sm:flex">
            <Filter className="w-4 h-4 mr-2 text-zinc-500" /> Filters
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items by name or SKU..." 
            className="pl-9 h-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" 
          />
        </div>
        <div className="flex items-center gap-4 text-xs font-medium bg-zinc-50 dark:bg-zinc-900 py-1.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-blue-500" /> Active</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-emerald-500" /> Confirmed</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-purple-500" /> Washing</div>
        </div>
      </div>

      {/* Gantt Chart Container */}
      <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
        {/* Days Header */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 shrink-0">
          <div className="w-64 shrink-0 border-r border-zinc-200 dark:border-zinc-800 p-3 flex items-end">
            <span className="text-xs font-semibold uppercase text-zinc-500 tracking-wider">Inventory Item</span>
          </div>
          <div className="flex-1 grid grid-cols-7">
            {days.map((day, i) => (
              <div key={day.toISOString()} className="border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 p-3 flex flex-col items-center justify-center gap-0.5">
                <span className="text-xs font-medium text-zinc-500">{format(day, 'EEE')}</span>
                <span className={`text-sm font-semibold ${
                  format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') 
                    ? 'text-[#ccff00] bg-zinc-900 dark:text-black dark:bg-[#ccff00] w-6 h-6 rounded-full flex items-center justify-center' 
                    : 'text-zinc-900 dark:text-zinc-100'
                }`}>
                  {format(day, 'd')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto">
          {itemsLoading ? (
            <div className="p-8 flex justify-center">
              <Skeleton className="w-full h-8 mb-2" />
              <Skeleton className="w-full h-8 mb-2" />
              <Skeleton className="w-full h-8" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-sm">No items found matching criteria.</div>
          ) : (
            items.map((item: any) => {
              const rowReservations = reservations.filter(r => r.itemId === item.id)

              return (
                <div key={item.id} className="flex border-b border-zinc-100 dark:border-zinc-800/60 last:border-b-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                  <div className="w-64 shrink-0 border-r border-zinc-200 dark:border-zinc-800 p-3 truncate bg-white dark:bg-zinc-900 z-10">
                    <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate pr-2">{item.name}</div>
                    <div className="text-xs text-zinc-500 flex justify-between items-center pr-2 mt-0.5">
                      <span>{item.sku}</span>
                      <Badge variant="outline" className="text-[10px] py-0 px-1 border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-500">{item.category}</Badge>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-7 relative">
                    {/* Grid Lines */}
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="border-r border-zinc-100 dark:border-zinc-800/60 last:border-r-0 h-full" />
                    ))}

                    {/* Reservation Blocks */}
                    {!reservationsLoading && rowReservations.map((res, i) => (
                      <div 
                        key={i} 
                        className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-md px-2 flex items-center shadow-sm cursor-pointer transition-transform hover:scale-[1.02] border border-white/10 z-20 ${
                          res.status === 'confirmed' ? 'bg-emerald-500 text-white' :
                          res.status === 'active' ? 'bg-blue-500 text-white' :
                          res.status === 'washing' ? 'bg-purple-500 text-white stripes' : 
                          'bg-amber-500 text-white'
                        }`}
                        style={{
                          left: `calc((${res.startDayIndex} / 7) * 100% + 4px)`,
                          width: `calc((${res.duration} / 7) * 100% - 8px)`,
                        }}
                      >
                        <span className="text-[11px] font-semibold truncate mix-blend-plus-lighter">{res.customer}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
