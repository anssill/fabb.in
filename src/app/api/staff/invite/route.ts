import { NextRequest, NextResponse } from 'next/server'
import { safeJsonParse } from '@/lib/api-utils'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendSMS } from '@/lib/sms/msg91'
import type { Json } from '@/lib/database.types'
import { z } from 'zod'

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['manager', 'staff']),
  branchId: z.string().uuid(),
  phone: z.string().min(10),
})

type JsonObject = { [key: string]: Json | undefined }

function isJsonObject(value: Json | null | undefined): value is JsonObject {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function getSmsSettings(settings: Json | null | undefined) {
  if (!isJsonObject(settings) || !isJsonObject(settings.sms) || settings.sms.enabled !== true) {
    return undefined
  }

  return {
    api_key: typeof settings.sms.api_key === 'string' ? settings.sms.api_key : undefined,
    sender_id: typeof settings.sms.sender_id === 'string' ? settings.sms.sender_id : undefined,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await safeJsonParse(req)
    const validated = inviteSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.flatten().fieldErrors }, { status: 400 })
    }

    const { email, name, role, branchId, phone } = validated.data

    // 1. Check if user already exists in staff table
    const { data: existingStaff } = await supabaseAdmin
      .from('staff')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingStaff) {
      return NextResponse.json({ error: 'Staff member already exists with this email' }, { status: 400 })
    }

    // 2. Get business_id from headers
    const bizId = req.headers.get('x-business-id')
    if (!bizId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 })
    }

    // 3. Lookup business name to personalize messages
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('name')
      .eq('id', bizId)
      .single()
    const businessName = business?.name || 'our company'

    // 4. Invite Auth User
    // We use the Supabase Admin API to trigger a native invite email
    const redirectTo = `${req.nextUrl.origin}/login`
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email.toLowerCase(),
      {
        redirectTo,
        data: { name, business_id: bizId },
      }
    )

    if (authError || !authUser.user) {
      return NextResponse.json({ error: authError?.message || 'Failed to create auth invite' }, { status: 500 })
    }

    // 5. Create Staff Record with status 'invited'
    const { error: staffError } = await supabaseAdmin.from('staff').insert({
      id: authUser.user.id,
      business_id: bizId,
      branch_id: branchId,
      email: email.toLowerCase(),
      name,
      phone,
      role,
      status: 'invited',
      setup_completed: true, // They are invited, not setting up a new business
    })

    if (staffError) {
      // Cleanup auth user if staff record fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ error: staffError.message }, { status: 500 })
    }

    // 6. Look up SMS settings for this business's branches to get their MSG91 credentials
    const { data: branches } = await supabaseAdmin
      .from('branches')
      .select('settings')
      .eq('business_id', bizId)

    const smsSettings = branches
      ?.map((branch) => getSmsSettings(branch.settings))
      .find(Boolean)

    // 7. Dispatch welcoming SMS via MSG91
    const loginUrl = `${req.nextUrl.origin}/login`
    const smsMessage = `Hello ${name}, you have been invited to join ${businessName} on Fabb.booking! You can now log in using your phone number via OTP at: ${loginUrl}`

    // We check if sms settings are enabled, or fallback to the platform default MSG91 key
    const smsResult = await sendSMS({
      phone,
      message: smsMessage,
      authKey: smsSettings?.api_key,
      senderId: smsSettings?.sender_id,
    })

    if (!smsResult.success) {
      console.warn('SMS delivery failed, but invite email was sent:', smsResult.error)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Staff invited successfully. An invitation email and welcome SMS have been sent.' 
    })

  } catch (error) {
    console.error('Staff invite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
