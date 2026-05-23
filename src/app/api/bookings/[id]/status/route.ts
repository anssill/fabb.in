import { NextRequest, NextResponse } from 'next/server'
import { safeJsonParse, isValidUuid } from '@/lib/api-utils'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NotionService } from '@/lib/notion'
import { WhatsAppService } from '@/lib/whatsapp'

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseAdmin = getAdmin()
    const { status, itemConditions, itemNotes } = await safeJsonParse(req)
    const { id: bookingId } = await params
    
    if (!isValidUuid(bookingId)) {
      return NextResponse.json({ error: 'Invalid booking ID format' }, { status: 400 })
    }

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: staff } = await supabaseAdmin
      .from('staff')
      .select('id, business_id, branch_id, status')
      .eq('id', user.id)
      .single()

    if (!staff || staff.status !== 'active' || !staff.branch_id) {
      return NextResponse.json({ error: 'Unauthorized staff' }, { status: 403 })
    }

    const staffId = staff.id

    // 1. Fetch current booking items for synchronization
    const { data: bookingWithItems, error: fetchErr } = await supabaseAdmin
      .from('bookings')
      .select('*, customer:customers(name, phone), booking_items(*)')
      .eq('id', bookingId)
      .eq('business_id', staff.business_id)
      .eq('branch_id', staff.branch_id)
      .single()

    if (fetchErr) throw new Error(formatError(fetchErr))

    // 2. Perform Inventory Synchronization based on status transition
    if (status === 'returned' && bookingWithItems.status !== 'returned') {
      // Transition to Returned: Move items to washing queue and decrement reserved stock
      for (const item of bookingWithItems.booking_items) {
        // A. Update condition on the booking item record
        const condition = itemConditions?.[item.id] || 'good'
        const notes = itemNotes?.[item.id] || ''

        await supabaseAdmin
          .from('booking_items')
          .update({
            condition_on_return: condition,
            condition_notes_on_return: notes.trim() || null
          })
          .eq('id', item.id)

        // B. Decrement reserved stock (dont add to available yet)
        await supabaseAdmin.rpc('return_item_from_booking', {
          p_variant_id: item.item_variant_id,
          p_quantity: item.quantity
        })

        // C. Determine washing queue stage
        // Mapping: damaged/missing -> maintenance, others -> in_washing
        let queueStage = 'in_washing'
        if (condition === 'damaged' || condition === 'missing') {
          queueStage = 'maintenance'
        }

        // D. Add one washing queue row per physical unit so every ready click restores one unit.
        const queueRows = Array.from({ length: Math.max(1, Number(item.quantity) || 1) }, () => ({
            business_id: bookingWithItems.business_id,
            branch_id: bookingWithItems.branch_id,
            item_id: item.item_id,
            item_variant_id: item.item_variant_id,
            booking_id: bookingId,
            added_by: staffId,
            stage: queueStage,
            priority: 'normal',
            notes: notes.trim() || null,
            condition_after: condition
          }))

        await supabaseAdmin.from('washing_queue').insert(queueRows)

        // E. Update item lifecycle status
        await supabaseAdmin.from('items')
          .update({ status: queueStage }) // Use same stage (in_washing or maintenance)
          .eq('id', item.item_id)
      }
    } else if (status === 'cancelled' && bookingWithItems.status !== 'cancelled') {
        // Transition to Cancelled: Move items back to available stock
        for (const item of bookingWithItems.booking_items) {
          await supabaseAdmin.rpc('cancel_booking_stock', {
            p_variant_id: item.item_variant_id,
            p_quantity: item.quantity
          })
        }
    }

    // 3. Update Booking Status
    const { data: booking, error: updateErr } = await supabaseAdmin
      .from('bookings')
      .update({ 
        status,
        pickup_completed_at: status === 'out' ? new Date().toISOString() : bookingWithItems.pickup_completed_at,
        return_completed_at: status === 'returned' ? new Date().toISOString() : bookingWithItems.return_completed_at,
        cancelled_at: status === 'cancelled' ? new Date().toISOString() : bookingWithItems.cancelled_at,
        last_updated_by: staffId
      })
      .eq('id', bookingId)
      .eq('business_id', staff.business_id)
      .eq('branch_id', staff.branch_id)
      .select('*, customer:customers(name, phone), booking_items(item_name, size)')
      .single()

    if (updateErr) throw new Error(formatError(updateErr))

    const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer
    const items = booking.booking_items || []

    // 4. Sync with Notion
    try {
      await NotionService.syncBooking({
        bookingNumber: booking.booking_number,
        customerName: customer?.name || 'Unknown',
        status: booking.status,
        pickupDate: booking.pickup_date,
        returnDate: booking.return_date,
        totalAmount: Number(booking.total_amount),
        balanceDue: Number(booking.balance_due),
        advancePaid: Number(booking.advance_amount),
        depositAmount: Number(booking.deposit_amount || 0),
        summary: items.map((i: any) => `${i.item_name} (${i.size})`).join(', ')
      }, booking.notion_page_id)
    } catch (err) {
      console.error('Notion Sync Error (Status Update):', err)
    }

    // 5. Audit Log
    await supabaseAdmin.from('audit_log').insert({
      business_id: booking.business_id,
      branch_id: booking.branch_id,
      staff_id: staffId,
      action: 'UPDATE_BOOKING_STATUS',
      table_name: 'bookings',
      record_id: bookingId,
      old_value: { status: bookingWithItems.status },
      new_value: { status: booking.status }
    })

    // 6. Optional WhatsApp Notification
    try {
      if (status === 'out' && customer?.phone) {
        await WhatsAppService.sendTemplate({
          phoneNumber: customer.phone,
          templateName: 'item_pickup_v1',
          variables: [customer.name, booking.booking_number],
        })
      } else if (status === 'returned' && customer?.phone) {
        await WhatsAppService.sendTemplate({
          phoneNumber: customer.phone,
          templateName: 'item_return_v1',
          variables: [customer.name, booking.booking_number],
        })
      }
    } catch (err) {
      console.error('WhatsApp Status Notification Error:', err)
    }

    return NextResponse.json({ success: true, booking })
  } catch (error: any) {
    console.error('Status Update API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
