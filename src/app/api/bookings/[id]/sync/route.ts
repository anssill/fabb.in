import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NotionService } from '@/lib/notion'
import { isValidUuid } from '@/lib/api-utils'

function getAdmin() {
  return createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseAdmin = getAdmin()
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
      .select('id, business_id, status')
      .eq('id', user.id)
      .single()

    if (!staff || staff.status === 'suspended' || staff.status === 'rejected') {
      return NextResponse.json({ error: 'Unauthorized staff' }, { status: 403 })
    }

    // 1. Fetch booking with customer data
    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('id', bookingId)
      .eq('business_id', staff.business_id)
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
      advancePaid: booking.advance_amount,
      depositAmount: booking.deposit_amount,
      summary: itemSummary,
    }, booking.notion_page_id)

    // 4. Update booking with Notion Page ID if it's new
    if (notionPageId && notionPageId !== booking.notion_page_id) {
      await supabaseAdmin
        .from('bookings')
        .update({ notion_page_id: notionPageId })
        .eq('id', bookingId)
        .eq('business_id', staff.business_id)
    }

    return NextResponse.json({ success: true, notionPageId })
  } catch (error: any) {
    console.error('Sync API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
