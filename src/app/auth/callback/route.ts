import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const code = new URL(request.url).searchParams.get('code')

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
