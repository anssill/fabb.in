import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { safeJsonParse, isValidUuid } from '@/lib/api-utils'
import { createClient as createServerClient } from '@/lib/supabase/server'

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

async function getStaffContext() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const supabaseAdmin = getAdmin()
  const { data: staff } = await supabaseAdmin
    .from('staff')
    .select('id, business_id, branch_id, status')
    .eq('id', user.id)
    .single()

  if (!staff || staff.status !== 'active' || !staff.branch_id) {
    return { error: NextResponse.json({ error: 'Unauthorized staff' }, { status: 403 }) }
  }

  return { staff, supabaseAdmin }
}

async function refreshBookingTotals(supabaseAdmin: ReturnType<typeof getAdmin>, booking: any, staffId: string) {
  const { data: bookingItems, error: itemsErr } = await supabaseAdmin
    .from('booking_items')
    .select('subtotal')
    .eq('booking_id', booking.id)

  if (itemsErr) throw new Error(formatError(itemsErr))

  const subtotal = (bookingItems || []).reduce((sum: number, item: any) => sum + Number(item.subtotal || 0), 0)
  const nonItemAdjustment = Number(booking.total_amount || 0) - Number(booking.subtotal || 0)
  const totalAmount = Math.max(0, subtotal + nonItemAdjustment)
  const balanceDue = Math.max(0, totalAmount - Number(booking.advance_amount || 0) - Number(booking.deposit_amount || 0))

  const { error: bookingErr } = await supabaseAdmin
    .from('bookings')
    .update({
      subtotal,
      total_amount: totalAmount,
      balance_due: balanceDue,
      last_updated_by: staffId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', booking.id)

  if (bookingErr) throw new Error(formatError(bookingErr))
}

async function getBookingAndItem(supabaseAdmin: ReturnType<typeof getAdmin>, bookingId: string, itemId: string, staff: any) {
  const { data: booking, error: bookingErr } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .eq('business_id', staff.business_id)
    .eq('branch_id', staff.branch_id)
    .single()

  if (bookingErr) throw new Error(formatError(bookingErr))
  if (booking.status !== 'booked') {
    throw new Error('Items can only be edited before pickup.')
  }

  const { data: bookingItem, error: itemErr } = await supabaseAdmin
    .from('booking_items')
    .select('*')
    .eq('id', itemId)
    .eq('booking_id', bookingId)
    .single()

  if (itemErr) throw new Error(formatError(itemErr))

  return { booking, bookingItem }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: bookingId, itemId } = await params
    if (!isValidUuid(bookingId) || !isValidUuid(itemId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const { item_id: itemIdInput, variant_id: variantIdInput, quantity: quantityInput } = await safeJsonParse(req)
    if (!isValidUuid(itemIdInput) || !isValidUuid(variantIdInput)) {
      return NextResponse.json({ error: 'Select a valid product and size.' }, { status: 400 })
    }

    const quantity = Math.max(1, Number(quantityInput) || 1)
    const context = await getStaffContext()
    if (context.error) return context.error

    const { staff, supabaseAdmin } = context
    const { booking, bookingItem } = await getBookingAndItem(supabaseAdmin, bookingId, itemId, staff)

    if (bookingItem.item_id !== itemIdInput) {
      return NextResponse.json({ error: 'Use Add product to add another product. Edit only changes this item size or quantity.' }, { status: 400 })
    }

    const { data: variant, error: variantErr } = await supabaseAdmin
      .from('item_variants')
      .select('id, item_id, size, colour, price_override, items!inner(id, name, sku, price, business_id, branch_id)')
      .eq('id', variantIdInput)
      .eq('item_id', itemIdInput)
      .eq('items.business_id', staff.business_id)
      .eq('items.branch_id', staff.branch_id)
      .single()

    if (variantErr) throw new Error(formatError(variantErr))
    const parentItem = Array.isArray((variant as any).items) ? (variant as any).items[0] : (variant as any).items
    const nextPrice = Number((variant as any).price_override ?? parentItem.price)

    if (bookingItem.item_variant_id === variantIdInput) {
      const delta = quantity - Number(bookingItem.quantity || 0)
      if (delta > 0) {
        const { error: lockErr } = await supabaseAdmin.rpc('lock_item_stock', {
          p_variant_id: variantIdInput,
          p_quantity: delta,
        })
        if (lockErr) throw new Error(formatError(lockErr))
      } else if (delta < 0) {
        const { error: releaseErr } = await supabaseAdmin.rpc('cancel_booking_stock', {
          p_variant_id: variantIdInput,
          p_quantity: Math.abs(delta),
        })
        if (releaseErr) throw new Error(formatError(releaseErr))
      }
    } else {
      const { error: lockErr } = await supabaseAdmin.rpc('lock_item_stock', {
        p_variant_id: variantIdInput,
        p_quantity: quantity,
      })
      if (lockErr) throw new Error(formatError(lockErr))

      const { error: releaseErr } = await supabaseAdmin.rpc('cancel_booking_stock', {
        p_variant_id: bookingItem.item_variant_id,
        p_quantity: bookingItem.quantity,
      })
      if (releaseErr) throw new Error(formatError(releaseErr))
    }

    const { error: updateErr } = await supabaseAdmin
      .from('booking_items')
      .update({
        item_id: parentItem.id,
        item_variant_id: variantIdInput,
        item_name: parentItem.name,
        item_sku: parentItem.sku || null,
        size: (variant as any).size,
        quantity,
        price: nextPrice,
      })
      .eq('id', itemId)
      .eq('booking_id', bookingId)

    if (updateErr) throw new Error(formatError(updateErr))

    await refreshBookingTotals(supabaseAdmin, booking, staff.id)

    await supabaseAdmin.from('audit_log').insert({
      business_id: booking.business_id,
      branch_id: booking.branch_id,
      staff_id: staff.id,
      action: 'UPDATE_BOOKING_ITEM',
      table_name: 'booking_items',
      record_id: itemId,
      old_value: bookingItem,
      new_value: { item_id: parentItem.id, item_variant_id: variantIdInput, quantity },
    })

    revalidatePath(`/bookings/${bookingId}`)
    revalidatePath('/bookings')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Booking item update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: bookingId, itemId } = await params
    if (!isValidUuid(bookingId) || !isValidUuid(itemId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const context = await getStaffContext()
    if (context.error) return context.error

    const { staff, supabaseAdmin } = context
    const { booking, bookingItem } = await getBookingAndItem(supabaseAdmin, bookingId, itemId, staff)

    const { count, error: countErr } = await supabaseAdmin
      .from('booking_items')
      .select('id', { count: 'exact', head: true })
      .eq('booking_id', bookingId)

    if (countErr) throw new Error(formatError(countErr))
    if ((count || 0) <= 1) {
      return NextResponse.json({ error: 'A booking needs at least one item. Cancel the booking instead.' }, { status: 400 })
    }

    const { error: releaseErr } = await supabaseAdmin.rpc('cancel_booking_stock', {
      p_variant_id: bookingItem.item_variant_id,
      p_quantity: bookingItem.quantity,
    })
    if (releaseErr) throw new Error(formatError(releaseErr))

    const { error: deleteErr } = await supabaseAdmin
      .from('booking_items')
      .delete()
      .eq('id', itemId)
      .eq('booking_id', bookingId)

    if (deleteErr) throw new Error(formatError(deleteErr))

    await refreshBookingTotals(supabaseAdmin, booking, staff.id)

    await supabaseAdmin.from('audit_log').insert({
      business_id: booking.business_id,
      branch_id: booking.branch_id,
      staff_id: staff.id,
      action: 'CANCEL_BOOKING_ITEM',
      table_name: 'booking_items',
      record_id: itemId,
      old_value: bookingItem,
    })

    revalidatePath(`/bookings/${bookingId}`)
    revalidatePath('/bookings')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Booking item delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
