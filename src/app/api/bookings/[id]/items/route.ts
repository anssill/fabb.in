import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { safeJsonParse, isValidUuid } from '@/lib/api-utils'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { calculateBillableRentalDays } from '@/lib/booking-utils'

function getAdmin() {
  return createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function formatError(error: any): string {
  return error?.message || error?.code || 'Unknown error'
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params
    if (!isValidUuid(bookingId)) {
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 })
    }

    const { item_id: itemId, variant_id: variantId, quantity: quantityInput } = await safeJsonParse(req)
    if (!isValidUuid(itemId) || !isValidUuid(variantId)) {
      return NextResponse.json({ error: 'Select a valid product and size.' }, { status: 400 })
    }

    const quantity = Math.max(1, Number(quantityInput) || 1)
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabaseAdmin = getAdmin()
    const { data: staff } = await supabaseAdmin
      .from('staff')
      .select('id, business_id, branch_id, status')
      .eq('id', user.id)
      .single()

    if (!staff || staff.status !== 'active' || !staff.branch_id) {
      return NextResponse.json({ error: 'Unauthorized staff' }, { status: 403 })
    }

    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('business_id', staff.business_id)
      .eq('branch_id', staff.branch_id)
      .single()

    if (bookingErr) throw new Error(formatError(bookingErr))
    if (booking.status !== 'booked') {
      return NextResponse.json({ error: 'Products can only be added before pickup.' }, { status: 400 })
    }

    const { data: variant, error: variantErr } = await supabaseAdmin
      .from('item_variants')
      .select('id, item_id, size, colour, price_override, items!inner(id, name, sku, price, business_id, branch_id)')
      .eq('id', variantId)
      .eq('item_id', itemId)
      .eq('items.business_id', staff.business_id)
      .eq('items.branch_id', staff.branch_id)
      .single()

    if (variantErr) throw new Error(formatError(variantErr))

    const { error: lockErr } = await supabaseAdmin.rpc('lock_item_stock', {
      p_variant_id: variantId,
      p_quantity: quantity,
    })
    if (lockErr) {
      return NextResponse.json({ error: 'Selected size is no longer available. Please choose another size.' }, { status: 400 })
    }

    const parentItem = Array.isArray((variant as any).items) ? (variant as any).items[0] : (variant as any).items
    const price = Number((variant as any).price_override ?? parentItem.price)
    const rentalDays = calculateBillableRentalDays(booking.pickup_date, booking.return_date)

    const { data: bookingItem, error: insertErr } = await supabaseAdmin
      .from('booking_items')
      .insert({
        booking_id: bookingId,
        item_id: parentItem.id,
        item_variant_id: variantId,
        item_name: parentItem.name,
        item_sku: parentItem.sku || null,
        size: (variant as any).size,
        quantity,
        price,
        rental_days: rentalDays,
      })
      .select('id')
      .single()

    if (insertErr) {
      await supabaseAdmin.rpc('cancel_booking_stock', { p_variant_id: variantId, p_quantity: quantity })
      throw new Error(formatError(insertErr))
    }

    const { data: bookingItems, error: itemsErr } = await supabaseAdmin
      .from('booking_items')
      .select('subtotal')
      .eq('booking_id', bookingId)

    if (itemsErr) throw new Error(formatError(itemsErr))

    const subtotal = (bookingItems || []).reduce((sum: number, item: any) => sum + Number(item.subtotal || 0), 0)
    const nonItemAdjustment = Number(booking.total_amount || 0) - Number(booking.subtotal || 0)
    const totalAmount = Math.max(0, subtotal + nonItemAdjustment)
    const balanceDue = Math.max(0, totalAmount - Number(booking.advance_amount || 0) - Number(booking.deposit_amount || 0))

    const { error: updateErr } = await supabaseAdmin
      .from('bookings')
      .update({
        subtotal,
        total_amount: totalAmount,
        balance_due: balanceDue,
        last_updated_by: staff.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    if (updateErr) throw new Error(formatError(updateErr))

    await supabaseAdmin.from('audit_log').insert({
      business_id: booking.business_id,
      branch_id: booking.branch_id,
      staff_id: staff.id,
      action: 'ADD_BOOKING_ITEM',
      table_name: 'booking_items',
      record_id: bookingItem.id,
      new_value: { item_id: parentItem.id, item_variant_id: variantId, quantity },
    })

    revalidatePath(`/bookings/${bookingId}`)
    revalidatePath('/bookings')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Booking item add error:', error)
    return NextResponse.json({ error: error.message || 'Could not add product' }, { status: 500 })
  }
}
