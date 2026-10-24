export const MAX_BOOKING_COUNTER = Number.MAX_SAFE_INTEGER - 1

export function normalizeBookingNumber(value: string | undefined): string {
  return (value ?? '').trim().toUpperCase()
}

export function bookingNumberError(value: string | undefined): string | null {
  const normalized = normalizeBookingNumber(value)
  return !normalized || /^[A-Z0-9/_-]{1,40}$/.test(normalized)
    ? null
    : 'Use 1–40 letters, numbers, hyphens, underscores or slashes.'
}

export interface BookingNumberSettings {
  branch_id: string
  business_id: string
  prefix: string
  next_number: number
  updated_at: string
}
