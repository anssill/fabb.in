'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { bookingNumberError, normalizeBookingNumber } from '@/lib/booking-number'
import type { BookingCustomer, BookingItem, BookingDates, BookingPricing, BookingPayment } from './page'
type BookingData = { customBookingNumber?: string; customer: BookingCustomer; items: BookingItem[]; dates: BookingDates; pricing: BookingPricing; payment: BookingPayment; staffId: string; businessId: string; branchId: string; requestId: string }
export async function createNewBookingFlow(input: BookingData) {
  const numberError = bookingNumberError(input.customBookingNumber)
  if (numberError) return { success: false, error: numberError }
  const additionalPhones = [...new Set((input.customer.additional_phones || []).map(phone => phone.replace(/\D/g, '')).filter(Boolean))]
  if (additionalPhones.length > 8 || additionalPhones.some(phone => phone.length < 10 || phone.length > 15)) return { success: false, error: 'Enter valid additional phone numbers (10–15 digits)' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }
  const { data, error } = await supabase.rpc('create_priced_booking', { p_input: JSON.parse(JSON.stringify({ ...input, customer: { ...input.customer, additional_phones: additionalPhones }, customBookingNumber: normalizeBookingNumber(input.customBookingNumber) || undefined })) })
  if (error) return { success: false, error: error.message }
  const result = data as { booking_id: string; booking_number: string }
  revalidatePath('/bookings'); revalidatePath('/inventory'); revalidatePath('/dashboard'); revalidatePath('/payments')
  return { success: true, bookingId: result.booking_id, bookingNumber: result.booking_number }
}
