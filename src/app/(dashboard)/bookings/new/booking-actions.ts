'use server'

import { createClient } from '@/lib/supabase/server'

import { createInternalNotification } from '../../notifications/notification-actions'
import { revalidatePath } from 'next/cache'
import { NotionService } from '@/lib/notion'
import { WhatsAppService } from '@/lib/whatsapp'

interface BookingData {
  customer: {
    id?: string
    name: string
    phone: string
    email?: string
    address?: string
    id_type?: string
    id_number?: string
    id_proof_url?: string
  }
  items: any[]
  dates: any
  pricing: any
  payment: any
  staffId: string
  businessId: string
  branchId: string
}

export async function createNewBookingFlow(data: BookingData) {
  const supabase = await createClient()
  
  try {
    // 1. Upsert customer
    let customerId = data.customer.id
    if (!customerId) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', data.customer.phone)
        .eq('business_id', data.businessId)
        .eq('branch_id', data.branchId)
        .maybeSingle()

      if (existingCustomer) {
        customerId = existingCustomer.id
        
        // Update the existing customer with any new details they provided
        await supabase.from('customers').update({
          name: data.customer.name,
          email: data.customer.email || undefined,
          address: data.customer.address || undefined,
          id_type: data.customer.id_type || undefined,
          id_number: data.customer.id_number || undefined,
          id_proof_url: data.customer.id_proof_url || undefined,
        }).eq('id', customerId)
        
      } else {
        const { data: newCustomer, error: custErr } = await supabase
          .from('customers')
          .insert({
            business_id: data.businessId,
            branch_id: data.branchId,
            name: data.customer.name,
            phone: data.customer.phone,
            email: data.customer.email || null,
            address: data.customer.address || null,
            id_type: data.customer.id_type || null,
            id_number: data.customer.id_number || null,
            id_proof_url: data.customer.id_proof_url || null,
          })
          .select('id')
          .single()
        if (custErr) throw custErr
        customerId = newCustomer!.id
      }
    }

    // 2. Generate booking number
    const { data: branch } = await supabase
      .from('branches')
      .select('prefix')
      .eq('id', data.branchId)
      .single()
    
    const prefix = branch?.prefix || 'FAB'
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '')
    const randomSuffix = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')
    const bookingNumber = `${prefix}-${dateStr}-${randomSuffix}`

    // 3. Create booking
    const rentalDays = Math.max(1, Math.ceil(
      (new Date(data.dates.return_date).getTime() - new Date(data.dates.pickup_date).getTime()) / (1000 * 60 * 60 * 24)
    ))

    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .insert({
        business_id: data.businessId,
        branch_id: data.branchId,
        customer_id: customerId,
        created_by: data.staffId,
        booking_number: bookingNumber,
        status: 'booked',
        pickup_date: data.dates.pickup_date,
        return_date: data.dates.return_date,
        subtotal: data.pricing.subtotal,
        discount_amount: data.pricing.discount_amount ?? 0,
        discount_reason: data.pricing.discount_value > 0
          ? `${data.pricing.discount_type === 'percentage' ? data.pricing.discount_value + '%' : '₹' + data.pricing.discount_value} discount`
          : null,
        tax_amount: data.pricing.tax_amount ?? 0,
        total_amount: data.pricing.total_amount,
        advance_amount: data.payment.advance_amount,
        deposit_amount: data.payment.deposit_amount ?? 0,
        balance_due: Math.max(0, data.pricing.total_amount - data.payment.advance_amount - (data.payment.deposit_amount ?? 0)),
        occasion: data.dates.occasion || null,
        booking_source: data.dates.booking_source || 'walk_in',
        notes: data.dates.notes || null,
      })
      .select('id')
      .single()
    if (bookingErr) throw bookingErr

    // 4. Create booking items
    const bookingItems = data.items.map((item) => ({
      booking_id: booking!.id,
      item_id: item.item_id,
      item_variant_id: item.variant_id,
      item_name: item.name,
      item_sku: item.sku || null,
      size: item.size,
      quantity: item.quantity,
      price: item.price,
      rental_days: rentalDays,
    }))
    const { error: itemsErr } = await supabase.from('booking_items').insert(bookingItems)
    if (itemsErr) throw itemsErr

    // 4.1 Update Stock and Sync to Notion
    for (const item of data.items) {
      // Atomic stock reservation
      await supabase.rpc('lock_item_stock', {
        p_variant_id: item.variant_id,
        p_quantity: item.quantity,
      })

      // Fetch all variants for this item to generate updated Notion summary
      const { data: variants } = await supabase
        .from('item_variants')
        .select('size, total_stock, available_stock')
        .eq('item_id', item.item_id)

      const { data: parentItem } = await supabase
        .from('items')
        .select('notion_page_id')
        .eq('id', item.item_id)
        .maybeSingle()

      if (parentItem?.notion_page_id && variants) {
        const stockSummary = variants.map(v => `${v.size}: ${v.available_stock}/${v.total_stock}`).join(', ')
        await NotionService.syncItemStock(parentItem.notion_page_id, stockSummary)
      }
    }

    // 5. Record advance payment
    if (data.payment.advance_amount > 0) {
      await supabase.from('booking_payments').insert({
        booking_id: booking!.id,
        business_id: data.businessId,
        branch_id: data.branchId,
        type: 'advance',
        amount: data.payment.advance_amount,
        method: data.payment.method || 'cash',
        collected_by: data.staffId,
        reference_number: data.payment.reference || null,
        notes: data.payment.notes || null,
      })
    }

    // 5b. Record deposit if collected now
    if ((data.payment.deposit_amount ?? 0) > 0) {
      await supabase.from('booking_payments').insert({
        booking_id: booking!.id,
        business_id: data.businessId,
        branch_id: data.branchId,
        type: 'deposit',
        amount: data.payment.deposit_amount,
        method: data.payment.method || 'cash',
        collected_by: data.staffId,
      })
    }

    // 6. Audit log
    await supabase.from('audit_log').insert({
      business_id: data.businessId,
      staff_id: data.staffId,
      action: 'CREATE_BOOKING',
      table_name: 'bookings',
      record_id: booking!.id,
      new_value: { booking_number: bookingNumber, total: data.pricing.total_amount },
    })

    // 7. Trigger Notification (Staff)
    await createInternalNotification({
      title: 'New Booking Created',
      body: `${data.customer.name} booked ${data.items.length} items for ${data.dates.event_date}. Booking: ${bookingNumber}`,
      type: 'success',
      actionUrl: `/bookings/${booking!.id}`
    })

    // 8. Trigger Notion Sync
    try {
      const notionPageId = await NotionService.syncBooking({
        bookingNumber,
        customerName: data.customer.name,
        status: 'booked',
        pickupDate: data.dates.pickup_date,
        returnDate: data.dates.return_date,
        totalAmount: data.pricing.total_amount,
        balanceDue: data.pricing.total_amount - data.payment.advance_amount,
        advancePaid: data.payment.advance_amount,
        depositAmount: 0, // Fallback if not specified
        summary: data.items.map(i => `${i.name} (${i.size})`).join(', ')
      })

      if (notionPageId) {
        await supabase
          .from('bookings')
          .update({ notion_page_id: notionPageId })
          .eq('id', booking!.id)
      }
    } catch (err) {
      console.error('Failed to sync with Notion:', err)
      // We don't throw here to ensure the booking creation is still considered successful
    }

    // 9. Trigger WhatsApp Confirmation
    try {
      await WhatsAppService.sendTemplate({
        phoneNumber: data.customer.phone,
        templateName: 'booking_confirmation_v1', // Replace with your approved template name
        variables: [data.customer.name, bookingNumber, data.dates.pickup_date],
      })

      // Log the WhatsApp action
      await supabase.from('sms_log').insert({
        business_id: data.businessId,
        branch_id: data.branchId,
        customer_id: customerId,
        booking_id: booking!.id,
        phone: data.customer.phone,
        template_id: 'booking_confirmation_v1',
        status: 'sent',
        message: `Vars: ${data.customer.name}, ${bookingNumber}`
      })
    } catch (err) {
      console.error('Failed to send WhatsApp:', err)
    }

    revalidatePath('/bookings')
    revalidatePath('/dashboard')
    
    return { success: true, bookingId: booking!.id, bookingNumber }
  } catch (error: any) {
    console.error('Booking Flow Error:', error)
    return { success: false, error: error.message }
  }
}
