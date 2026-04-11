'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { CalendarDays } from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  pickupDates: string[]
  returnDates: string[]
}

export function DashboardCalendar({ pickupDates, returnDates }: Props) {
  const [date, setDate] = useState<Date | undefined>(new Date())

  const pickupSet = new Set(pickupDates)
  const returnSet = new Set(returnDates)

  const selectedStr = date ? format(date, 'yyyy-MM-dd') : null
  const hasPickup = selectedStr && pickupSet.has(selectedStr)
  const hasReturn = selectedStr && returnSet.has(selectedStr)

  const modifiers = {
    pickup: pickupDates.map(d => new Date(d)),
    return: returnDates.map(d => new Date(d)),
  }

  const modifiersClassNames = {
    pickup: 'bg-emerald-100 text-emerald-800 rounded-full font-semibold',
    return: 'bg-orange-100 text-orange-800 rounded-full font-semibold',
  }

  return (
    <Card className="col-span-full lg:col-span-1">
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
          <div className="w-full p-3 rounded-lg bg-muted/50 border space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {date ? format(date, 'MMMM d, yyyy') : ''}
            </p>
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
          </div>
        ) : date ? (
          <p className="text-xs text-muted-foreground text-center pb-1">No bookings on {format(date, 'MMMM d')}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
