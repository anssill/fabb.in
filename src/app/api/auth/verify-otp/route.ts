import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json()
    
    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and OTP code are required' }, { status: 400 })
    }

    // Normalize phone the same way send-otp does
    const cleanPhone = phone.replace(/\D/g, '')
    const normalizedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone

    // 1. Verify OTP — try both raw and normalized phone to be safe
    const { data: otps, error: otpError } = await supabaseAdmin
      .from('otp_verifications')
      .select('*')
      .in('phone', [phone, normalizedPhone, `+${normalizedPhone}`])
      .eq('code', code.trim())
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)

    if (otpError || !otps || otps.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired OTP. Please request a new one.' }, { status: 400 })
    }

    const otpRecord = otps[0]

    // Mark as used by deleting it
    await supabaseAdmin
      .from('otp_verifications')
      .delete()
      .eq('id', otpRecord.id)

    // 2. Find the staff member using the phone stored in the OTP record (already normalized)
    const { data: staff, error: staffError } = await supabaseAdmin
      .from('staff')
      .select('id, email, status, phone')
      .or(`phone.eq.${otpRecord.phone},phone.eq.${phone},phone.eq.${normalizedPhone}`)
      .limit(1)
      .single()

    if (staffError || !staff) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 })
    }

    // 3. Activate the account on first OTP login if it was 'invited'
    if (staff.status === 'invited') {
      await supabaseAdmin
        .from('staff')
        .update({ status: 'active', last_login: new Date().toISOString() })
        .eq('id', staff.id)
    } else {
      // Update last login timestamp
      await supabaseAdmin
        .from('staff')
        .update({ last_login: new Date().toISOString() })
        .eq('id', staff.id)
    }

    // 4. Generate Magic Link to create a Supabase session
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: staff.email,
    })

    if (linkError || !linkData?.properties?.action_link) {
      console.error('Magic link generation failed:', linkError)
      return NextResponse.json({ error: 'Failed to authenticate user session. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      action_link: linkData.properties.action_link 
    })

  } catch (error: any) {
    console.error('Verify OTP error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 })
  }
}
