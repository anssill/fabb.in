import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { supabase, user, supabaseResponse } = await updateSession(request)

  const url = request.nextUrl.clone()
  const isAuthPage = url.pathname.startsWith('/login') || url.pathname.startsWith('/signup') || url.pathname.startsWith('/reset-password')
  const isSetupPage = url.pathname.startsWith('/setup')
  const isDashboardPage = url.pathname.startsWith('/dashboard') || url.pathname === '/'

  // 1. If no user and trying to access protected page
  if (!user && (isDashboardPage || isSetupPage)) {
    url.pathname = '/login'
    return Response.redirect(url)
  }

  // 2. If user exists and trying to access auth pages
  if (user && isAuthPage) {
    url.pathname = '/dashboard'
    return Response.redirect(url)
  }

  // 3. User setup check (important for onboarding)
  if (user && isDashboardPage) {
    const { data: staff } = await supabase
      .from('staff')
      .select('setup_completed, status')
      .eq('id', user.id)
      .single()

    if (staff && !staff.setup_completed && !isSetupPage) {
      url.pathname = '/setup'
      return Response.redirect(url)
    }

    if (staff && staff.status === 'suspended') {
      url.pathname = '/suspended'
      return Response.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
