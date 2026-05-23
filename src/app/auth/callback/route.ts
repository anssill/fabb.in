import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

  const redirectWithSession = (path: string) => {
    const redirectResponse = NextResponse.redirect(new URL(path, request.url))
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })
    return redirectResponse
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !session) {
    return NextResponse.redirect(new URL('/login?error=auth', request.url))
  }

  // If this is a password recovery flow, redirect straight to the reset page
  if (next === '/reset-password') {
    return redirectWithSession('/reset-password')
  }

  // Look up staff record
  const { data: staffRecord } = await supabase
    .from('staff')
    .select('id, status, role, setup_completed, business_id, branch_id')
    .eq('email', session.user.email!)
    .single()

  if (!staffRecord) {
    return redirectWithSession('/login?error=no_account')
  }

  if (staffRecord.status === 'suspended') {
    return redirectWithSession('/suspended')
  }

  // Update last login
  await supabaseAdmin
    .from('staff')
    .update({
      status: staffRecord.status === 'invited' ? 'active' : staffRecord.status,
      last_login: new Date().toISOString(),
    })
    .eq('id', staffRecord.id)

  if (!staffRecord.setup_completed && staffRecord.role === 'owner') {
    return redirectWithSession('/setup')
  }

  return redirectWithSession('/dashboard')
}
