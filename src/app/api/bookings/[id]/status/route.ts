import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidUuid, safeJsonParse } from '@/lib/api-utils'

type ReturnInput = { bookingItemId: string; quantity: number; unavailableQuantity?: number; reason?: 'damaged' | 'missing'; notes?: string; assetIds?: string[] }

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params
  if (!isValidUuid(bookingId)) return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 })
  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await safeJsonParse(request)
    const requestedStatus = body.status
    const { data: staff } = await supabase.from('staff').select('id, business_id, status').eq('id', user.id).single()
    if (!staff?.business_id || !['active', 'approved'].includes(staff.status)) return NextResponse.json({ error: 'Unauthorized staff' }, { status: 403 })
    const { data: booking, error } = await db.from('bookings').select('*, customer:customers(id, name, phone), booking_items(*, item:items(tracking_mode), booking_item_assets(asset_id, released_at, asset:inventory_assets(id, asset_code, status)))').eq('id', bookingId).eq('business_id', staff.business_id).single()
    if (error || !booking) return NextResponse.json({ error: error?.message || 'Booking not found' }, { status: 404 })

    let finalStatus = requestedStatus
    const now = new Date().toISOString()
    if (requestedStatus === 'picked_up') {
      if (!['confirmed', 'hold', 'partially_returned'].includes(booking.status)) throw new Error(`Cannot pick up a ${booking.status} booking`)
      for (const item of booking.booking_items) {
        const alreadyPicked = Number(item.picked_up_quantity ?? 0)
        const quantity = Math.max(0, Number(item.quantity) - alreadyPicked)
        if (!quantity) continue
        const itemRecord = Array.isArray(item.item) ? item.item[0] : item.item
        const activeAssignments = (item.booking_item_assets ?? []).filter((entry: any) => !entry.released_at)
        if (itemRecord?.tracking_mode === 'asset') {
          if (activeAssignments.length < Number(item.quantity)) throw new Error(`Scan ${Number(item.quantity) - activeAssignments.length} more asset tag(s) for ${item.item_name} before pickup`)
          const assetIds = activeAssignments.map((entry: any) => entry.asset_id)
          const { error: assetError } = await db.from('inventory_assets').update({ status: 'out', updated_at: now }).in('id', assetIds).in('status', ['reserved', 'available'])
          if (assetError) throw new Error(assetError.message)
        }
        await db.from('booking_item_fulfilments').insert({ business_id: booking.business_id, branch_id: booking.branch_id, booking_id: booking.id, booking_item_id: item.id, event_type: 'pickup', quantity, occurred_at: now, performed_by: user.id, idempotency_key: `pickup:${booking.id}:${item.id}:${alreadyPicked}` })
        await db.from('booking_items').update({ picked_up_quantity: alreadyPicked + quantity }).eq('id', item.id)
      }
    } else if (requestedStatus === 'returned') {
      if (!['picked_up', 'partially_returned'].includes(booking.status)) throw new Error(`Cannot return a ${booking.status} booking`)
      const requestedReturns = (body.returns ?? []) as ReturnInput[]
      for (const item of booking.booking_items) {
        const configured = requestedReturns.find((entry) => entry.bookingItemId === item.id)
        const remaining = Math.max(0, Number(item.picked_up_quantity || item.quantity) - Number(item.returned_quantity ?? 0))
        const quantity = configured ? Number(configured.quantity) : remaining
        if (quantity < 0 || quantity > remaining) throw new Error(`Invalid return quantity for ${item.item_name}`)
        if (!quantity) continue
        await db.from('booking_item_fulfilments').insert({ business_id: booking.business_id, branch_id: booking.branch_id, booking_id: booking.id, booking_item_id: item.id, event_type: 'return', quantity, occurred_at: now, performed_by: user.id, notes: configured?.notes || null, idempotency_key: `return:${booking.id}:${item.id}:${Number(item.returned_quantity ?? 0)}` })
        await db.from('booking_items').update({ returned_quantity: Number(item.returned_quantity ?? 0) + quantity }).eq('id', item.id)
        const unavailableQuantity = Math.min(quantity, Math.max(0, Number(configured?.unavailableQuantity ?? 0)))
        const itemRecord = Array.isArray(item.item) ? item.item[0] : item.item
        const activeAssignments = (item.booking_item_assets ?? []).filter((entry: any) => !entry.released_at)
        if (itemRecord?.tracking_mode === 'asset') {
          const selectedIds = Array.from(new Set(configured?.assetIds ?? []))
          if (selectedIds.length !== quantity) throw new Error(`Select exactly ${quantity} asset piece(s) returning for ${item.item_name}`)
          const assignedIds = new Set(activeAssignments.map((entry: any) => entry.asset_id))
          if (selectedIds.some((assetId) => !assignedIds.has(assetId))) throw new Error(`An asset selected for ${item.item_name} was not issued on this rental`)
          for (const [assetIndex, assetId] of selectedIds.entries()) {
            const unavailable = assetIndex < unavailableQuantity && configured?.reason
            const nextStatus = unavailable ? configured.reason : 'available'
            const { error: assetError } = await db.from('inventory_assets').update({ status: nextStatus, updated_at: now }).eq('id', assetId).eq('status', 'out')
            if (assetError) throw new Error(assetError.message)
            if (unavailable && configured?.reason) {
              await db.from('inventory_unavailability').insert({ business_id: booking.business_id, branch_id: booking.branch_id, item_id: item.item_id, item_variant_id: item.item_variant_id, inventory_asset_id: assetId, booking_item_id: item.id, reason: configured.reason, quantity: 1, notes: configured.notes || null, recorded_by: user.id })
            }
          }
          await db.from('booking_item_assets').update({ released_at: now, released_by: user.id }).eq('booking_item_id', item.id).in('asset_id', selectedIds).is('released_at', null)
        } else if (unavailableQuantity && configured?.reason) {
          await db.from('inventory_unavailability').insert({ business_id: booking.business_id, branch_id: booking.branch_id, item_id: item.item_id, item_variant_id: item.item_variant_id, booking_item_id: item.id, reason: configured.reason, quantity: unavailableQuantity, notes: configured.notes || null, recorded_by: user.id })
        }
      }
      const { data: refreshed } = await db.from('booking_items').select('quantity, picked_up_quantity, returned_quantity').eq('booking_id', booking.id)
      const complete = refreshed?.every((item: { quantity: number; picked_up_quantity: number; returned_quantity: number }) => Number(item.returned_quantity) >= Number(item.picked_up_quantity || item.quantity))
      finalStatus = complete ? 'returned' : 'partially_returned'
    } else if (requestedStatus === 'cancelled') {
      if (['picked_up', 'partially_returned'].includes(booking.status)) throw new Error('Return all issued items before cancelling this rental')
      const activeAssignments = booking.booking_items.flatMap((item: any) => (item.booking_item_assets ?? []).filter((entry: any) => !entry.released_at))
      const assetIds = activeAssignments.map((entry: any) => entry.asset_id)
      if (assetIds.length) {
        await db.from('inventory_assets').update({ status: 'available', updated_at: now }).in('id', assetIds).eq('status', 'reserved')
        await db.from('booking_item_assets').update({ released_at: now, released_by: user.id }).in('asset_id', assetIds).is('released_at', null)
      }
    } else if (!['closed', 'hold', 'confirmed'].includes(requestedStatus)) {
      throw new Error('Unsupported booking status')
    }

    const updates: Record<string, unknown> = { status: finalStatus, last_updated_by: user.id, updated_at: now }
    if (finalStatus === 'picked_up') { updates.actual_pickup_at = now; updates.pickup_completed_at = now }
    if (finalStatus === 'returned') { updates.actual_return_at = now; updates.return_completed_at = now }
    if (finalStatus === 'cancelled') updates.cancelled_at = now
    if (finalStatus === 'closed') updates.closed_at = now
    const { data: updated, error: updateError } = await db.from('bookings').update(updates).eq('id', booking.id).eq('business_id', staff.business_id).select('*').single()
    if (updateError) throw new Error(updateError.message)

    await Promise.all([
      db.from('booking_timeline').insert({ booking_id: booking.id, business_id: booking.business_id, event_type: `status.${finalStatus}`, event_description: `Booking changed from ${booking.status} to ${finalStatus}`, performed_by: user.id, old_values: { status: booking.status }, new_values: { status: finalStatus } }),
      db.from('audit_log').insert({ business_id: booking.business_id, branch_id: booking.branch_id, staff_id: user.id, action: 'booking.status_changed', table_name: 'bookings', record_id: booking.id, old_value: { status: booking.status }, new_value: { status: finalStatus } }),
      db.from('message_outbox').insert({ business_id: booking.business_id, branch_id: booking.branch_id, booking_id: booking.id, customer_id: booking.customer_id, channel: 'whatsapp', recipient: Array.isArray(booking.customer) ? booking.customer[0]?.phone : booking.customer?.phone, payload: { event_type: finalStatus, booking_number: booking.booking_number } }),
    ])
    return NextResponse.json({ success: true, booking: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Status update failed'
    console.error('Status update error:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
