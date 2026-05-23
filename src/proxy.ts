import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { canAccessRoute, ROUTE_PERMISSION_MAP } from '@/lib/permissions'

export async function proxy(request: NextRequest) {
  const { supabase, user, supabaseResponse } = await updateSession(request)

  const url = request.nextUrl.clone()
  const isAuthPage = url.pathname.startsWith('/login') || url.pathname.startsWith('/signup') || url.pathname.startsWith('/reset-password')
  const isSetupPage = url.pathname.startsWith('/setup')
  const protectedPrefixes = ['/dashboard', '/notifications', ...Object.keys(ROUTE_PERMISSION_MAP)]
  const isProtectedPage = protectedPrefixes.some((route) => url.pathname === route || url.pathname.startsWith(route + '/'))

  // 1. If no user and trying to access protected page
  if (!user && (isProtectedPage || isSetupPage)) {
    url.pathname = '/login'
    return Response.redirect(url)
  }

  // 2. If user exists and trying to access auth pages
  if (user && isAuthPage) {
    url.pathname = '/dashboard'
    return Response.redirect(url)
  }

  // 3. User setup check (important for onboarding)
  if (user && isProtectedPage) {
    const { data: staff } = await supabase
      .from('staff')
      .select('setup_completed, status, role, permissions')
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

    if (staff && !canAccessRoute(staff.role, staff.permissions as Record<string, boolean> | null, url.pathname)) {
      url.pathname = '/notifications'
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
