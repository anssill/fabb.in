'use client'

import { createBrowserClient } from '@supabase/ssr'
import { SUPABASE_AUTH_COOKIE_NAME } from './auth-cookie'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: SUPABASE_AUTH_COOKIE_NAME,
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  )
}
