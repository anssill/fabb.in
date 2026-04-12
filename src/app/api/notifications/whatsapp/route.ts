import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { WhatsAppService } from '@/lib/whatsapp'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getAdmin()
    const { 
      bookingId, 
      phoneNumber, 
      templateName, 
      variables, 
      customerId,
      businessId,
      branchId,
      staffId 
    } = await req.json()

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
      business_id: businessId,
      branch_id: branchId,
      customer_id: customerId,
      booking_id: bookingId,
      phone: phoneNumber,
      template_id: templateName,
      status,
      provider_response: providerResponse,
      sent_by: staffId,
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
