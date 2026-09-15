'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { BookingCustomer, BookingItem, BookingDates, BookingPricing, BookingPayment } from './page'
type BookingData = { customer: BookingCustomer; items: BookingItem[]; dates: BookingDates; pricing: BookingPricing; payment: BookingPayment; staffId: string; businessId: string; branchId: string; requestId: string }
export async function createNewBookingFlow(input: BookingData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }
  const { data, error } = await supabase.rpc('create_priced_booking', { p_input: JSON.parse(JSON.stringify(input)) })
  if (error) return { success: false, error: error.message }
  const result = data as { booking_id: string; booking_number: string }
  revalidatePath('/bookings'); revalidatePath('/inventory'); revalidatePath('/dashboard'); revalidatePath('/payments')
  return { success: true, bookingId: result.booking_id, bookingNumber: result.booking_number }
}
