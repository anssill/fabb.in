import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendSMS } from '@/lib/sms/msg91'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone } = body
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Normalize phone: strip non-digits, add 91 prefix if needed
    const cleanPhone = phone.replace(/\D/g, '')
    const normalizedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone

    // Look up staff by phone — try both raw and normalized format
    const { data: staff, error: staffError } = await supabaseAdmin
      .from('staff')
      .select('id, business_id, name, permissions, status, phone')
      .or(`phone.eq.${phone},phone.eq.${normalizedPhone},phone.eq.+${normalizedPhone}`)
      .limit(1)
      .single()

    if (staffError || !staff) {
      return NextResponse.json({ error: 'Phone number not registered. Contact your admin.' }, { status: 400 })
    }

    if (staff.status !== 'active' && staff.status !== 'invited') {
      return NextResponse.json({ error: 'Your account has been suspended. Contact your admin.' }, { status: 403 })
    }

    // Check permissions — if phone_login is explicitly set to false, block
    if (staff.permissions && staff.permissions.phone_login === false) {
      return NextResponse.json({ error: 'Phone login is disabled for your account. Use email login.' }, { status: 403 })
    }

    // Lookup business branches to get SMS settings
    const { data: branches } = await supabaseAdmin
      .from('branches')
      .select('settings')
      .eq('business_id', staff.business_id)

    const branchWithSms = branches?.find((b: any) => b.settings?.sms?.enabled)
    const smsSettings = branchWithSms?.settings?.sms

    // Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 mins

    // Delete any existing OTPs for this phone first (one active OTP at a time)
    await supabaseAdmin
      .from('otp_verifications')
      .delete()
      .eq('phone', staff.phone)

    const { error: insertError } = await supabaseAdmin.from('otp_verifications').insert({
      phone: staff.phone, // use the exact phone stored in staff table for consistency
      code,
      business_id: staff.business_id,
      expires_at: expiresAt.toISOString(),
    })

    if (insertError) {
      console.error('OTP insert error:', insertError)
      throw insertError
    }

    // Construct message
    let message = `Your Fabb.booking login OTP is ${code}. Valid for 5 minutes. Do not share this code.`
    let templateId: string | undefined = undefined

    if (smsSettings?.templates?.login_otp) {
      message = smsSettings.templates.login_otp.body.replace('{otp}', code)
      templateId = smsSettings.templates.login_otp.templateId
    }

    // Check if any MSG91 auth key is available before attempting send
    const hasAuthKey = !!(smsSettings?.api_key || process.env.MSG91_AUTH_KEY)

    if (!hasAuthKey) {
      // No SMS key configured — in development log the OTP, in production fail gracefully
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n🔑 [DEV MODE] OTP for ${staff.phone}: ${code}\n`)
        return NextResponse.json({ 
          success: true, 
          message: 'OTP generated (dev mode — check server logs)',
          devOtp: code // only included in development
        })
      }
      return NextResponse.json({ 
        error: 'SMS service not configured. Please contact your admin to set up MSG91.' 
      }, { status: 503 })
    }

    // Send via MSG91 (using the phone stored in the staff record for consistency)
    const smsResult = await sendSMS({
      phone: staff.phone,
      message,
      templateId,
      authKey: smsSettings?.api_key,
      senderId: smsSettings?.sender_id,
      businessId: staff.business_id,
      sentBy: staff.id,
    })

    if (!smsResult.success) {
      console.error('MSG91 send failed:', smsResult.error, smsResult.data)
      // Still return the OTP in dev mode for testing
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n🔑 [DEV MODE] OTP for ${staff.phone}: ${code}\n`)
        return NextResponse.json({ success: true, message: 'OTP generated (SMS failed in dev — check server logs)' })
      }
      return NextResponse.json({ error: 'Failed to send OTP SMS. Please try again or contact support.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' })

  } catch (error: any) {
    console.error('Send OTP error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 })
  }
}
