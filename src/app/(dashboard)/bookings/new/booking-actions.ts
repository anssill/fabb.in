'use server'

import { createClient } from '@/lib/supabase/server'

import { createInternalNotification } from '../../notifications/notification-actions'
import { revalidatePath } from 'next/cache'
import { NotionService } from '@/lib/notion'
import { WhatsAppService } from '@/lib/whatsapp'
import { resolveRentalDays } from '@/lib/booking-utils'
import { checklistRowsForBooking, taskRowsForBooking } from '@/lib/operations'
import { sendBusinessPush, sendRolePush } from '@/lib/notifications/send-push'

interface BookingData {
  customer: {
    id?: string
    name: string
    phone: string
    alternate_phone?: string
    emergency_phone?: string
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
    const alternatePhone = data.customer.alternate_phone?.trim() || null
    const emergencyPhone = data.customer.emergency_phone?.trim() || null

    const { data: staffContext, error: staffContextErr } = await supabase
      .from('staff')
      .select('id, business_id, branch_id, status')
      .eq('id', data.staffId)
      .eq('business_id', data.businessId)
      .single()

    if (staffContextErr || !staffContext || staffContext.status !== 'active') {
      throw new Error('Could not verify active staff context')
    }

    if (staffContext.branch_id !== data.branchId) {
      throw new Error('Active branch changed. Please refresh and create the booking again.')
    }

    const variantIds = data.items.map((item) => item.variant_id).filter(Boolean)
    if (variantIds.length > 0) {
      const { data: branchVariants, error: branchVariantErr } = await supabase
        .from('item_variants')
        .select('id, available_stock, items!inner(branch_id, business_id)')
        .in('id', variantIds)
        .eq('items.business_id', data.businessId)
        .eq('items.branch_id', data.branchId)

      if (branchVariantErr) throw branchVariantErr

      const validVariantIds = new Set((branchVariants || []).map((variant) => variant.id))
      if (variantIds.some((variantId) => !validVariantIds.has(variantId))) {
        throw new Error('One or more selected items are not in the active branch.')
      }

      const requestedByVariant = data.items.reduce((acc: Record<string, number>, item) => {
        acc[item.variant_id] = (acc[item.variant_id] || 0) + (Number(item.quantity) || 1)
        return acc
      }, {})
      const unavailableVariant = (branchVariants || []).find((variant) => {
        const requested = requestedByVariant[variant.id] || 0
        return requested > Number((variant as any).available_stock || 0)
      })

      if (unavailableVariant) {
        throw new Error('One of the selected sizes is no longer available. Please remove it or choose another size.')
      }
    }

    // 1. Upsert customer
    let customerId = data.customer.id
    if (customerId) {
      const { data: existingCustomer, error: existingCustomerErr } = await supabase
        .from('customers')
        .select('id')
        .eq('id', customerId)
        .eq('business_id', data.businessId)
        .eq('branch_id', data.branchId)
        .single()

      if (existingCustomerErr || !existingCustomer) {
        throw new Error('Selected customer is not in the active branch.')
      }

      const customerUpdates = {
        name: data.customer.name,
        email: data.customer.email || undefined,
        address: data.customer.address || undefined,
        alternate_phone: alternatePhone,
        emergency_phone: emergencyPhone,
        id_type: data.customer.id_type || undefined,
        id_number: data.customer.id_number || undefined,
        id_proof_url: data.customer.id_proof_url || undefined,
      }

      const { error: updateCustomerErr } = await supabase
        .from('customers')
        .update(customerUpdates)
        .eq('id', customerId)
        .eq('business_id', data.businessId)
        .eq('branch_id', data.branchId)

      if (updateCustomerErr) throw updateCustomerErr
    } else {
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
        const { error: updateCustomerErr } = await supabase
          .from('customers')
          .update({
            name: data.customer.name,
            email: data.customer.email || undefined,
            address: data.customer.address || undefined,
            alternate_phone: alternatePhone,
            emergency_phone: emergencyPhone,
            id_type: data.customer.id_type || undefined,
            id_number: data.customer.id_number || undefined,
            id_proof_url: data.customer.id_proof_url || undefined,
          })
          .eq('id', customerId)
          .eq('business_id', data.businessId)
          .eq('branch_id', data.branchId)

        if (updateCustomerErr) throw updateCustomerErr
        
      } else {
        const { data: newCustomer, error: custErr } = await supabase
          .from('customers')
          .insert({
            business_id: data.businessId,
            branch_id: data.branchId,
            name: data.customer.name,
            phone: data.customer.phone,
            alternate_phone: alternatePhone,
            emergency_phone: emergencyPhone,
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
    const rentalDays = resolveRentalDays(data.dates.pickup_date, data.dates.return_date, data.dates.rental_days_override)
    const customerRequests = Array.isArray(data.dates.customer_requests)
      ? data.dates.customer_requests.map((request: string) => request.trim()).filter(Boolean)
      : []
    const bookingNotes = [
      customerRequests.length > 0 ? `Customer requests: ${customerRequests.join(', ')}` : null,
      data.dates.notes?.trim() || null,
    ].filter(Boolean).join('\n\n') || null
    const advanceAmount = Math.min(Math.max(Number(data.payment.advance_amount) || 0, 0), Number(data.pricing.total_amount) || 0)
    const depositAmount = Math.max(Number(data.payment.deposit_amount) || 0, 0)
    const balanceDue = Math.max(0, data.pricing.total_amount - advanceAmount - depositAmount)

    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .insert({
        business_id: data.businessId,
        branch_id: data.branchId,
        customer_id: customerId,
        created_by: data.staffId,
        booking_number: bookingNumber,
        status: 'booked',
        operation_status: data.dates.fitting_date ? 'fitting' : 'booking_desk',
        fitting_at: data.dates.fitting_date ? `${data.dates.fitting_date}T11:00:00+05:30` : null,
        fitting_status: data.dates.fitting_date ? 'scheduled' : 'not_required',
        delivery_mode: Number(data.pricing.delivery_fee || 0) > 0 ? 'store_delivery' : 'store_pickup',
        delivery_status: Number(data.pricing.delivery_fee || 0) > 0 ? 'pending' : 'not_required',
        delivery_fee: Number(data.pricing.delivery_fee || 0),
        pickup_date: data.dates.pickup_date,
        return_date: data.dates.return_date,
        subtotal: data.pricing.subtotal,
        discount_amount: data.pricing.discount_amount ?? 0,
        discount_reason: data.pricing.discount_value > 0
          ? `${data.pricing.discount_type === 'percentage' ? data.pricing.discount_value + '%' : '₹' + data.pricing.discount_value} discount`
          : null,
        tax_amount: data.pricing.tax_amount ?? 0,
        total_amount: data.pricing.total_amount,
        advance_amount: advanceAmount,
        deposit_amount: depositAmount,
        balance_due: balanceDue,
        occasion: data.dates.occasion || null,
        booking_source: data.dates.booking_source || 'walk_in',
        notes: bookingNotes,
        physical_bill_number: data.payment.physical_bill_number?.trim() || null,
      } as any)
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

    await (supabase as any)
      .from('booking_checklist_items')
      .upsert(checklistRowsForBooking({
        id: booking!.id,
        business_id: data.businessId,
        branch_id: data.branchId,
      }), { onConflict: 'booking_id,item_key', ignoreDuplicates: true })

    await (supabase as any)
      .from('booking_tasks')
      .insert(taskRowsForBooking({
        id: booking!.id,
        business_id: data.businessId,
        branch_id: data.branchId,
        pickup_date: data.dates.pickup_date,
        return_date: data.dates.return_date,
        created_by: data.staffId,
      }))

    if (Number(data.pricing.delivery_fee || 0) > 0) {
      await (supabase as any).from('booking_delivery').upsert({
        business_id: data.businessId,
        branch_id: data.branchId,
        booking_id: booking!.id,
        mode: 'store_delivery',
        status: 'pending',
        address: data.customer.address || null,
        contact_person: data.customer.name,
        contact_phone: data.customer.phone,
        delivery_fee: Number(data.pricing.delivery_fee || 0),
      }, { onConflict: 'booking_id' })
    }

    // 4.1 Update Stock and Sync to Notion
    const lockedItems: Array<{ variantId: string; quantity: number }> = []
    for (const item of data.items) {
      // Atomic stock reservation
      const { error: lockErr } = await supabase.rpc('lock_item_stock', {
        p_variant_id: item.variant_id,
        p_quantity: item.quantity,
      })
      if (lockErr) {
        for (const locked of lockedItems) {
          await supabase.rpc('cancel_booking_stock', {
            p_variant_id: locked.variantId,
            p_quantity: locked.quantity,
          })
        }
        await supabase.from('bookings').delete().eq('id', booking!.id)
        throw new Error('One of the selected sizes is no longer available. Please remove it or choose another size.')
      }
      lockedItems.push({ variantId: item.variant_id, quantity: item.quantity })

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
    if (advanceAmount > 0) {
      await supabase.from('booking_payments').insert({
        booking_id: booking!.id,
        business_id: data.businessId,
        branch_id: data.branchId,
        type: 'advance',
        amount: advanceAmount,
        method: data.payment.method || 'cash',
        collected_by: data.staffId,
        reference_number: data.payment.reference || null,
        notes: data.payment.notes || null,
      })
      await sendRolePush({
        businessId: data.businessId,
        roles: ['owner', 'manager', 'super_admin'],
        title: 'Payment recorded',
        body: `Advance payment of Rs ${advanceAmount.toLocaleString('en-IN')} recorded for ${bookingNumber}.`,
        url: `/bookings/${booking!.id}`,
      })
    }

    // 5b. Record deposit if collected now
    if (depositAmount > 0) {
      await supabase.from('booking_payments').insert({
        booking_id: booking!.id,
        business_id: data.businessId,
        branch_id: data.branchId,
        type: 'deposit',
        amount: depositAmount,
        method: data.payment.method || 'cash',
        collected_by: data.staffId,
      })
      await sendRolePush({
        businessId: data.businessId,
        roles: ['owner', 'manager', 'super_admin'],
        title: 'Payment recorded',
        body: `Deposit of Rs ${depositAmount.toLocaleString('en-IN')} recorded for ${bookingNumber}.`,
        url: `/bookings/${booking!.id}`,
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
    await sendBusinessPush({
      businessId: data.businessId,
      title: 'New booking created',
      body: `${data.customer.name} booked ${data.items.length} item${data.items.length !== 1 ? 's' : ''}. Booking: ${bookingNumber}`,
      url: `/bookings/${booking!.id}`,
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
        balanceDue,
        advancePaid: advanceAmount,
        depositAmount,
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
