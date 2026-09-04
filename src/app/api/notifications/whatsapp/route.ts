import { NextRequest, NextResponse } from 'next/server'
import { safeJsonParse } from '@/lib/api-utils'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { WhatsAppService } from '@/lib/whatsapp'
import { z } from 'zod'

const requestSchema = z.object({
  bookingId: z.string().uuid(),
  templateName: z.string().min(1).max(100),
  variables: z.array(z.string().max(200)).max(20).default([]),
})

function getAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: staff } = await supabase.from('staff').select('id, business_id, branch_id, role, status, permissions').eq('id', user.id).single()
    if (!staff?.business_id || !['active', 'approved'].includes(staff.status)) return NextResponse.json({ error: 'Active staff account required' }, { status: 403 })
    let allowed = ['owner', 'super_admin'].includes(staff.role) || Boolean((staff.permissions as Record<string, boolean> | null)?.manage_bookings) || Boolean((staff.permissions as Record<string, boolean> | null)?.manage_settings)
    if (!allowed) {
      const { data: assignments } = await (supabase as any).from('staff_role_assignments').select('role:business_roles(permissions)').eq('staff_id', user.id)
      allowed = (assignments ?? []).some((assignment: any) => { const role = Array.isArray(assignment.role) ? assignment.role[0] : assignment.role; return role?.permissions?.manage_bookings === true || role?.permissions?.manage_settings === true })
    }
    if (!allowed) return NextResponse.json({ error: 'Booking or settings permission required' }, { status: 403 })

    const supabaseAdmin = getAdmin()
    const parsed = requestSchema.safeParse(await safeJsonParse(req))
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    const { bookingId, templateName, variables } = parsed.data
    const { data: booking } = await supabaseAdmin.from('bookings').select('id, business_id, branch_id, customer_id, customer:customers(phone)').eq('id', bookingId).eq('business_id', staff.business_id).single()
    if (!booking) return NextResponse.json({ error: 'Booking not found in your business' }, { status: 404 })
    const assignedToBranch = ['owner', 'super_admin'].includes(staff.role) || staff.branch_id === booking.branch_id || Boolean((await supabaseAdmin.from('staff_branch_memberships').select('branch_id').eq('staff_id', user.id).eq('branch_id', booking.branch_id).maybeSingle()).data)
    if (!assignedToBranch) return NextResponse.json({ error: 'Branch assignment required' }, { status: 403 })
    const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer
    const phoneNumber = customer?.phone
    if (!phoneNumber) return NextResponse.json({ error: 'Customer phone number is missing' }, { status: 400 })

    // 1. Send via Service
    let status = 'sent'
    let providerResponse = {}
    
    try {
      providerResponse = await WhatsAppService.sendTemplate({
        phoneNumber,
        templateName,
        variables,
        languageCode: 'en' // Default
      })
    } catch (err: any) {
      status = 'failed'
      providerResponse = { error: err.message }
      console.error('WhatsApp Notification Error:', err)
    }

    // 2. Log to Database
    await supabaseAdmin.from('sms_log').insert({
      business_id: booking.business_id,
      branch_id: booking.branch_id,
      customer_id: booking.customer_id,
      booking_id: bookingId,
      phone: phoneNumber,
      template_id: templateName,
      status,
      provider_response: providerResponse,
      sent_by: user.id,
      message: `Variables: ${variables.join(', ')}`
    })

    if (status === 'failed') {
      return NextResponse.json({ error: 'Failed to send WhatsApp' }, { status: 500 })
    }

    return NextResponse.json({ success: true, providerResponse })
  } catch (error: any) {
    console.error('WhatsApp API Route Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
