import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey || serviceRoleKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('CRITICAL: Supabase environment variables are missing or are using placeholders.')
}

const supabaseAdmin = createClient(
  supabaseUrl || '',
  serviceRoleKey || '',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

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

    // Step 2: Check duplicate email
    const { data: existingStaff } = await supabaseAdmin
      .from('staff')
      .select('id')
      .eq('email', email.toLowerCase())
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

    let slug = baseSlug
    let slugSuffix = 1
    while (true) {
      const { data: existing } = await supabaseAdmin
        .from('businesses')
        .select('id')
        .eq('slug', slug)
        .single()
      if (!existing) break
      slug = `${baseSlug}-${slugSuffix++}`
    }

    // Step 4: Create business
    const { data: business, error: bizError } = await supabaseAdmin
      .from('businesses')
      .insert({
        name: businessName,
        slug,
        email: email.toLowerCase(),
        phone,
        city,
        status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()
    if (bizError || !business) {
      console.error('Business creation error:', {
        message: bizError?.message,
        details: bizError?.details,
        hint: bizError?.hint,
        code: bizError?.code
      })
      return NextResponse.json(
        { 
          error: 'Failed to create business', 
          details: bizError?.message, 
          code: bizError?.code 
        }, 
        { status: 500 }
      )
    }

    // Step 5: Create default branch
    const prefix = businessName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
    const { data: branch } = await supabaseAdmin
      .from('branches')
      .insert({
        business_id: business.id,
        name: businessName,
        city,
        prefix,
        is_default: true,
        settings: {
          booking_rules: {
            min_advance_pct: 30,
            buffer_days: 1,
            max_advance_days: 180,
            deposit_default_pct: 20,
          },
          invoice: {
            prefix: 'INV',
            next_number: 1,
            show_gst: false,
            footer_text: 'Thank you for choosing ' + businessName,
          },
          sms: { enabled: false, api_key: '', sender_id: '' },
        },
      })
      .select()
      .single()

    // Step 6: Create Supabase auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      email_confirm: true,
      password: crypto.randomUUID().slice(0, 16),
      user_metadata: { name: ownerName, business_id: business.id },
    })
    if (authError || !authUser.user) {
      console.error('Auth user creation error:', authError)
      return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 })
    }

    // Step 7: Hash temporary password
    const tempPassword = crypto.randomUUID().slice(0, 12)
    const passwordHash = await bcrypt.hash(tempPassword, 12)

    // Step 8: Create owner staff record
    await supabaseAdmin.from('staff').insert({
      id: authUser.user.id,
      business_id: business.id,
      branch_id: branch!.id,
      email: email.toLowerCase(),
      name: ownerName,
      phone,
      role: 'owner',
      status: 'active',
      password_hash: passwordHash,
      setup_completed: false,
    })

    // Step 9: Update business with owner_id
    await supabaseAdmin
      .from('businesses')
      .update({ owner_id: authUser.user.id })
      .eq('id', business.id)

    return NextResponse.json({
      success: true,
      businessId: business.id,
      branchId: branch!.id,
      redirect: '/setup',
    })
  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
