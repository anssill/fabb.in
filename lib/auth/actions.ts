'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUpAction(formData: FormData) {
  try {
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
    const subdomain = businessName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'store-' + Math.random().toString(36).slice(2, 7)

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
    if (!authData.user) return { error: 'Failed to create account. Please try a different email.' }

    const userId = authData.user.id

    // 2. Create business (Renamed slug to subdomain to match schema)
    const { data: business, error: bizErr } = await supabase
      .from('businesses')
      .insert({
        name: businessName.trim(),
        subdomain,
        owner_id: userId,
        plan: 'trial',
        status: 'active',
      })
      .select()
      .single()

    if (bizErr) {
      console.error('Business creation error:', bizErr)
      return { error: 'Business setup failed: ' + bizErr.message }
    }

    // 3. Create initial default branch (Required for staff constraint)
    const { data: branch, error: branchErr } = await supabase
      .from('branches')
      .insert({
        business_id: business.id,
        name: 'Main Branch',
        address: city.trim(),
        contact_phone: phone.trim(),
      })
      .select()
      .single()

    if (branchErr) {
      console.error('Default branch creation error:', branchErr)
      return { error: 'Failed to initialize first branch: ' + branchErr.message }
    }

    // 4. Create initial staff record (Now includes branch_id)
    const { error: staffErr } = await supabase.from('staff').insert({
      id: userId,
      business_id: business.id,
      branch_id: branch.id,
      full_name: ownerName.trim(),
      role: 'owner',
      status: 'approved',
    })

    if (staffErr) {
      console.error('Staff record creation error:', staffErr)
      return { error: 'Staff profile creation failed: ' + staffErr.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Signup action crash:', err)
    return { error: 'An unexpected error occurred: ' + (err.message || 'Unknown error') }
  }
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
