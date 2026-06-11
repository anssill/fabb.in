import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { safeJsonParse } from '@/lib/api-utils'
import { getAuthRedirectUrl } from '@/lib/auth/redirect-url'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await safeJsonParse(req)
    const validated = forgotPasswordSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }

    const email = validated.data.email
    const admin = getSupabaseAdmin()
    const { data: staff } = await admin
      .from('staff')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (!staff) {
      return NextResponse.json({ code: 'NOT_FOUND', error: 'No account found for this email' }, { status: 404 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) {
      return NextResponse.json({ error: 'Supabase auth is not configured' }, { status: 500 })
    }

    const supabase = createSupabaseClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthRedirectUrl('/auth/callback?next=/reset-password'),
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
