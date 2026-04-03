import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // DEVELOPER BYPASS (Development only - remove in production)
  const isDev = process.env.NODE_ENV === 'development'
  const bypassAuth = request.cookies.get('bypass-auth')?.value === 'true'

  let user = null;
  if (!user && isDev && bypassAuth) {
    user = {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'dev@echo.app',
      user_metadata: { name: 'Echo Dev' }
    }
  } else {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    user = authUser
  }

  // Protect all routes except /login, /pending-approval, and static files
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  const isPendingRoute = request.nextUrl.pathname.startsWith('/pending-approval')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')

  if (!user && !isAuthRoute && !isApiRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in, check their staff assignment status
  if (user) {
    let status = 'approved'
    if (!(isDev && bypassAuth)) {
      const { data: staffData } = await supabase
        .from('staff')
        .select('status')
        .eq('id', user.id)
        .single()
      status = staffData?.status || 'pending'
    }

    if (isAuthRoute) {
       const url = request.nextUrl.clone()
       url.pathname = status === 'pending' ? '/pending-approval' : '/'
       return NextResponse.redirect(url)
    }

    if (status === 'pending' && !isPendingRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/pending-approval'
      return NextResponse.redirect(url)
    }

    if (status === 'approved' && isPendingRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
