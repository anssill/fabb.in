'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CalendarCheck, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Booking {
  id: string
  booking_number: string
  status: string
  pickup_date: string
  return_date: string
  customer_name: string
  variant_id?: string
  quantity: number
}

interface ItemVariant {
  id: string
  size: string
  colour: string
  total_stock: number
  available_stock: number
}

interface Props {
  bookings: Booking[]
  variants: ItemVariant[]
}

const STATUS_BAR: Record<string, { bg: string; text: string; border: string }> = {
  booked:   { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-300' },
  out:      { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-300' },
  returned: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  pending:  { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200' },
  closed:   { bg: 'bg-slate-100',  text: 'text-slate-500',  border: 'border-slate-200' },
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function toYMD(date: Date) {
  return date.toISOString().slice(0, 10)
}

function parseLocal(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function AvailabilityCalendar({ bookings, variants }: Props) {
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedVariantId, setSelectedVariantId] = useState<string | 'all'>('all')

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const rawFirstDay = new Date(year, month, 1).getDay()
  const firstDayMon = (rawFirstDay + 6) % 7

  const monthStartStr = toYMD(new Date(year, month, 1))
  const monthEndStr = toYMD(new Date(year, month + 1, 0))

  // Filter bookings by selected variant
  const filteredBookings = useMemo(() => {
    let list = bookings.filter(bk => bk.status !== 'cancelled')
    if (selectedVariantId !== 'all') {
      list = list.filter(bk => bk.variant_id === selectedVariantId)
    }
    return list
  }, [bookings, selectedVariantId])

  // Total stock for availability math
  const relevantTotalStock = useMemo(() => {
    if (selectedVariantId === 'all') {
      return variants.reduce((sum, v) => sum + (v.total_stock || 0), 0)
    }
    return variants.find(v => v.id === selectedVariantId)?.total_stock || 0
  }, [variants, selectedVariantId])

  // Calculate daily availability
  const dailyAvailability = useMemo(() => {
    const stats: Record<number, { reserved: number; available: number }> = {}
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      
      // Calculate reserved items on this day
      // Note: We include a 1-day turnover buffer (return_date + 1)
      const reservedOnDay = filteredBookings.reduce((sum, bk) => {
        const pickup = bk.pickup_date
        // Buffer: return_date + 1 day
        const retDate = parseLocal(bk.return_date)
        retDate.setDate(retDate.getDate() + 1)
        const returnWithBuffer = toYMD(retDate)
        
        if (dateStr >= pickup && dateStr <= returnWithBuffer) {
          return sum + (bk.quantity || 1)
        }
        return sum
      }, 0)

      stats[d] = {
        reserved: reservedOnDay,
        available: Math.max(0, relevantTotalStock - reservedOnDay)
      }
    }
    return stats
  }, [year, month, daysInMonth, filteredBookings, relevantTotalStock])

  // Booking slots logic for bars
  const bookingSlots: Record<string, number> = {}
  const activeThisMonth = filteredBookings.filter(bk => {
    const ret = parseLocal(bk.return_date)
    const monthStart = new Date(year, month, 1)
    const monthEnd = new Date(year, month + 1, 0)
    return ret >= monthStart && parseLocal(bk.pickup_date) <= monthEnd
  }).sort((a,b) => a.pickup_date.localeCompare(b.pickup_date))

  activeThisMonth.forEach((bk) => {
    const pickup = parseLocal(bk.pickup_date)
    const ret = parseLocal(bk.return_date)
    const used = new Set<number>()
    // Re-check for each day in range
    for (let d = new Date(pickup); d <= ret; d.setDate(d.getDate() + 1)) {
      if (d.getMonth() !== month || d.getFullYear() !== year) continue
      activeThisMonth.filter(other => other.id !== bk.id && bookingSlots[other.id] !== undefined).forEach(other => {
        if (d >= parseLocal(other.pickup_date) && d <= parseLocal(other.return_date)) used.add(bookingSlots[other.id])
      })
    }
    let slot = 0
    while (used.has(slot)) slot++
    bookingSlots[bk.id] = slot
  })

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  const selectedVariantName = selectedVariantId === 'all' ? 'All Sizes' : variants.find(v => v.id === selectedVariantId)?.size || 'Selected Size'

  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/30">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-blue-600" />
              Stock Availability
            </CardTitle>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2 border-slate-200">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  {selectedVariantName}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setSelectedVariantId('all')}>All Sizes</DropdownMenuItem>
                {variants.map(v => (
                  <DropdownMenuItem key={v.id} onClick={() => setSelectedVariantId(v.id)}>
                    Size {v.size} ({v.colour || 'No Colour'})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:bg-slate-100" onClick={prevMonth}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="text-sm font-bold text-slate-900 min-w-[140px] text-center">
                {MONTHS[month]} {year}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:bg-slate-100" onClick={nextMonth}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-100">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase py-2 tracking-wider">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 border-slate-100 font-sans">
          {Array.from({ length: firstDayMon }).map((_, i) => (
            <div key={`e-${i}`} className="border-b border-r border-slate-100 min-h-[100px] bg-slate-50/30" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const stat = dailyAvailability[day]
            const isToday = dateStr === toYMD(today)
            const isPast = dateStr < toYMD(today)
            const bksOnDay = activeThisMonth.filter(bk => bk.pickup_date <= dateStr && bk.return_date >= dateStr)
            
            // Check if buffer day
            const isBufferOnly = !bksOnDay.some(bk => dateStr >= bk.pickup_date && dateStr <= bk.return_date) && 
                                filteredBookings.some(bk => {
                                  const rd = parseLocal(bk.return_date)
                                  rd.setDate(rd.getDate() + 1)
                                  return toYMD(rd) === dateStr
                                })

            return (
              <div key={day} className={`border-b border-r border-slate-100 min-h-[100px] relative transition-colors ${isToday ? 'bg-blue-50/40' : (isPast ? 'bg-slate-50/20' : 'bg-white')}`}>
                <div className="flex items-center justify-between p-1.5">
                  <span className={`text-xs font-bold ${isToday ? 'bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center' : (isPast ? 'text-slate-300' : 'text-slate-600')}`}>
                    {day}
                  </span>
                  {stat && stat.available > 0 && !isPast && (
                    <span className={`text-[10px] font-bold px-1 rounded ${stat.available === relevantTotalStock ? 'text-green-600' : 'text-amber-600'}`}>
                      {stat.available} available
                    </span>
                  )}
                  {stat && stat.available === 0 && !isPast && (
                    <Badge variant="destructive" className="text-[8px] h-4 px-1 leading-none uppercase font-bold">Closed</Badge>
                  )}
                </div>

                <div className="px-0.5 space-y-0.5 mt-1 overflow-hidden">
                  {bksOnDay
                    .sort((a,b) => (bookingSlots[a.id] ?? 0) - (bookingSlots[b.id] ?? 0))
                    .slice(0, 3)
                    .map((bk) => {
                      const style = STATUS_BAR[bk.status] || STATUS_BAR.booked
                      const isStart = bk.pickup_date === dateStr
                      const isEnd = bk.return_date === dateStr
                      return (
                        <Link
                          key={bk.id}
                          href={`/bookings/${bk.id}`}
                          className={`block h-4.5 text-[9px] font-bold leading-4 truncate transition-all
                            ${style.bg} ${style.text} px-2 border-y ${style.border}
                            ${isStart ? 'rounded-l-md border-l' : ''}
                            ${isEnd ? 'rounded-r-md border-r' : ''}
                            hover:brightness-95
                          `}
                        >
                          {isStart ? bk.customer_name : ''}
                        </Link>
                      )
                    })}
                  {bksOnDay.length > 3 && (
                    <div className="text-[8px] text-slate-400 font-bold pl-2">+{bksOnDay.length - 3} more</div>
                  )}
                  {isBufferOnly && (
                    <div className="mx-1 h-4 border border-dashed border-amber-200 bg-amber-50/30 rounded flex items-center justify-center text-[8px] text-amber-600 font-medium">
                      Buffer Day
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {Array.from({ length: (7 - ((firstDayMon + daysInMonth) % 7)) % 7 }).map((_, i) => (
            <div key={`tra-${i}`} className="border-b border-r border-slate-100 min-h-[100px] bg-slate-50/30" />
          ))}
        </div>

        <div className="p-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
              <span className="text-xs text-slate-500">Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border border-dashed border-amber-300 bg-amber-50/50" />
              <span className="text-xs text-slate-500">Washing Buffer</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-green-600">X available</span>
              <span className="text-xs text-slate-500">Stock Count</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-medium italic">
            * 1-day turnover buffer automatically included after return
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
