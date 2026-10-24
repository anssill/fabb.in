'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { BookingItem } from '../new/page'

export async function updateBookingItems(bookingId: string, items: BookingItem[], updatedAt: string, overbookReason: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('update_booking_items', {
    p_booking_id: bookingId,
    p_items: items.map(item => ({
      booking_item_id: item.booking_item_id, item_id: item.item_id, variant_id: item.variant_id,
      quantity: item.quantity, price: item.price, discount_percent: item.discount_percent ?? 0,
      discount_flat: item.discount_flat ?? null,
    })),
    p_expected_updated_at: updatedAt,
    p_overbook_reason: overbookReason.trim() || undefined,
  })
  if (error) return { error: error.message }
  for (const path of ['/bookings', `/bookings/${bookingId}`, '/inventory', '/dashboard', '/payments', '/analytics', '/reports']) revalidatePath(path)
  return { success: true }
}
