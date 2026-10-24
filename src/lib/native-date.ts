export function isAppleDevice(platform: string, userAgent: string): boolean {
  return /Mac|iPhone|iPad|iPod/i.test(platform) || /iPhone|iPad|iPod/i.test(userAgent)
}

/** Date-only values must stay in local time, including west of UTC. */
export function localDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function updateBookingDate<T extends { event_date: string; pickup_date: string; return_date: string; fitting_date?: string }>(
  dates: T, field: 'event_date' | 'pickup_date' | 'return_date' | 'fitting_date', value: string,
): T {
  const next = { ...dates, [field]: value }
  if (field === 'event_date' && value && dates.pickup_date > value) {
    next.pickup_date = ''
    next.return_date = ''
  }
  if (field === 'pickup_date' && value) {
    if (dates.return_date && dates.return_date < value) next.return_date = ''
    if (dates.fitting_date && dates.fitting_date > value) next.fitting_date = ''
  }
  return next
}
