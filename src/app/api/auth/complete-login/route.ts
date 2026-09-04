import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: staffRecord, error } = await supabaseAdmin
    .from('staff')
    .select('id, status, role, setup_completed')
    .or(`id.eq.${user.id},email.eq.${user.email}`)
    .maybeSingle()

  if (error || !staffRecord) {
    await supabase.auth.signOut()
    return NextResponse.json({ error: 'No staff account found for this email' }, { status: 403 })
  }

  if (!['active', 'approved', 'invited'].includes(staffRecord.status)) {
    await supabase.auth.signOut()
    return NextResponse.json({ error: 'This staff account is not active' }, { status: 403 })
  }

  await supabaseAdmin
    .from('staff')
    .update({
      status: staffRecord.status === 'invited' ? 'active' : staffRecord.status,
      last_login: new Date().toISOString(),
    })
    .eq('id', staffRecord.id)

  return NextResponse.json({
    success: true,
    next: !staffRecord.setup_completed && staffRecord.role === 'owner' ? '/setup' : '/dashboard',
  })
}
