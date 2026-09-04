import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AttendanceMarker } from './AttendanceMarker'
import { markAbsent } from '../staff/attendance-actions'

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: me } = await supabase.from('staff').select('business_id, branch_id, role').eq('id', user.id).single()
  if (!me) return null
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const [{ data: current }, { data: team }, { data: records }] = await Promise.all([
    (supabase.from as any)('staff_attendance').select('attendance_status, gps_warning').eq('staff_id', user.id).eq('date', today).maybeSingle(),
    supabase.from('staff').select('id, name, email').eq('business_id', me.business_id).eq('branch_id', me.branch_id).in('status', ['active', 'approved']).order('name'),
    (supabase.from as any)('staff_attendance').select('staff_id, attendance_status, gps_warning, recorded_at').eq('business_id', me.business_id).eq('branch_id', me.branch_id).eq('date', today),
  ])
  const recordByStaff = new Map((records || []).map((record: any) => [record.staff_id, record]))
  const canManage = ['owner', 'manager', 'super_admin'].includes(me.role)

  return <div className="mx-auto max-w-5xl space-y-5">
    <div><h1 className="text-2xl font-semibold">Daily attendance</h1><p className="text-sm text-muted-foreground">One present or absent record per staff member. No shifts or hour tracking.</p></div>
    <Card><CardHeader><CardTitle className="text-base">Your attendance · {new Date(`${today}T12:00:00`).toLocaleDateString('en-IN', { dateStyle: 'long' })}</CardTitle></CardHeader><CardContent><AttendanceMarker current={current} /></CardContent></Card>
    {canManage ? <Card><CardHeader><CardTitle className="text-base">Branch team</CardTitle></CardHeader><CardContent><div className="divide-y">{(team || []).map((member) => {
      const record: any = recordByStaff.get(member.id)
      return <div key={member.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">{member.name || member.email}</p><p className="text-xs text-muted-foreground">{member.email}</p></div><div className="flex items-center gap-2">{record ? <Badge variant="outline" className={record.gps_warning ? 'border-amber-300 text-amber-700' : ''}>{record.attendance_status}{record.gps_warning ? ' · GPS warning' : ''}</Badge> : <><Badge variant="outline">Not recorded</Badge><form action={markAbsent.bind(null, member.id)}><Button type="submit" size="sm" variant="outline">Mark absent</Button></form></>}</div></div>
    })}</div></CardContent></Card> : null}
  </div>
}
