import { createClient } from '@/lib/supabase/server'
import { getCurrentStaff } from '@/lib/auth/get-current-staff'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, ClipboardList, Users, Clock3 } from 'lucide-react'

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  ASSIGN: 'bg-violet-100 text-violet-700',
  STATUS: 'bg-amber-100 text-amber-700',
  PAYMENT: 'bg-indigo-100 text-indigo-700',
  LOGIN: 'bg-slate-100 text-slate-700',
  SETTINGS: 'bg-orange-100 text-orange-700',
}

function getActionColor(action: string) {
  for (const [key, color] of Object.entries(ACTION_COLORS)) {
    if (action.includes(key)) return color
  }
  return 'bg-slate-100 text-slate-600'
}

function formatDate(value: string | null) {
  if (!value) return 'Not set'
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function previewJson(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const text = JSON.stringify(value)
  return text.length > 100 ? `${text.slice(0, 100)}...` : text
}

export const metadata = { title: 'Audit Log | Fabb.booking' }

export default async function AuditLogPage() {
  const supabase = await createClient()
  const { staff } = await getCurrentStaff()
  if (!staff) return null

  const canViewFullTrack = ['owner', 'admin', 'manager', 'super_admin'].includes(staff.role)
  if (!canViewFullTrack) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-slate-500">
          You do not have permission to view the audit log.
        </CardContent>
      </Card>
    )
  }

  const [{ data: logs }, { data: tasks }, { data: attendance }, { data: team }] = await Promise.all([
    supabase
      .from('audit_log')
      .select(`
        id, action, table_name, record_id, old_value, new_value, staff_name, staff_id, ip_address, timestamp,
        staff:staff!audit_log_staff_id_fkey(name, role, email)
      `)
      .eq('business_id', staff.business_id)
      .order('timestamp', { ascending: false })
      .limit(250),
    (supabase as any)
      .from('booking_tasks')
      .select(`
        id, title, description, status, priority, due_at, created_at,
        assignee:staff!booking_tasks_assigned_to_fkey(name, email, role),
        creator:staff!booking_tasks_created_by_fkey(name, email, role),
        booking:bookings(booking_number)
      `)
      .eq('business_id', staff.business_id)
      .order('created_at', { ascending: false })
      .limit(80),
    (supabase as any)
      .from('staff_attendance')
      .select('id, date, clock_in_at, clock_out_at, hours_worked, is_valid_location, staff:staff!staff_attendance_staff_id_fkey(name, email, role)')
      .eq('business_id', staff.business_id)
      .order('date', { ascending: false })
      .limit(50),
    supabase
      .from('staff')
      .select('id, name, email, role, status, last_login')
      .eq('business_id', staff.business_id)
      .order('role')
      .order('name'),
  ])

  const openTasks = (tasks || []).filter((task: any) => task.status !== 'done')
  const blockedTasks = (tasks || []).filter((task: any) => task.status === 'blocked')
  const activeTeam = (team || []).filter(member => member.status === 'active')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Audit Log</h2>
        <p className="text-sm text-slate-500">Full staff tracking for actions, task ownership, attendance, and access changes.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-slate-500">Audit entries</p>
              <p className="text-2xl font-semibold text-slate-950">{logs?.length || 0}</p>
            </div>
            <ShieldCheck className="h-9 w-9 text-blue-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-slate-500">Open tasks</p>
              <p className="text-2xl font-semibold text-slate-950">{openTasks.length}</p>
            </div>
            <ClipboardList className="h-9 w-9 text-violet-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-slate-500">Blocked tasks</p>
              <p className="text-2xl font-semibold text-slate-950">{blockedTasks.length}</p>
            </div>
            <Clock3 className="h-9 w-9 text-red-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-slate-500">Active staff</p>
              <p className="text-2xl font-semibold text-slate-950">{activeTeam.length}</p>
            </div>
            <Users className="h-9 w-9 text-emerald-500" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ClipboardList className="w-4 h-4 text-violet-600" />
            Staff Task Track ({tasks?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tasks && tasks.length > 0 ? (
            <>
            <div className="space-y-3 p-3 md:hidden">
              {tasks.slice(0, 20).map((task: any) => {
                const assignee = Array.isArray(task.assignee) ? task.assignee[0] : task.assignee
                const creator = Array.isArray(task.creator) ? task.creator[0] : task.creator
                const booking = Array.isArray(task.booking) ? task.booking[0] : task.booking
                return (
                  <div key={task.id} className="cursor-pointer rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all active:scale-[0.99]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{task.title}</p>
                        <p className="text-xs text-slate-500">{booking?.booking_number || task.description || 'Staff task'}</p>
                      </div>
                      <Badge variant="outline" className="rounded-full capitalize">{task.status}</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                      <p><span className="text-slate-400">Assigned:</span> {assignee?.name || assignee?.email || 'Unassigned'}</p>
                      <p><span className="text-slate-400">By:</span> {creator?.name || creator?.email || 'System'}</p>
                      <p className="sm:col-span-2"><span className="text-slate-400">Due:</span> {formatDate(task.due_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
                    <th className="px-4 py-3 font-medium">Task</th>
                    <th className="px-4 py-3 font-medium">Assigned</th>
                    <th className="px-4 py-3 font-medium">Created By</th>
                    <th className="px-4 py-3 font-medium">Due</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tasks.slice(0, 20).map((task: any) => {
                    const assignee = Array.isArray(task.assignee) ? task.assignee[0] : task.assignee
                    const creator = Array.isArray(task.creator) ? task.creator[0] : task.creator
                    const booking = Array.isArray(task.booking) ? task.booking[0] : task.booking
                    return (
                      <tr key={task.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{task.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{booking?.booking_number || task.description || 'Staff task'}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{assignee?.name || assignee?.email || 'Unassigned'}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{creator?.name || creator?.email || 'System'}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(task.due_at)}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="rounded-full capitalize">{task.status}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            </>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">No staff tasks yet.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Recent Activity ({logs?.length ?? 0} entries)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs && logs.length > 0 ? (
            <>
            <div className="space-y-3 p-3 md:hidden">
              {logs.map((log: any) => {
                const staffRecord = Array.isArray(log.staff) ? log.staff[0] : log.staff
                const details = previewJson(log.new_value) || previewJson(log.old_value)
                return (
                  <div key={log.id} className="cursor-pointer rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all active:scale-[0.99]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{staffRecord?.name || log.staff_name || 'System'}</p>
                        <p className="text-xs text-slate-500">{formatDate(log.timestamp)}</p>
                      </div>
                      <Badge className={`text-xs font-medium ${getActionColor(log.action)}`}>{log.action.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="mt-2 text-xs font-medium capitalize text-slate-700">{log.table_name?.replace(/_/g, ' ')}</p>
                    {details ? <p className="mt-1 line-clamp-2 text-xs text-slate-500">{details}</p> : null}
                  </div>
                )
              })}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
                    <th className="px-4 py-3 font-medium">Date & Time</th>
                    <th className="px-4 py-3 font-medium">Staff</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Table</th>
                    <th className="px-4 py-3 font-medium hidden lg:table-cell">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.map((log: any) => {
                    const staffRecord = Array.isArray(log.staff) ? log.staff[0] : log.staff
                    const details = previewJson(log.new_value) || previewJson(log.old_value)
                    return (
                      <tr key={log.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{staffRecord?.name || log.staff_name || 'System'}</p>
                          <p className="text-xs capitalize text-slate-400">{staffRecord?.role || 'system'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`text-xs font-medium ${getActionColor(log.action)}`}>
                            {log.action.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium capitalize text-slate-700">{log.table_name?.replace(/_/g, ' ')}</p>
                          {log.record_id && <p className="font-mono text-xs text-slate-400">{log.record_id.slice(0, 8)}...</p>}
                        </td>
                        <td className="hidden px-4 py-3 lg:table-cell">
                          {details ? (
                            <p className="max-w-xs truncate text-xs text-slate-500">{details}</p>
                          ) : (
                            <span className="text-xs text-slate-300">No details</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            </>
          ) : (
            <div className="py-16 text-center">
              <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-slate-200" />
              <p className="text-slate-500">No audit log entries yet.</p>
              <p className="mt-1 text-sm text-slate-400">Staff actions will appear here as they use the platform.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock3 className="w-4 h-4 text-emerald-600" />
            Recent Attendance ({attendance?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {attendance && attendance.length > 0 ? (
            <>
            <div className="space-y-3 p-3 md:hidden">
              {attendance.slice(0, 20).map((row: any) => {
                const person = Array.isArray(row.staff) ? row.staff[0] : row.staff
                return (
                  <div key={row.id} className="cursor-pointer rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all active:scale-[0.99]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{person?.name || person?.email || 'Staff'}</p>
                        <p className="text-xs text-slate-500">{row.date}</p>
                      </div>
                      <Badge variant="outline" className={`rounded-full ${row.is_valid_location === false ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                        {row.is_valid_location === false ? 'Check' : 'Valid'}
                      </Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                      <p><span className="text-slate-400">In:</span> {formatDate(row.clock_in_at)}</p>
                      <p><span className="text-slate-400">Out:</span> {formatDate(row.clock_out_at)}</p>
                      <p><span className="text-slate-400">Hours:</span> {row.hours_worked ?? '-'}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
                    <th className="px-4 py-3 font-medium">Staff</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Clock In</th>
                    <th className="px-4 py-3 font-medium">Clock Out</th>
                    <th className="px-4 py-3 font-medium">Hours</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {attendance.slice(0, 20).map((row: any) => {
                    const person = Array.isArray(row.staff) ? row.staff[0] : row.staff
                    return (
                      <tr key={row.id}>
                        <td className="px-4 py-3 text-xs font-medium text-slate-800">{person?.name || person?.email || 'Staff'}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{row.date}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{formatDate(row.clock_in_at)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{formatDate(row.clock_out_at)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{row.hours_worked ?? '-'}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`rounded-full ${row.is_valid_location === false ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                            {row.is_valid_location === false ? 'Check' : 'Valid'}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            </>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">No attendance records yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
