'use client'

import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarDays } from 'lucide-react'
import type { BookingDates } from '../page'

interface Props {
  dates: BookingDates
  setDates: (d: BookingDates) => void
}

export function DatesStep({ dates, setDates }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const rentalDays = dates.pickup_date && dates.return_date
    ? Math.max(1, Math.ceil((new Date(dates.return_date).getTime() - new Date(dates.pickup_date).getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-600" />
          Schedule Dates
        </CardTitle>
        <CardDescription>Set event, pickup, and return dates for this booking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Event date *</Label>
            <Input
              type="date"
              value={dates.event_date}
              onChange={(e) => setDates({ ...dates, event_date: e.target.value })}
              min={today}
            />
            <p className="text-xs text-slate-400">The day of the event / function</p>
          </div>
          <div className="space-y-2">
            <Label>Fitting date <span className="text-slate-400">(optional)</span></Label>
            <Input
              type="date"
              value={dates.fitting_date || ''}
              onChange={(e) => setDates({ ...dates, fitting_date: e.target.value })}
              min={today}
              max={dates.pickup_date || undefined}
            />
            <p className="text-xs text-slate-400">If customer wants a trial fit</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Pickup date *</Label>
            <Input
              type="date"
              value={dates.pickup_date}
              onChange={(e) => setDates({ ...dates, pickup_date: e.target.value })}
              min={today}
              max={dates.event_date || undefined}
            />
            <p className="text-xs text-slate-400">When the customer collects the items</p>
          </div>
          <div className="space-y-2">
            <Label>Return date *</Label>
            <Input
              type="date"
              value={dates.return_date}
              onChange={(e) => setDates({ ...dates, return_date: e.target.value })}
              min={dates.pickup_date || today}
            />
            <p className="text-xs text-slate-400">When items should be returned</p>
          </div>
        </div>

        {rentalDays > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">{rentalDays} day{rentalDays !== 1 ? 's' : ''}</span> rental period
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Occasion <span className="text-slate-400">(optional)</span></Label>
            <Input
              value={dates.occasion || ''}
              onChange={(e) => setDates({ ...dates, occasion: e.target.value })}
              placeholder="Wedding, Birthday, etc."
            />
          </div>
          <div className="space-y-2">
            <Label>Booking source</Label>
            <Select
              value={dates.booking_source || 'walk_in'}
              onValueChange={(v) => setDates({ ...dates, booking_source: v as BookingDates['booking_source'] })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="walk_in">Walk-in</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="repeat">Repeat Customer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes <span className="text-slate-400">(optional)</span></Label>
          <textarea
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dates.notes || ''}
            onChange={(e) => setDates({ ...dates, notes: e.target.value })}
            placeholder="Any special instructions, delivery details, etc."
          />
        </div>
      </CardContent>
    </>
  )
}
