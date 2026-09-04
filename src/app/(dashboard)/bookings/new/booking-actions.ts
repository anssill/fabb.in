'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { calculateBillableRentalDays } from '@/lib/booking-utils'
import { createInternalNotification } from '../../notifications/notification-actions'

type BookingData = {
  customer: { id?: string; name: string; phone: string; email?: string; address?: string; id_type?: string; id_number?: string; id_proof_url?: string }
  items: { item_id: string; variant_id: string; name: string; sku?: string; size: string; price: number; quantity: number }[]
  dates: { pickup_date: string; return_date: string; event_date?: string; fitting_date?: string; occasion?: string; booking_source?: string; notes?: string; overbook_reason?: string }
  pricing: { subtotal: number; discount_amount?: number; discount_value?: number; discount_type?: string; tax_amount?: number; total_amount: number }
  payment: { advance_amount: number; deposit_amount?: number; method?: string; reference?: string; physical_bill_number?: string; notes?: string }
  staffId: string
  businessId: string
  branchId: string
}

export async function createNewBookingFlow(input: BookingData) {
  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: staff } = await supabase.from('staff').select('id, business_id, branch_id, role, permissions').eq('id', user.id).single()
  if (!staff?.business_id || staff.business_id !== input.businessId || staff.id !== input.staffId) return { success: false, error: 'Invalid business context' }

  let bookingId: string | null = null
  try {
    if (!input.dates.pickup_date || !input.dates.return_date || input.dates.pickup_date > input.dates.return_date) throw new Error('Choose a valid pickup and return period')
    if (!input.items.length) throw new Error('Add at least one rental item')

    const rpc = supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: { variant_id: string; shortage_quantity: number }[] | null; error: { message: string } | null }>
    const shortages: { variantId: string; shortage: number }[] = []
    for (const item of input.items) {
      const { data, error } = await rpc('get_rental_availability', {
        p_business_id: input.businessId, p_branch_id: input.branchId,
        p_from: input.dates.pickup_date, p_to: input.dates.return_date,
        p_item_id: item.item_id, p_variant_id: item.variant_id, p_requested_quantity: item.quantity,
      })
      if (error) throw new Error(error.message)
      const row = data?.find((entry) => entry.variant_id === item.variant_id)
      if (!row) throw new Error(`${item.name} / ${item.size} is not available at this branch`)
      if (row.shortage_quantity > 0) shortages.push({ variantId: item.variant_id, shortage: row.shortage_quantity })
    }
    if (shortages.length) {
      const permissions = (staff.permissions || {}) as Record<string, boolean>
      const canOverride = ['owner', 'super_admin'].includes(staff.role) || permissions.override_availability === true
      if (!canOverride) throw new Error('These dates exceed available stock. You do not have permission to overbook.')
      if (!input.dates.overbook_reason?.trim()) throw new Error('These dates exceed available stock. Enter an overbooking reason to continue.')
    }

    let customerId = input.customer.id
    if (!customerId) {
      const normalizedPhone = input.customer.phone.replace(/\D/g, '')
      const { data: existing } = await db.from('customers').select('id, phone').eq('business_id', input.businessId)
      const duplicate = existing?.find((customer: { id: string; phone: string }) => customer.phone.replace(/\D/g, '') === normalizedPhone)
      if (duplicate) {
        customerId = duplicate.id
        await db.from('customers').update({ name: input.customer.name, email: input.customer.email || null, address: input.customer.address || null, id_type: input.customer.id_type || null, id_number: input.customer.id_number || null, id_proof_url: input.customer.id_proof_url || null }).eq('id', customerId)
      } else {
        const { data: customer, error } = await db.from('customers').insert({
          business_id: input.businessId, branch_id: input.branchId, name: input.customer.name,
          phone: input.customer.phone, email: input.customer.email || null, address: input.customer.address || null,
          id_type: input.customer.id_type || null, id_number: input.customer.id_number || null,
          id_proof_url: input.customer.id_proof_url || null, created_by: user.id,
        }).select('id').single()
        if (error || !customer) throw new Error(error?.message || 'Could not create customer')
        customerId = customer.id
        await db.from('customer_phones').insert({ business_id: input.businessId, customer_id: customer.id, phone: input.customer.phone, label: 'Primary', is_primary: true })
      }
    }

    const { data: branch } = await supabase.from('branches').select('prefix').eq('id', input.branchId).single()
    const bookingNumber = `${branch?.prefix || 'FAB'}-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`
    const rentalDays = calculateBillableRentalDays(input.dates.pickup_date, input.dates.return_date)
    const { data: booking, error: bookingError } = await db.from('bookings').insert({
      business_id: input.businessId, branch_id: input.branchId, customer_id: customerId,
      created_by: user.id, booking_number: bookingNumber, status: 'confirmed',
      pickup_date: input.dates.pickup_date, return_date: input.dates.return_date,
      event_date: input.dates.event_date || null, fitting_date: input.dates.fitting_date || null,
      subtotal: input.pricing.subtotal, discount_amount: input.pricing.discount_amount ?? 0,
      discount_reason: (input.pricing.discount_value ?? 0) > 0 ? `${input.pricing.discount_type === 'percentage' ? `${input.pricing.discount_value}%` : `₹${input.pricing.discount_value}`} discount` : null,
      tax_amount: input.pricing.tax_amount ?? 0, total_amount: input.pricing.total_amount,
      advance_amount: input.payment.advance_amount, amount_paid: input.payment.advance_amount,
      deposit_amount: input.payment.deposit_amount ?? 0,
      balance_due: Math.max(0, input.pricing.total_amount - input.payment.advance_amount),
      occasion: input.dates.occasion || null, booking_source: input.dates.booking_source || 'walk_in',
      notes: input.dates.notes || null, physical_bill_number: input.payment.physical_bill_number?.trim() || null,
      overbook_reason: shortages.length ? input.dates.overbook_reason!.trim() : null,
      overbooked_by: shortages.length ? user.id : null, overbooked_at: shortages.length ? new Date().toISOString() : null,
    }).select('id').single()
    if (bookingError || !booking) throw new Error(bookingError?.message || 'Could not create booking')
    bookingId = booking.id

    const { error: itemError } = await db.from('booking_items').insert(input.items.map((item) => ({
      business_id: input.businessId, branch_id: input.branchId, booking_id: booking.id,
      item_id: item.item_id, item_variant_id: item.variant_id, item_name: item.name,
      item_sku: item.sku || null, size: item.size, quantity: item.quantity, price: item.price,
      rental_days: rentalDays, subtotal: item.price * item.quantity * rentalDays,
    })))
    if (itemError) throw new Error(itemError.message)

    if (input.payment.advance_amount > 0) {
      const { error } = await (supabase.rpc as any)('post_booking_payment', { p_booking_id: booking.id, p_payment_type: 'advance', p_amount: input.payment.advance_amount, p_payment_method: input.payment.method || 'cash', p_reference_number: input.payment.reference || null, p_note: input.payment.notes || null, p_idempotency_key: `booking:${booking.id}:advance` })
      if (error) throw new Error(error.message)
    }
    if ((input.payment.deposit_amount ?? 0) > 0) {
      const { error } = await (supabase.rpc as any)('post_booking_payment', { p_booking_id: booking.id, p_payment_type: 'deposit', p_amount: input.payment.deposit_amount, p_payment_method: input.payment.method || 'cash', p_reference_number: input.payment.reference || null, p_note: input.payment.notes || null, p_idempotency_key: `booking:${booking.id}:deposit` })
      if (error) throw new Error(error.message)
    }

    await Promise.all([
      db.from('audit_log').insert({ business_id: input.businessId, branch_id: input.branchId, staff_id: user.id, action: 'booking.created', table_name: 'bookings', record_id: booking.id, new_value: { booking_number: bookingNumber, pickup_date: input.dates.pickup_date, return_date: input.dates.return_date, shortages, total: input.pricing.total_amount } }),
      db.from('message_outbox').insert({ business_id: input.businessId, branch_id: input.branchId, booking_id: booking.id, customer_id: customerId, channel: 'whatsapp', recipient: input.customer.phone, payload: { event_type: 'booking_confirmed', template: 'booking_confirmation_v1', variables: [input.customer.name, bookingNumber, input.dates.pickup_date] } }),
    ])
    await createInternalNotification({ title: 'Rental confirmed', body: `${input.customer.name} · ${bookingNumber} · pickup ${input.dates.pickup_date}`, type: 'success', actionUrl: `/bookings/${booking.id}` })

    revalidatePath('/bookings'); revalidatePath('/inventory'); revalidatePath('/dashboard')
    return { success: true, bookingId: booking.id, bookingNumber }
  } catch (error) {
    if (bookingId) {
      await db.from('financial_entries').delete().eq('booking_id', bookingId)
      await db.from('deposit_ledger').delete().eq('booking_id', bookingId)
      await db.from('booking_payments').delete().eq('booking_id', bookingId)
      await db.from('booking_items').delete().eq('booking_id', bookingId)
      await db.from('bookings').delete().eq('id', bookingId)
    }
    const message = error instanceof Error ? error.message : 'Booking could not be created'
    console.error('Booking flow error:', message)
    return { success: false, error: message }
  }
}
