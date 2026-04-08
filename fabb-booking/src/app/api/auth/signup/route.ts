import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'

const signupSchema = z.object({
  businessName: z.string().min(2).max(100),
  ownerName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  city: z.string().min(2).max(100),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Step 1: Validate inputs
    const validated = signupSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.flatten().fieldErrors }, { status: 400 })
    }

    const { businessName, ownerName, email, phone, city } = validated.data
    const cleanEmail = email.toLowerCase()

    // Step 2: Check duplicate email
    const { data: existingStaff } = await supabaseAdmin
      .from('staff')
      .select('id')
      .eq('email', cleanEmail)
      .single()
    if (existingStaff) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Sign in instead.', code: 'DUPLICATE_EMAIL' },
        { status: 400 }
      )
    }

    // Step 3: Generate slug
    const baseSlug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    let businessSlug = baseSlug
    let slugSuffix = 1
    while (true) {
      const { data: existing } = await supabaseAdmin
        .from('businesses')
        .select('id')
        .eq('slug', businessSlug)
        .single()
      if (!existing) break
      businessSlug = `${baseSlug}-${slugSuffix++}`
    }

    // Step 4: Create business
    const { data: business, error: bizError } = await supabaseAdmin
      .from('businesses')
      .insert({
        name: businessName,
        slug: businessSlug,
        email: cleanEmail,
        phone,
        city,
        status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (bizError || !business) {
      console.error('Business creation error:', bizError)
      return NextResponse.json(
        { error: 'Failed to create business', details: bizError?.message, code: bizError?.code },
        { status: 500 }
      )
    }

    // Step 5: Create default branch
    const prefix = businessName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
    const { data: branch, error: branchError } = await supabaseAdmin
      .from('branches')
      .insert({
        business_id: business.id,
        name: businessName,
        city,
        prefix,
        is_default: true,
        settings: {
          booking_rules: { min_advance_pct: 30, buffer_days: 1, max_advance_days: 180, deposit_default_pct: 20 },
          invoice: { prefix: 'INV', next_number: 1, show_gst: false, footer_text: 'Thank you for choosing ' + businessName },
          sms: { enabled: false, api_key: '', sender_id: '' },
        },
      })
      .select()
      .single()

    if (branchError || !branch) {
      console.error('Branch creation error:', branchError)
      return NextResponse.json({ error: 'Failed to create default branch' }, { status: 500 })
    }

    // Step 6: Create Auth User (requires service role key)
    const tempPassword = 'Login123!'
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      email_confirm: true,
      password: tempPassword,
      user_metadata: { name: ownerName, business_id: business.id },
    })

    if (authError || !authUser.user) {
      console.error('Auth user creation error:', authError)
      return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 })
    }

    const authUserId = authUser.user.id

    // Step 7: Create staff record
    const passwordHash = await bcrypt.hash(tempPassword, 12)
    const { error: staffError } = await supabaseAdmin.from('staff').insert({
      id: authUserId,
      business_id: business.id,
      branch_id: branch.id,
      email: cleanEmail,
      name: ownerName,
      phone,
      role: 'owner',
      status: 'active',
      password_hash: passwordHash,
      setup_completed: false,
    })

    if (staffError) {
      console.error('Staff creation error:', staffError)
      return NextResponse.json({ error: 'Failed to create staff profile' }, { status: 500 })
    }

    // Step 8: Finalize business association
    await supabaseAdmin
      .from('businesses')
      .update({ owner_id: authUserId })
      .eq('id', business.id)

    // Step 9: Create session so user is logged in immediately
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
      user_id: authUserId,
    })

    if (sessionError || !sessionData?.session) {
      console.error('Session creation error:', sessionError)
      return NextResponse.json({ error: 'Account created but failed to sign in. Please log in manually.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
      },
      businessId: business.id,
      branchId: branch.id,
      redirect: '/setup',
    })
  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
