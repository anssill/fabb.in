import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_PATHS = [
  '/', '/login', '/signup', '/reset-password',
  '/auth/callback', '/suspended',
  '/api/auth/login', '/api/auth/signup',
  '/api/auth/forgot-password', '/api/auth/reset-password',
]

const ROLE_PROTECTED_PATHS: Record<string, string[]> = {
  '/analytics': ['owner', 'manager', 'super_admin'],
  '/staff': ['owner', 'manager', 'super_admin'],
  '/expenses': ['owner', 'manager', 'super_admin'],
  '/admin': ['super_admin'],
  '/settings/staff': ['owner', 'manager', 'super_admin'],
  '/settings/billing': ['owner', 'super_admin'],
}

export async function proxy(req: NextRequest) {
  const { supabase, user, supabaseResponse } = await updateSession(req)
  const path = req.nextUrl.pathname

  // Allow public paths
  const isPublic = PUBLIC_PATHS.some((p) => path === p || (p !== '/' && path.startsWith(p)))
  if (isPublic) {
    if (user && (path === '/login' || path === '/signup')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return supabaseResponse
  }

  // Not authenticated → redirect to login
  if (!user) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl)
  }

  // Get staff record for role checks
  const { data: staff } = await supabase
    .from('staff')
    .select('role, status, setup_completed, business_id, branch_id')
    .eq('id', user.id)
    .single()

  if (!staff) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Suspended account
  if (staff.status === 'suspended') {
    if (!path.startsWith('/suspended')) {
      return NextResponse.redirect(new URL('/suspended', req.url))
    }
    return supabaseResponse
  }

  // Setup not completed (owner first login)
  if (!staff.setup_completed && staff.role === 'owner' && !path.startsWith('/setup')) {
    return NextResponse.redirect(new URL('/setup', req.url))
  }

  // Role-based path protection
  for (const [protectedPath, allowedRoles] of Object.entries(ROLE_PROTECTED_PATHS)) {
    if (path.startsWith(protectedPath) && !allowedRoles.includes(staff.role)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public|sounds|images|logo).*)'],
}
