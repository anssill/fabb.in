import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { canAccessRoute, ROUTE_PERMISSION_MAP } from '@/lib/permissions'

export async function proxy(request: NextRequest) {
  const { supabase, user, supabaseResponse } = await updateSession(request)
  const pathname = request.nextUrl.pathname
  const redirectWithSession = (path: string) => {
    const response = NextResponse.redirect(new URL(path, request.url))
    supabaseResponse.cookies.getAll().forEach(cookie => response.cookies.set(cookie))
    return response
  }
  // Recovery establishes a session before opening the password form.
  const isAuthPage = pathname === '/login' || pathname === '/signup'
  const isSetupPage = pathname === '/setup'
  const protectedPrefixes = ['/admin', '/attendance', '/notifications', ...Object.keys(ROUTE_PERMISSION_MAP)]
  const isProtectedPage = protectedPrefixes.some(route => pathname === route || pathname.startsWith(route + '/'))

  if (!user && (isProtectedPage || isSetupPage)) return redirectWithSession('/login')

  if (user && (isProtectedPage || isSetupPage || isAuthPage)) {
    const { data: staff, error } = await supabase
      .from('staff')
      .select('setup_completed, status, role, permissions')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      const response = new NextResponse('Unable to verify your account. Please try again.', { status: 503 })
      supabaseResponse.cookies.getAll().forEach(cookie => response.cookies.set(cookie))
      return response
    }
    if (!staff) {
      await supabase.auth.signOut()
      return redirectWithSession('/login?error=no_account')
    }
    if (!['active', 'approved', 'invited'].includes(staff.status)) {
      return redirectWithSession('/suspended')
    }
    if (staff.role === 'super_admin' && (isAuthPage || isSetupPage || pathname === '/dashboard')) {
      return redirectWithSession('/admin/dashboard')
    }
    if (staff.role === 'owner' && !staff.setup_completed && !isSetupPage) {
      return redirectWithSession('/setup')
    }
    if (isAuthPage || (isSetupPage && (staff.role !== 'owner' || staff.setup_completed))) {
      return redirectWithSession('/dashboard')
    }
    if (isProtectedPage && !canAccessRoute(staff.role, staff.permissions as Record<string, boolean> | null, pathname)) {
      return redirectWithSession('/notifications')
    }
  }
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
