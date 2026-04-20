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
      
      // Check if user has a staff record
      const { data: staffData } = await supabase.from('staff').select('id').eq('id', user.id).single()
      
      if (!staffData) {
        // First time login - create pending staff record
        const { error: insertError } = await supabase.from('staff').insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
          google_id: user.user_metadata?.provider_id || null,
          role: 'floor_staff',
          status: 'pending',
          last_login: new Date().toISOString()
        })
        
        if (!insertError) {
          // Create a login request
          await supabase.from('login_requests').insert({
            staff_id: user.id,
            status: 'pending'
          })
          
          // Todo: Find the correct business to send notifications to managers. 
          // For now, relies on the super_admin viewing login_requests.
        } else {
          console.error("Error creating staff record:", insertError)
        }
      } else {
        // Update last login
        await supabase.from('staff').update({ last_login: new Date().toISOString() }).eq('id', user.id)
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=InvalidAuthCode`)
}
