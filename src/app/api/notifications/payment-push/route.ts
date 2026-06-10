import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendRolePush } from '@/lib/notifications/send-push'

export async function POST(req: NextRequest) {
  try {
    const { bookingId, businessId, amount, type } = await req.json()
    if (!bookingId || !businessId || !amount) {
      return NextResponse.json({ error: 'bookingId, businessId, and amount are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()
    const { data: staff } = await admin
      .from('staff')
      .select('id, business_id, status')
      .eq('id', user.id)
      .single()

    if (!staff || staff.status !== 'active' || staff.business_id !== businessId) {
      return NextResponse.json({ error: 'Unauthorized staff' }, { status: 403 })
    }

    await sendRolePush({
      businessId,
      roles: ['owner', 'manager', 'super_admin'],
      title: 'Payment recorded',
      body: `${type || 'Payment'} of Rs ${Number(amount).toLocaleString('en-IN')} was recorded.`,
      url: `/bookings/${bookingId}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payment push route failed:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
