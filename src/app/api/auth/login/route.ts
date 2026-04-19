import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text()
    if (!bodyText) return NextResponse.json({ error: 'Empty body' }, { status: 400 })
    
    const { email, password } = JSON.parse(bodyText)
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()

    // Login using Supabase Auth
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email: cleanEmail,
      password: password,
    })

    if (sessionError || !sessionData?.session) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Check staff completion status for redirect
    const { data: staff } = await supabaseAdmin
      .from('staff')
      .select('setup_completed')
      .eq('email', cleanEmail)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      session: sessionData.session,
      staff: staff || null
    })
  } catch (error) {
    console.error('Login crash:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
