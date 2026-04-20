'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUpAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const businessName = formData.get('businessName') as string
  const ownerName = formData.get('ownerName') as string
  const phone = formData.get('phone') as string
  const city = formData.get('city') as string

  if (!email || !password || !businessName || !ownerName || !phone || !city) {
    return { error: 'All fields are required' }
  }

  const supabase = await createClient()
  const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'store-' + Math.random().toString(36).slice(2, 7)

  // 1. Sign up the user
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        full_name: ownerName.trim(),
      }
    }
  })

  if (authErr) return { error: authErr.message }
  if (!authData.user) return { error: 'Failed to create user' }

  const userId = authData.user.id

  // 2. Create business
  const { data: business, error: bizErr } = await supabase
    .from('businesses')
    .insert({
      name: businessName.trim(),
      slug,
      owner_id: userId,
      plan: 'trial',
      city: city.trim(),
      status: 'active',
    })
    .select()
    .single()

  if (bizErr) return { error: 'Business setup failed: ' + bizErr.message }

  // 3. Create initial staff record
  const { error: staffErr } = await supabase.from('staff').insert({
    id: userId,
    business_id: business.id,
    name: ownerName.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    role: 'owner',
    status: 'approved',
    setup_completed: false,
  })

  if (staffErr) {
    console.error('Staff record creation error:', staffErr)
    // We don't return error here because the business and user are already created.
  }

  return { success: true }
}

export async function loginAction(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) return { error: 'Email and password required' }

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
    })

    if (error) return { error: error.message }
    
    redirect('/dashboard')
}
