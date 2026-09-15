import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getPostLoginPath, safeAuthNextPath } from '@/lib/auth/paths'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  const next = safeAuthNextPath(requestUrl.searchParams.get('next'))

  const supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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
    const response = NextResponse.redirect(new URL(path, request.url))
    supabaseResponse.cookies.getAll().forEach(cookie => response.cookies.set(cookie))
    return response
  }

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

  const { data: staffRecord } = await supabaseAdmin
    .from('staff')
    .select('id, status, role, setup_completed')
    .eq('id', data.user.id)
    .maybeSingle()

  if (!staffRecord) {
    await supabase.auth.signOut()
    return redirectWithSession('/login?error=no_account')
  }

  if (!['active', 'approved', 'invited'].includes(staffRecord.status)) {
    await supabase.auth.signOut()
    return redirectWithSession('/suspended')
  }

  await supabaseAdmin
    .from('staff')
    .update({
      status: staffRecord.status === 'invited' ? 'active' : staffRecord.status,
      last_login: new Date().toISOString(),
    })
    .eq('id', staffRecord.id)

  const landingPath = getPostLoginPath(staffRecord)
  const destination = type === 'recovery' ? '/reset-password' : landingPath === '/dashboard' ? next : landingPath
  return redirectWithSession(destination)
}
