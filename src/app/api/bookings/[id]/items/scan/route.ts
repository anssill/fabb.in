import { NextRequest, NextResponse } from 'next/server'
import { safeJsonParse, isValidUuid } from '@/lib/api-utils'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params
  if (!isValidUuid(bookingId)) return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 })

  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { sku } = await safeJsonParse(request)
    if (!String(sku || '').trim()) throw new Error('Scan an item SKU or asset code')

    const { data: staff } = await supabase.from('staff').select('business_id, status, role, permissions').eq('id', user.id).single()
    if (!staff?.business_id || !['active', 'approved'].includes(staff.status)) {
      return NextResponse.json({ error: 'Unauthorized staff' }, { status: 403 })
    }
    const permissions = (staff.permissions || {}) as Record<string, boolean>
    if (!['owner', 'super_admin'].includes(staff.role) && permissions.manage_bookings !== true) {
      return NextResponse.json({ error: 'Booking permission required' }, { status: 403 })
    }

    const { data: booking } = await db.from('bookings').select('id, status, business_id, branch_id').eq('id', bookingId).eq('business_id', staff.business_id).single()
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    let { data: bookingItem } = await db.from('booking_items')
      .select('id, item_id, item_variant_id, item_name, item_sku, size, quantity, picked_up_quantity, returned_quantity')
      .eq('booking_id', bookingId)
      .eq('item_sku', String(sku).trim())
      .maybeSingle()

    let asset = null
    if (!bookingItem) {
      const result = await db.from('inventory_assets')
        .select('id, asset_code, item_id, item_variant_id, status')
        .eq('business_id', staff.business_id)
        .eq('asset_code', String(sku).trim())
        .maybeSingle()
      asset = result.data
      if (asset) {
        const itemResult = await db.from('booking_items')
          .select('id, item_id, item_variant_id, item_name, item_sku, size, quantity, picked_up_quantity, returned_quantity')
          .eq('booking_id', bookingId)
          .eq('item_id', asset.item_id)
          .eq('item_variant_id', asset.item_variant_id)
          .maybeSingle()
        bookingItem = itemResult.data
      }
    }

    if (!bookingItem) return NextResponse.json({ error: `${sku} is not part of this booking` }, { status: 404 })

    let assigned = false
    if (asset && ['confirmed', 'hold'].includes(booking.status)) {
      const { data: existingAssignment } = await db.from('booking_item_assets').select('booking_item_id').eq('asset_id', asset.id).is('released_at', null).maybeSingle()
      if (existingAssignment && existingAssignment.booking_item_id !== bookingItem.id) {
        return NextResponse.json({ error: `Asset ${asset.asset_code} is already assigned to another rental` }, { status: 409 })
      }
      if (!existingAssignment) {
        if (asset.status !== 'available') return NextResponse.json({ error: `Asset ${asset.asset_code} is currently ${asset.status}` }, { status: 409 })
        const { error: assignmentError } = await db.from('booking_item_assets').insert({ business_id: staff.business_id, booking_item_id: bookingItem.id, asset_id: asset.id, assigned_by: user.id })
        if (assignmentError) throw new Error(assignmentError.message)
        const { error: assetError } = await db.from('inventory_assets').update({ status: 'reserved', updated_at: new Date().toISOString() }).eq('id', asset.id).eq('status', 'available')
        if (assetError) throw new Error(assetError.message)
        await db.from('audit_log').insert({ business_id: staff.business_id, branch_id: booking.branch_id, staff_id: user.id, action: 'booking.asset_assigned', table_name: 'booking_item_assets', record_id: asset.id, new_value: { booking_id: bookingId, booking_item_id: bookingItem.id, asset_code: asset.asset_code } })
        assigned = true
      }
    } else if (asset && ['picked_up', 'partially_returned'].includes(booking.status)) {
      const { data: existingAssignment } = await db.from('booking_item_assets').select('booking_item_id').eq('booking_item_id', bookingItem.id).eq('asset_id', asset.id).is('released_at', null).maybeSingle()
      if (!existingAssignment) return NextResponse.json({ error: `Asset ${asset.asset_code} was not issued on this rental` }, { status: 409 })
    }

    const action = assigned
      ? 'Assigned for pickup'
      : ['confirmed', 'hold'].includes(booking.status)
        ? 'Ready for pickup'
      : ['picked_up', 'partially_returned'].includes(booking.status)
        ? 'Ready for return'
        : 'Verified'

    return NextResponse.json({
      success: true,
      message: `${action}: ${bookingItem.item_name}`,
      item: bookingItem,
      asset,
      assigned,
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Scan failed' }, { status: 400 })
  }
}
