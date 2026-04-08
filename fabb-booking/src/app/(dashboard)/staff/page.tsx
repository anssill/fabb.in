import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, UserCog, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  staff: 'bg-slate-100 text-slate-700',
}

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: currentStaff } = await supabase.from('staff').select('business_id, role').eq('id', user.id).single()
  if (!currentStaff) return null

  const { data: staffMembers, count } = await supabase
    .from('staff')
    .select('id, name, email, phone, role, status, profile_photo_url, last_login, branch:branches(name)', { count: 'exact' })
    .eq('business_id', currentStaff.business_id)
    .order('created_at')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Staff</h1>
          <p className="text-sm text-slate-500">{count ?? 0} team members</p>
        </div>
        {['owner', 'manager'].includes(currentStaff.role) && (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Invite Staff
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search staff..." className="pl-10 h-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {staffMembers && staffMembers.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {staffMembers.map((member) => {
                const branch = Array.isArray(member.branch) ? member.branch[0] : member.branch
                const initials = member.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
                return (
                  <div key={member.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900">{member.name}</p>
                          <Badge className={`text-xs capitalize ${ROLE_COLORS[member.role] || ''}`}>
                            {member.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">{member.email} · {branch?.name || 'No branch'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {member.status}
                      </Badge>
                      <p className="text-xs text-slate-400">
                        {member.last_login ? `Last login: ${new Date(member.last_login).toLocaleDateString('en-IN')}` : 'Never logged in'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <UserCog className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900">No staff members</h3>
              <p className="text-sm text-slate-500 mt-1">Invite your team to collaborate.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
