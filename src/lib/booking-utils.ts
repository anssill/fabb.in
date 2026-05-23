const MS_PER_DAY = 1000 * 60 * 60 * 24

function parseDateOnly(date: string): Date | null {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(Date.UTC(year, month - 1, day))
}

export function calculateBillableRentalDays(pickupDate?: string | null, returnDate?: string | null): number {
  if (!pickupDate || !returnDate) return 1

  const pickup = parseDateOnly(pickupDate)
  const returnDay = parseDateOnly(returnDate)
  if (!pickup || !returnDay) return 1

  const calendarDays = Math.ceil((returnDay.getTime() - pickup.getTime()) / MS_PER_DAY)
  return Math.max(1, calendarDays - 1)
}
