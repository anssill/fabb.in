import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck } from 'lucide-react'

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  STATUS_CHANGE: 'bg-violet-100 text-violet-700',
  PICKUP_COMPLETED: 'bg-amber-100 text-amber-700',
  RETURN_COMPLETED: 'bg-emerald-100 text-emerald-700',
  PAYMENT: 'bg-indigo-100 text-indigo-700',
  LOGIN: 'bg-slate-100 text-slate-700',
  SETTINGS_UPDATED: 'bg-orange-100 text-orange-700',
}

function getActionColor(action: string) {
  for (const [key, color] of Object.entries(ACTION_COLORS)) {
    if (action.includes(key)) return color
  }
  return 'bg-slate-100 text-slate-600'
}

export const metadata = { title: 'Audit Log | Fabb.booking' }

export default async function AuditLogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: staff } = await supabase.from('staff').select('business_id, role').eq('id', user.id).single()
  if (!staff) return null

  const { data: logs } = await supabase
    .from('audit_log')
    .select(`
      id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent, created_at,
      staff:staff!audit_log_staff_id_fkey(name, role)
    `)
    .eq('business_id', staff.business_id)
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Audit Log</h2>
        <p className="text-sm text-slate-500">Immutable record of all actions performed in your account.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Recent Activity ({logs?.length ?? 0} entries)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs && logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 font-medium">Date & Time</th>
                    <th className="px-4 py-3 font-medium">Staff</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Entity</th>
                    <th className="px-4 py-3 font-medium hidden lg:table-cell">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.map((log: any) => {
                    const staffRecord = Array.isArray(log.staff) ? log.staff[0] : log.staff
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-900">{staffRecord?.name || 'System'}</p>
                            {staffRecord?.role && (
                              <p className="text-xs text-slate-400 capitalize">{staffRecord.role}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`text-xs font-medium ${getActionColor(log.action)}`}>
                            {log.action.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium capitalize text-slate-700">{log.entity_type?.replace(/_/g, ' ')}</p>
                          {log.entity_id && (
                            <p className="text-xs text-slate-400 font-mono">{log.entity_id.slice(0, 8)}…</p>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {log.new_data && Object.keys(log.new_data).length > 0 ? (
                            <p className="text-xs text-slate-500 max-w-xs truncate">
                              {JSON.stringify(log.new_data).slice(0, 80)}…
                            </p>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-slate-200" />
              <p className="text-slate-500">No audit log entries yet.</p>
              <p className="text-sm text-slate-400 mt-1">Actions will appear here as staff use the platform.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
