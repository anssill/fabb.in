import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { NotionService } from '@/lib/notion'
import { WhatsAppService } from '@/lib/whatsapp'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function formatError(error: any): string {
  return error?.message || error?.code || 'Unknown error'
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status } = await req.json()
    const { id: bookingId } = await params

    // 1. Update Supabase
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .select('*, customer:customers(name, phone), booking_items(item_name, size)')
      .single()

    if (error) throw new Error(formatError(error))

    const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer
    const items = booking.booking_items || []

    // 2. Sync with Notion
    try {
      await NotionService.syncBooking({
        bookingNumber: booking.booking_number,
        customerName: customer?.name || 'Unknown',
        status: booking.status,
        pickupDate: booking.pickup_date,
        returnDate: booking.return_date,
        totalAmount: Number(booking.total_amount),
        balanceDue: Number(booking.balance_due),
        advancePaid: Number(booking.advance_paid),
        depositAmount: Number(booking.deposit_amount || 0),
        summary: items.map((i: any) => `${i.item_name} (${i.size})`).join(', ')
      }, booking.notion_page_id)
    } catch (err) {
      console.error('Notion Sync Error (Status Update):', err)
    }

    // 3. Optional WhatsApp Notification
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
