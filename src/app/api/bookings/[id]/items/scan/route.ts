import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

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
    const { sku } = await req.json()
    const { id: bookingId } = await params
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

    // 1. Verify if the SKU belongs to an item in this booking
    const { data: bookingItem, error } = await supabaseAdmin
      .from('booking_items')
      .select(`
        id, 
        item_name,
        item_sku,
        quantity,
        booking:bookings(status, business_id)
      `)
      .eq('booking_id', bookingId)
      .eq('item_sku', sku)
      .single()

    if (error || !bookingItem || (bookingItem.booking as any)?.business_id !== staff.business_id) {
      return NextResponse.json({ 
        error: `Item with SKU ${sku} is not part of this booking.` 
      }, { status: 404 })
    }

    // 2. Determine action based on current booking status
    const currentStatus = (bookingItem.booking as any).status
    let message = ''
    
    if (currentStatus === 'booked') {
      message = `Ready for pickup: ${bookingItem.item_name}`
    } else if (currentStatus === 'out') {
      message = `Ready for return: ${bookingItem.item_name}`
    } else {
      message = `Verified: ${bookingItem.item_name} (${currentStatus})`
    }

    return NextResponse.json({ 
      success: true, 
      message,
      item: bookingItem
    })

  } catch (error: any) {
    console.error('Scan Processing API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
