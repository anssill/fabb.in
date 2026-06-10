import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { SUPABASE_AUTH_COOKIE_NAME } from '@/lib/supabase/auth-cookie'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const tokenHash = requestUrl.searchParams.get('token_hash') || requestUrl.searchParams.get('hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  const supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: SUPABASE_AUTH_COOKIE_NAME,
      },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL('/login?error=missing_token', request.url))
  }

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  })

  if (error || !data.user?.email) {
    return NextResponse.redirect(new URL('/login?error=auth', request.url))
  }

  // This validation only runs for a new OTP confirmation URL with a token hash.
  const { data: staffRecord } = await supabaseAdmin
    .from('staff')
    .select('id, status, role, setup_completed')
    .or(`id.eq.${data.user.id},email.eq.${data.user.email}`)
    .maybeSingle()

  if (!staffRecord) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login?error=no_account', request.url))
  }

  if (staffRecord.status === 'suspended') {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/suspended', request.url))
  }

  await supabaseAdmin
    .from('staff')
    .update({
      status: staffRecord.status === 'invited' ? 'active' : staffRecord.status,
      last_login: new Date().toISOString(),
    })
    .eq('id', staffRecord.id)

  const destination = !staffRecord.setup_completed && staffRecord.role === 'owner' ? '/setup' : next
  const redirectResponse = NextResponse.redirect(new URL(destination, request.url))
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie)
  })
  return redirectResponse
}
