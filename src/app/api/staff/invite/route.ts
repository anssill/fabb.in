import { NextRequest, NextResponse } from 'next/server'
import { safeJsonParse } from '@/lib/api-utils'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['manager', 'staff']),
  branchId: z.string().uuid(),
  phone: z.string().optional(),
})

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

    // 3. Invite Auth User
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

    // 4. Create Staff Record with status 'invited'
    const { error: staffError } = await supabaseAdmin.from('staff').insert({
      id: authUser.user.id,
      business_id: bizId,
      branch_id: branchId,
      email: email.toLowerCase(),
      name,
      phone: phone?.trim() || null,
      role,
      status: 'invited',
      setup_completed: true, // They are invited, not setting up a new business
    })

    if (staffError) {
      // Cleanup auth user if staff record fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ error: staffError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Staff invited successfully. They can log in with their email OTP.' 
    })

  } catch (error) {
    console.error('Staff invite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
