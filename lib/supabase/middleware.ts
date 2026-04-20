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

    // Protected paths logic
    const path = request.nextUrl.pathname
    const isAuthRoute = path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/auth')
    const isPendingRoute = path.startsWith('/pending-approval')
    const isApiRoute = path.startsWith('/api')
    const isPublicStatic = path.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/)

    if (isPublicStatic || isApiRoute) return supabaseResponse

    if (!user && !isAuthRoute) {
      // Check if the request is a fetch/API call that expects JSON
      const isFetch = request.headers.get('accept')?.includes('application/json') || 
                      request.headers.get('x-requested-with') === 'XMLHttpRequest'

      if (isFetch || isApiRoute) {
        return NextResponse.json(
          { error: 'unauthorized', message: 'Session expired or invalid' },
          { status: 401 }
        )
      }

      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (user) {
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('status, setup_completed')
        .eq('id', user.id)
        .maybeSingle()

      // If no staff record exists but user is logged in (e.g. Google login first time)
      // Allow them to access callback, but otherwise they might need a staff record.
      // The callback route handles staff creation.
      if (!staffData && !isAuthRoute && path !== '/') {
         // If they have no staff record and aren't on a root/auth path, they might be stuck.
         // But we'll let the callback/specific pages handle this to avoid loops.
      }

      const status = staffData?.status || 'pending'
      const setupCompleted = !!staffData?.setup_completed
      const isSetupRoute = path.startsWith('/setup-wizard')

      if (isAuthRoute) {
        const url = request.nextUrl.clone()
        if (status === 'pending') url.pathname = '/pending-approval'
        else if (!setupCompleted) url.pathname = '/setup-wizard'
        else url.pathname = '/'
        return NextResponse.redirect(url)
      }

      if (status === 'pending' && !isPendingRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/pending-approval'
        return NextResponse.redirect(url)
      }

      if (status === 'approved') {
        if (!setupCompleted && !isSetupRoute && !isPendingRoute) {
          const url = request.nextUrl.clone()
          url.pathname = '/setup-wizard'
          return NextResponse.redirect(url)
        }
        
        if (setupCompleted && isSetupRoute) {
          const url = request.nextUrl.clone()
          url.pathname = '/'
          return NextResponse.redirect(url)
        }

        if (isPendingRoute) {
          const url = request.nextUrl.clone()
          url.pathname = setupCompleted ? '/' : '/setup-wizard'
          return NextResponse.redirect(url)
        }
      }
    }

    return supabaseResponse
  } catch (e) {
    console.error('Middleware session update error:', e)
    // Fallback to next() to avoid crashing the whole app
    return NextResponse.next({ request })
  }
}
