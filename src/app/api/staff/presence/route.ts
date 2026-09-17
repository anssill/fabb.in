import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function updatePresence(online: boolean) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getSupabaseAdmin()
  const { data: staff, error: staffError } = await admin
    .from('staff')
    .select('id, status')
    .eq('id', user.id)
    .single()
  if (staffError || !staff || !['active', 'approved'].includes(staff.status)) {
    return NextResponse.json({ error: 'Staff access is unavailable' }, { status: 403 })
  }

  const now = new Date()
  const { error } = await admin
    .from('staff')
    .update({
      last_active_at: now.toISOString(),
      presence_expires_at: online ? new Date(now.getTime() + 120_000).toISOString() : now.toISOString(),
    })
    .eq('id', user.id)
  if (error) return NextResponse.json({ error: 'Could not update staff activity' }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}

export async function POST() {
  return updatePresence(true)
}

export async function DELETE() {
  return updatePresence(false)
}
