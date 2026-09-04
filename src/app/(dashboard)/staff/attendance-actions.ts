'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getTodayAttendance() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const { data } = await (supabase.from as any)('staff_attendance').select('*').eq('staff_id', user.id).eq('date', today).maybeSingle()
  return data || null
}

export async function markAbsent(staffId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: manager } = await supabase.from('staff').select('business_id, branch_id, role').eq('id', user.id).single()
  if (!manager || !['owner', 'manager', 'super_admin'].includes(manager.role)) throw new Error('Manager permission required')

  const { data: target } = await supabase.from('staff').select('id').eq('id', staffId).eq('business_id', manager.business_id).single()
  if (!target) throw new Error('Staff member not found')
  const date = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const { error } = await (supabase.from as any)('staff_attendance').upsert({
    staff_id: target.id,
    business_id: manager.business_id,
    branch_id: manager.branch_id,
    date,
    attendance_status: 'absent',
    gps_warning: false,
    gps_metadata: {},
    recorded_at: new Date().toISOString(),
    approved_by: user.id,
  }, { onConflict: 'staff_id,date' })
  if (error) throw new Error(error.message)
  await supabase.from('audit_log').insert({
    business_id: manager.business_id,
    branch_id: manager.branch_id,
    staff_id: user.id,
    action: 'attendance.absent',
    table_name: 'staff_attendance',
    record_id: target.id,
    new_value: { date, attendance_status: 'absent' },
  })
  revalidatePath('/attendance')
}
