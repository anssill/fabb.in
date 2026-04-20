import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  try {
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
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

    const { data: { user } } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname
    const isAuthRoute = path.startsWith('/login') || path.startsWith('/auth')
    const isPendingRoute = path.startsWith('/pending-approval')
    const isSetupRoute = path.startsWith('/setup-wizard')
    const isApiRoute = path.startsWith('/api')
    const isPublicStatic = path.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/)

    if (isPublicStatic || isApiRoute) return supabaseResponse

    if (!user && !isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (user) {
      const { data: staffData } = await supabase
        .from('staff')
        .select('status, business_id, role')
        .eq('id', user.id)
        .maybeSingle()

      const businessId = staffData?.business_id
      const status = staffData?.status || 'pending'
      const role = staffData?.role

      // If user is logged in but trying to go to login page
      if (isAuthRoute) {
        const url = request.nextUrl.clone()
        if (!businessId) url.pathname = '/setup-wizard'
        else if (status === 'pending') url.pathname = '/pending-approval'
        else url.pathname = '/'
        return NextResponse.redirect(url)
      }

      // 1. Unregistered Users (No Business) -> Setup Wizard
      if (!businessId && !isSetupRoute && !isPendingRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/setup-wizard'
        return NextResponse.redirect(url)
      }

      // 2. Already registered but not on Dashboard/Setup
      if (businessId && isSetupRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }

      // 3. Pending Approval Redirect
      if (status === 'pending' && !isPendingRoute && !isSetupRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/pending-approval'
        return NextResponse.redirect(url)
      }

      // 4. Approved Users trying to access pending page
      if (status === 'approved' && isPendingRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    }

    return supabaseResponse
  } catch (e) {
    console.error('Middleware session update error:', e)
    // Fallback to next() to avoid crashing the whole app
    return NextResponse.next({ request })
  }
}
