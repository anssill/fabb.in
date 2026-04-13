import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? ''

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }

  const supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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

  const {
    data: { session },
    error,
  } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !session) {
    return NextResponse.redirect(new URL('/login?error=auth', request.url))
  }

  // If this is a password recovery flow, redirect straight to the reset page
  if (next === '/reset-password') {
    const redirectResponse = NextResponse.redirect(new URL('/reset-password', request.url))
    // Copy the session cookies so the reset page can read the session
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  // Look up staff record
  const { data: staffRecord } = await supabase
    .from('staff')
    .select('status, role, setup_completed, business_id, branch_id')
    .eq('email', session.user.email!)
    .single()

  if (!staffRecord) {
    return NextResponse.redirect(new URL('/login?error=no_account', request.url))
  }

  if (staffRecord.status === 'suspended') {
    return NextResponse.redirect(new URL('/suspended', request.url))
  }

  // Update last login
  await supabase
    .from('staff')
    .update({ last_login: new Date().toISOString() })
    .eq('email', session.user.email!)

  if (!staffRecord.setup_completed && staffRecord.role === 'owner') {
    return NextResponse.redirect(new URL('/setup', request.url))
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
