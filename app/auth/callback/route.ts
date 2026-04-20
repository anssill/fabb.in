import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code)
    
    // Redirects to the homepage. The middleware will catch their session
    // and route them immediately to /pending-approval if their staff status is not approved.
    if (!error && authData.user) {
      const user = authData.user
      
      const { data: staffData } = await supabase.from('staff').select('id, business_id').eq('id', user.id).single()
      
      let redirectPath = next
      
      if (!staffData || !staffData.business_id) {
        // First time login or no business yet - redirect to setup
        redirectPath = '/setup-wizard'
        
        if (!staffData) {
          // Create the staff record if it doesn't exist
          await supabase.from('staff').insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
            google_id: user.user_metadata?.provider_id || null,
            role: 'owner', // Default role for business creator
            status: 'approved', // Auto-approve the creator? User said "full working"
            last_login: new Date().toISOString()
          })
        }
      } else {
        // Update last login for existing users
        await supabase.from('staff').update({ last_login: new Date().toISOString() }).eq('id', user.id)
      }
      
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=InvalidAuthCode`)
}
