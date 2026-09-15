'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
export async function updateBookingPricing(bookingId: string, items: { id: string; price: number; discount_percent: number }[], updatedAt: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('update_booking_item_pricing', { p_booking_id: bookingId, p_items: items, p_expected_updated_at: updatedAt })
  if (error) return { error: error.message }
  revalidatePath('/bookings'); revalidatePath('/bookings/' + bookingId); revalidatePath('/dashboard'); revalidatePath('/payments'); revalidatePath('/analytics'); revalidatePath('/reports')
  return { success: true }
}
