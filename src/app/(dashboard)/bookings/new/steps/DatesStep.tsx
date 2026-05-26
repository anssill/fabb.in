'use client'

import { useState } from 'react'
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, CalendarDays, Calendar as CalendarIcon, Plus, X } from 'lucide-react'
import type { BookingDates } from '../page'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { calculateBillableRentalDays, resolveRentalDays } from '@/lib/booking-utils'

interface Props {
  dates: BookingDates
  setDates: (d: BookingDates) => void
}

const CUSTOMER_REQUEST_PRESETS = [
  'No pant needed',
  'Add pant',
  'Tight fitting',
  'Loose fitting',
  'Alter length',
  'Extra trial',
  'Early pickup',
  'Home delivery',
  'Matching accessories',
  'Urgent wash',
]

export function DatesStep({ dates, setDates }: Props) {
  const [isEventOpen, setIsEventOpen] = useState(false)
  const [isFittingOpen, setIsFittingOpen] = useState(false)
  const [isPickupOpen, setIsPickupOpen] = useState(false)
  const [isReturnOpen, setIsReturnOpen] = useState(false)
  const [customRequest, setCustomRequest] = useState('')

  const selectedRequests = dates.customer_requests || []

  const toggleRequest = (request: string) => {
    setDates({
      ...dates,
      customer_requests: selectedRequests.includes(request)
        ? selectedRequests.filter((item) => item !== request)
        : [...selectedRequests, request],
    })
  }

  const addCustomRequest = () => {
    const request = customRequest.trim()
    if (!request) return
    if (!selectedRequests.includes(request)) {
      setDates({ ...dates, customer_requests: [...selectedRequests, request] })
    }
    setCustomRequest('')
  }

  const removeRequest = (request: string) => {
    setDates({
      ...dates,
      customer_requests: selectedRequests.filter((item) => item !== request),
    })
  }

  // Local timezone-safe parsing to prevent day shifting
  const parseLocalDate = (dateStr: string | undefined | null): Date | undefined => {
    if (!dateStr) return undefined
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  // Local timezone-safe formatting to YYYY-MM-DD
  const formatLocalDate = (date: Date | undefined): string => {
    if (!date) return ''
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)

  const isEventDisabled = (date: Date) => {
    return date < todayDate
  }

  const isFittingDisabled = (date: Date) => {
    if (date < todayDate) return true
    if (dates.pickup_date) {
      const pickup = parseLocalDate(dates.pickup_date)
      if (pickup && date > pickup) return true
    }
    return false
  }

  const isPickupDisabled = (date: Date) => {
    if (date < todayDate) return true
    if (dates.event_date) {
      const event = parseLocalDate(dates.event_date)
      if (event && date > event) return true
    }
    return false
  }

  const isReturnDisabled = (date: Date) => {
    const minDate = dates.pickup_date ? parseLocalDate(dates.pickup_date) : todayDate
    return !minDate || date < minDate
  }

  const calendarRentalDays = dates.pickup_date && dates.return_date
    ? calculateBillableRentalDays(dates.pickup_date, dates.return_date)
    : 0
  const rentalDays = dates.pickup_date && dates.return_date
    ? resolveRentalDays(dates.pickup_date, dates.return_date, dates.rental_days_override)
    : 0
  const hasCustomRentalDays = Number(dates.rental_days_override) > 0
  const rentalDayOptions = Array.from(new Set([calendarRentalDays, 1, 2, 3, 4, 5, 7].filter((days) => days > 0)))
  const pickupBeforeEvent = dates.pickup_date && dates.event_date
    ? parseLocalDate(dates.pickup_date)!.getTime() < parseLocalDate(dates.event_date)!.getTime()
    : false

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          Schedule Dates
        </CardTitle>
        <CardDescription>Set event, pickup, and return dates for this booking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 flex flex-col">
            <Label className="mb-1">Event date *</Label>
            <Popover open={isEventOpen} onOpenChange={setIsEventOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-input focus:ring-1 focus:ring-ring focus:border-ring rounded-lg h-10 px-3",
                    !dates.event_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {dates.event_date ? (
                    format(parseLocalDate(dates.event_date)!, "PPP")
                  ) : (
                    <span>Pick event date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parseLocalDate(dates.event_date)}
                  onSelect={(date) => {
                    if (date) {
                      const eventStr = formatLocalDate(date)
                      const nextDates = { ...dates, event_date: eventStr }
                      if (dates.pickup_date && new Date(dates.pickup_date) > date) {
                        nextDates.pickup_date = ''
                        nextDates.return_date = ''
                      }
                      setDates(nextDates)
                      setIsEventOpen(false)
                    }
                  }}
                  disabled={isEventDisabled}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">The day of the event / function</p>
          </div>

          <div className="space-y-2 flex flex-col">
            <Label className="mb-1">Fitting date <span className="text-muted-foreground">(optional)</span></Label>
            <Popover open={isFittingOpen} onOpenChange={setIsFittingOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-input focus:ring-1 focus:ring-ring focus:border-ring rounded-lg h-10 px-3",
                    !dates.fitting_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {dates.fitting_date ? (
                    format(parseLocalDate(dates.fitting_date)!, "PPP")
                  ) : (
                    <span>Pick fitting date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parseLocalDate(dates.fitting_date)}
                  onSelect={(date) => {
                    setDates({ ...dates, fitting_date: date ? formatLocalDate(date) : '' })
                    setIsFittingOpen(false)
                  }}
                  disabled={isFittingDisabled}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">If customer wants a trial fit</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 flex flex-col">
            <Label className="mb-1">Pickup date *</Label>
            <Popover open={isPickupOpen} onOpenChange={setIsPickupOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-input focus:ring-1 focus:ring-ring focus:border-ring rounded-lg h-10 px-3",
                    !dates.pickup_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {dates.pickup_date ? (
                    format(parseLocalDate(dates.pickup_date)!, "PPP")
                  ) : (
                    <span>Pick pickup date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parseLocalDate(dates.pickup_date)}
                  onSelect={(date) => {
                    if (date) {
                      const pickupStr = formatLocalDate(date)
                      const nextDates = { ...dates, pickup_date: pickupStr }
                      if (dates.return_date && new Date(dates.return_date) < date) {
                        nextDates.return_date = ''
                      }
                      if (dates.fitting_date && new Date(dates.fitting_date) > date) {
                        nextDates.fitting_date = ''
                      }
                      setDates(nextDates)
                      setIsPickupOpen(false)
                    }
                  }}
                  disabled={isPickupDisabled}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">When the customer collects the items</p>
          </div>

          <div className="space-y-2 flex flex-col">
            <Label className="mb-1">Return date *</Label>
            <Popover open={isReturnOpen} onOpenChange={setIsReturnOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-input focus:ring-1 focus:ring-ring focus:border-ring rounded-lg h-10 px-3",
                    !dates.return_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {dates.return_date ? (
                    format(parseLocalDate(dates.return_date)!, "PPP")
                  ) : (
                    <span>Pick return date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parseLocalDate(dates.return_date)}
                  onSelect={(date) => {
                    if (date) {
                      setDates({ ...dates, return_date: formatLocalDate(date) })
                      setIsReturnOpen(false)
                    }
                  }}
                  disabled={isReturnDisabled}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">When items should be returned</p>
          </div>
        </div>

        {calendarRentalDays > 0 && (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Billable rental days</p>
                <p className="text-xs text-muted-foreground">
                  Physical pickup can be early. This controls the days used for price calculation.
                </p>
              </div>
              <div className="rounded-md bg-background px-2 py-1 text-xs font-semibold text-primary ring-1 ring-border">
                Charging {rentalDays} day{rentalDays !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr] sm:items-end">
              <div className="space-y-2">
                <Label>Charge days</Label>
                <Input
                  type="number"
                  min={1}
                  value={dates.rental_days_override ?? ''}
                  onChange={(e) => {
                    const value = Number(e.target.value)
                    setDates({
                      ...dates,
                      rental_days_override: Number.isFinite(value) && value > 0 ? Math.round(value) : undefined,
                    })
                  }}
                  placeholder={String(calendarRentalDays)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {rentalDayOptions.map((days) => (
                  <Button
                    key={days}
                    type="button"
                    variant={rentalDays === days ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDates({ ...dates, rental_days_override: days })}
                  >
                    {days}d
                  </Button>
                ))}
                {hasCustomRentalDays && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDates({ ...dates, rental_days_override: undefined })}
                  >
                    Use calendar ({calendarRentalDays}d)
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {pickupBeforeEvent && (
          <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p className="text-sm font-medium">
              Pickup is before the event date. Please confirm this is intentional before continuing.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Occasion <span className="text-muted-foreground">(optional)</span></Label>
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

        <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
          <div className="space-y-1">
            <Label>Customer requests <span className="text-muted-foreground">(optional)</span></Label>
            <p className="text-xs text-muted-foreground">Select common requests or add a staff custom request.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {CUSTOMER_REQUEST_PRESETS.map((request) => {
              const isSelected = selectedRequests.includes(request)
              return (
                <button
                  key={request}
                  type="button"
                  onClick={() => toggleRequest(request)}
                  className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background text-foreground hover:border-primary hover:text-primary'
                  }`}
                >
                  {request}
                </button>
              )
            })}
          </div>
          {selectedRequests.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              {selectedRequests.map((request) => (
                <span key={request} className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-1 text-xs font-medium text-foreground ring-1 ring-border">
                  {request}
                  <button type="button" onClick={() => removeRequest(request)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove {request}</span>
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={customRequest}
              onChange={(e) => setCustomRequest(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustomRequest()
                }
              }}
              placeholder="Add custom request..."
            />
            <Button type="button" variant="outline" onClick={addCustomRequest} disabled={!customRequest.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes <span className="text-muted-foreground">(optional)</span></Label>
          <textarea
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[80px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
            value={dates.notes || ''}
            onChange={(e) => setDates({ ...dates, notes: e.target.value })}
            placeholder="Any special instructions, delivery details, etc."
          />
        </div>
      </CardContent>
    </>
  )
}
