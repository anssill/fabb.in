import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { NotionService } from '@/lib/notion'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params

    // 1. Fetch booking with customer data
    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('id', bookingId)
      .single()

    if (bookingErr || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // 2. Fetch booking items to create a summary
    const { data: items } = await supabaseAdmin
      .from('booking_items')
      .select(`
        quantity,
        item:items(name)
      `)
      .eq('booking_id', bookingId)

    const itemSummary = items
      ?.map((i: any) => `${i.quantity}x ${i.item?.name}`)
      .join(', ') || 'No items'

    // 3. Sync to Notion
    const notionPageId = await NotionService.syncBooking({
      bookingNumber: booking.booking_number,
      customerName: booking.customer?.name || 'Unknown',
      status: booking.status,
      pickupDate: booking.pickup_date,
      returnDate: booking.return_date,
      totalAmount: booking.total_amount,
      balanceDue: booking.balance_due,
      advancePaid: booking.advance_paid,
      depositAmount: booking.deposit_amount,
      summary: itemSummary,
    }, booking.notion_page_id)

    // 4. Update booking with Notion Page ID if it's new
    if (notionPageId && notionPageId !== booking.notion_page_id) {
      await supabaseAdmin
        .from('bookings')
        .update({ notion_page_id: notionPageId })
        .eq('id', bookingId)
    }

    return NextResponse.json({ success: true, notionPageId })
  } catch (error: any) {
    console.error('Sync API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
