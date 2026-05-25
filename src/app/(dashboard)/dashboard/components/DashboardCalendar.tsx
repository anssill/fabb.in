'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { CalendarDays } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface Props {
  pickupDates: string[]
  returnDates: string[]
  bookings: CalendarBooking[]
}

interface CalendarBooking {
  id: string
  booking_number: string | null
  status: string
  pickup_date?: string | null
  return_date?: string | null
  total_amount?: number | string | null
  balance_due?: number | string | null
  customer: { name?: string | null; phone?: string | null } | { name?: string | null; phone?: string | null }[] | null
  booking_items?: Array<{ item_name?: string | null; size?: string | null; quantity?: number | null }>
}

function getSingle<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] || null
  return value || null
}

function getItemSummary(booking: CalendarBooking) {
  const items = booking.booking_items || []
  if (items.length === 0) return 'No item details'
  return items
    .map(item => `${item.item_name}${item.size ? ` (${item.size})` : ''}${Number(item.quantity || 1) > 1 ? ` x${item.quantity}` : ''}`)
    .join(', ')
}

export function DashboardCalendar({ pickupDates, returnDates, bookings }: Props) {
  const [date, setDate] = useState<Date | undefined>(new Date())

  const pickupSet = new Set([...pickupDates, ...bookings.map(booking => booking.pickup_date).filter(Boolean) as string[]])
  const returnSet = new Set([...returnDates, ...bookings.map(booking => booking.return_date).filter(Boolean) as string[]])

  const selectedStr = date ? format(date, 'yyyy-MM-dd') : null
  const selectedBookings = selectedStr
    ? bookings.filter(booking => booking.pickup_date === selectedStr || booking.return_date === selectedStr)
    : []
  const hasPickup = selectedStr && (pickupSet.has(selectedStr) || selectedBookings.some(booking => booking.pickup_date === selectedStr))
  const hasReturn = selectedStr && (returnSet.has(selectedStr) || selectedBookings.some(booking => booking.return_date === selectedStr))

  const modifiers = {
    pickup: Array.from(pickupSet).map(d => new Date(d)),
    return: Array.from(returnSet).map(d => new Date(d)),
  }

  const modifiersClassNames = {
    pickup: 'bg-emerald-100 text-emerald-800 rounded-full font-semibold',
    return: 'bg-orange-100 text-orange-800 rounded-full font-semibold',
  }

  return (
    <Card className="col-span-full min-w-0 rounded-[1.65rem] border-0 bg-white shadow-sm ring-0 lg:col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-blue-600" />
          Booking Calendar
        </CardTitle>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="text-xs text-muted-foreground">Pickups</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-orange-400" />
            <span className="text-xs text-muted-foreground">Returns</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3 pt-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-xl border w-full p-2"
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
        />
        {selectedStr && (hasPickup || hasReturn) ? (
          <div className="w-full p-3 rounded-lg bg-muted/50 border space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {date ? format(date, 'MMMM d, yyyy') : ''}
            </p>
            {selectedBookings.length > 0 ? (
              <div className="space-y-2">
                {selectedBookings.slice(0, 5).map((booking) => {
                  const customer = getSingle(booking.customer)
                  return (
                    <Link key={booking.id} href={`/bookings/${booking.id}`} className="block rounded-lg border border-slate-100 bg-white p-2 hover:border-[#4f46e5]/30">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-[#4f46e5]">{booking.booking_number}</span>
                        <div className="flex gap-1">
                          {booking.pickup_date === selectedStr && <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">Pickup</Badge>}
                          {booking.return_date === selectedStr && <Badge className="bg-orange-100 text-orange-700 border-0 text-[10px]">Return</Badge>}
                        </div>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-600">{customer?.name || 'Customer'}{customer?.phone ? ` · ${customer.phone}` : ''}</p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-400">{getItemSummary(booking)}</p>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <>
                {hasPickup && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Pickup</Badge>
                    <span className="text-xs text-muted-foreground">Items scheduled for pickup</span>
                  </div>
                )}
                {hasReturn && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">Return</Badge>
                    <span className="text-xs text-muted-foreground">Items scheduled for return</span>
                  </div>
                )}
              </>
            )}
          </div>
        ) : date ? (
          <p className="text-xs text-muted-foreground text-center pb-1">No bookings on {format(date, 'MMMM d')}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
