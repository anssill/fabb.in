import { createClient } from '@supabase/supabase-js'
import { Database } from '../database.types'

// Admin client with the modern secret key — ONLY use in API routes / server-side.
// Never expose this on the client
// Lazy getter: client is created at request time, not at module import time
// This prevents "supabaseUrl is required" errors during Next.js build
let _supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SECRET_KEY
    if (!url || !key) {
      throw new Error('Missing Supabase admin env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY')
    }
    _supabaseAdmin = createClient<Database>(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return _supabaseAdmin
}


// Keep backward-compat export as a Proxy so existing code still works.
// Methods must be bound to the real client instance so 'this' is correct.
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_target, prop) {
    const client = getSupabaseAdmin()
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})

