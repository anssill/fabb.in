import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { isValidUuid, safeJsonParse } from '@/lib/api-utils'
import { checklistRowsForBooking, taskRowsForBooking } from '@/lib/operations'

function getAdmin() {
  return createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function getContext(bookingId: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const admin = getAdmin()
  const { data: staff } = await admin
    .from('staff')
    .select('id, business_id, branch_id, status')
    .eq('id', user.id)
    .single()

  if (!staff || staff.status !== 'active' || !staff.branch_id) {
    throw new Error('Unauthorized staff')
  }

  const { data: booking, error } = await admin
    .from('bookings')
    .select('id, business_id, branch_id, created_by, pickup_date, return_date, status, balance_due, deposit_amount')
    .eq('id', bookingId)
    .eq('business_id', staff.business_id)
    .eq('branch_id', staff.branch_id)
    .single()

  if (error || !booking) throw new Error('Booking not found')
  return { admin: admin as any, staff, booking }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 })
    }

    const { admin, booking } = await getContext(id)

    await admin
      .from('booking_checklist_items')
      .upsert(checklistRowsForBooking(booking), { onConflict: 'booking_id,item_key', ignoreDuplicates: true })

    const { data: existingTasks } = await admin
      .from('booking_tasks')
      .select('task_type')
      .eq('booking_id', booking.id)

    const existingTaskTypes = new Set((existingTasks || []).map((task: any) => task.task_type))
    const missingTasks = taskRowsForBooking(booking).filter(task => !existingTaskTypes.has(task.task_type))
    if (missingTasks.length > 0) {
      await admin.from('booking_tasks').insert(missingTasks)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 })
    }

    const body = await safeJsonParse(req)
    const { admin, staff, booking } = await getContext(id)
    const now = new Date().toISOString()

    if (body.checklistItemId) {
      const completed = Boolean(body.isCompleted)
      const { error } = await admin
        .from('booking_checklist_items')
        .update({
          is_completed: completed,
          completed_by: completed ? staff.id : null,
          completed_at: completed ? now : null,
          updated_at: now,
        })
        .eq('id', body.checklistItemId)
        .eq('booking_id', booking.id)
      if (error) throw error
    }

    if (body.taskId && body.taskStatus) {
      const { error } = await admin
        .from('booking_tasks')
        .update({
          status: body.taskStatus,
          assigned_to: body.assignedTo || undefined,
          completed_at: body.taskStatus === 'done' ? now : null,
          updated_at: now,
        })
        .eq('id', body.taskId)
        .eq('booking_id', booking.id)
      if (error) throw error
    }

    if (body.notes) {
      const updates: Record<string, unknown> = { last_updated_by: staff.id }
      if ('handoff_notes' in body.notes) updates.handoff_notes = body.notes.handoff_notes || null
      if ('internal_notes' in body.notes) updates.internal_notes = body.notes.internal_notes || null
      const { error } = await admin
        .from('bookings')
        .update(updates)
        .eq('id', booking.id)
      if (error) throw error
    }

    if (body.itemId && body.itemUpdate) {
      const allowedFields = [
        'prep_status',
        'scan_status',
        'alteration_status',
        'accessory_notes',
        'bag_hanger_code',
        'condition_before_pickup',
      ]
      const updates = Object.fromEntries(
        Object.entries(body.itemUpdate).filter(([key]) => allowedFields.includes(key))
      )
      if (Object.keys(updates).length > 0) {
        const { error } = await admin
          .from('booking_items')
          .update({ ...updates, updated_at: now })
          .eq('id', body.itemId)
          .eq('booking_id', booking.id)
        if (error) throw error
      }
    }

    if (body.delivery) {
      const delivery = body.delivery
      const mode = delivery.mode || 'store_pickup'
      const status = delivery.status || (mode === 'store_pickup' ? 'pending' : 'pending')
      await admin.from('booking_delivery').upsert({
        business_id: booking.business_id,
        branch_id: booking.branch_id,
        booking_id: booking.id,
        mode,
        status,
        address: delivery.address || null,
        contact_person: delivery.contact_person || null,
        contact_phone: delivery.contact_phone || null,
        delivery_fee: Number(delivery.delivery_fee || 0),
        assigned_staff_id: delivery.assigned_staff_id || null,
        notes: delivery.notes || null,
        updated_at: now,
      }, { onConflict: 'booking_id' })

      const bookingStatus = status === 'out_for_delivery' ? 'out_for_delivery' : status === 'delivered' ? 'delivered' : undefined
      await admin.from('bookings').update({
        delivery_mode: mode,
        delivery_status: status,
        delivery_fee: Number(delivery.delivery_fee || 0),
        ...(bookingStatus ? { status: bookingStatus } : {}),
        last_updated_by: staff.id,
      }).eq('id', booking.id)
    }

    if (body.signature) {
      const signature = body.signature
      const { error } = await admin.from('booking_signatures').insert({
        business_id: booking.business_id,
        branch_id: booking.branch_id,
        booking_id: booking.id,
        signature_type: signature.type || 'rental_agreement',
        signer_name: signature.signer_name || null,
        signature_data: signature.signature_data || null,
        agreement_text: signature.agreement_text || null,
        captured_by: staff.id,
      })
      if (error) throw error
    }

    if (body.status) {
      const updates: Record<string, unknown> = { status: body.status, last_updated_by: staff.id }
      if (body.status === 'ready_for_pickup') {
        updates.ready_for_pickup_at = now
        updates.operation_status = 'ready_for_pickup'
      }
      if (body.status === 'in_washing') updates.operation_status = 'washing'

      const { error } = await admin
        .from('bookings')
        .update(updates)
        .eq('id', booking.id)
      if (error) throw error
    }

    revalidatePath(`/bookings/${booking.id}`)
    revalidatePath('/operations')
    revalidatePath('/dashboard')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 500 })
  }
}
