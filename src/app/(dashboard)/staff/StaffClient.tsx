'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, UserCog, Search, Mail, Phone, MoreVertical, Pencil, UserMinus, Shield, Building2, ClipboardList, CheckCircle2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { safeJsonParse } from '@/lib/api-utils'
import { getDefaultPermissions } from '@/lib/permissions'
import { PermissionAccessEditor, type StaffBranchOption } from './PermissionAccessEditor'

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  admin: 'bg-violet-50 text-violet-700 border-violet-100',
  manager: 'bg-blue-50 text-blue-700 border-blue-100',
  washing_staff: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  staff: 'bg-slate-100 text-slate-700 border-slate-200',
}

interface StaffMember {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: string
  status: string
  branch_id: string | null
  accessible_branch_ids: string[] | null
  last_login: string | null
  permissions?: Record<string, boolean> | null
}

interface StaffTask {
  id: string
  title: string
  description: string | null
  status: 'pending' | 'doing' | 'done' | 'blocked'
  priority: 'urgent' | 'normal' | 'low'
  due_at: string | null
  created_at: string
  assigned_to: string | null
  created_by: string | null
  assignee?: { id: string; name: string | null; email: string; role: string } | { id: string; name: string | null; email: string; role: string }[] | null
  creator?: { id: string; name: string | null; email: string; role: string } | { id: string; name: string | null; email: string; role: string }[] | null
  booking?: { id: string; booking_number: string | null } | { id: string; booking_number: string | null }[] | null
}

interface StaffClientProps {
  initialStaff: StaffMember[]
  initialTasks: StaffTask[]
  branches: StaffBranchOption[]
  currentUserId: string
  currentUserRole: string
}

function uniqueBranchIds(ids: string[]) {
  return Array.from(new Set(ids.filter(Boolean)))
}

function getDefaultBranchId(branches: StaffBranchOption[]) {
  return branches.find(branch => branch.is_default)?.id || branches[0]?.id || null
}

function getPermissionsForRole(role: string) {
  const permissions = getDefaultPermissions() as Record<string, boolean>
  if (role !== 'washing_staff') return permissions

  Object.keys(permissions).forEach(key => {
    permissions[key] = false
  })
  ;['manage_dashboard', 'manage_washing', 'log_washing', 'complete_washing', 'manage_notifications'].forEach(key => {
    permissions[key] = true
  })
  return permissions
}

function getInitialBranchAccess(member: Partial<StaffMember>, branches: StaffBranchOption[]) {
  const validIds = new Set(branches.map(branch => branch.id))
  const explicitIds = uniqueBranchIds(member.accessible_branch_ids || []).filter(id => validIds.has(id))

  if (explicitIds.length > 0) {
    return {
      branchIds: explicitIds,
      primaryBranchId: member.branch_id && explicitIds.includes(member.branch_id) ? member.branch_id : explicitIds[0],
    }
  }

  if ((member.role === 'owner' || member.role === 'admin' || member.role === 'super_admin') && branches.length > 0) {
    const allIds = branches.map(branch => branch.id)
    return {
      branchIds: allIds,
      primaryBranchId: member.branch_id && allIds.includes(member.branch_id) ? member.branch_id : getDefaultBranchId(branches),
    }
  }

  const fallbackId = member.branch_id && validIds.has(member.branch_id) ? member.branch_id : getDefaultBranchId(branches)
  return {
    branchIds: fallbackId ? [fallbackId] : [],
    primaryBranchId: fallbackId,
  }
}

export function StaffClient({ initialStaff, initialTasks, branches, currentUserId, currentUserRole }: StaffClientProps) {
  const router = useRouter()
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff)
  const [tasks, setTasks] = useState<StaffTask[]>(initialTasks)
  const [searchQuery, setSearchQuery] = useState('')
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isTaskOpen, setIsTaskOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [inviteData, setInviteData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'staff',
    phone: '',
    permissions: getPermissionsForRole('staff'),
    branch_id: getDefaultBranchId(branches),
    accessible_branch_ids: getDefaultBranchId(branches) ? [getDefaultBranchId(branches)!] : [] as string[],
  })

  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    role: '',
    status: '',
    permissions: getPermissionsForRole('staff'),
    branch_id: null as string | null,
    accessible_branch_ids: [] as string[],
  })
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'normal',
    due_at: '',
  })
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false)

  useEffect(() => {
    setStaff(initialStaff)
  }, [initialStaff])

  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  const filteredStaff = staff.filter(m => 
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const canManage = ['owner', 'admin', 'manager', 'super_admin'].includes(currentUserRole)
  const activeTasks = tasks.filter(task => task.status !== 'done')
  const roleSections = [
    { role: 'owner', label: 'Owners', helper: 'Full business control' },
    { role: 'admin', label: 'Admins', helper: 'Branch and team control' },
    { role: 'manager', label: 'Managers', helper: 'Daily operations control' },
    { role: 'washing_staff', label: 'Washing Staff', helper: 'Washing queue and ready updates' },
    { role: 'staff', label: 'Staff', helper: 'Counter and floor workflows' },
  ].map(section => ({
    ...section,
    count: staff.filter(member => member.role === section.role).length,
    active: staff.filter(member => member.role === section.role && member.status === 'active').length,
  }))

  function openInvite() {
    const branchAccess = getInitialBranchAccess({ role: 'staff' }, branches)
    setInviteData({
      email: '',
      name: '',
      password: '',
      role: 'staff',
      phone: '',
      permissions: getPermissionsForRole('staff'),
      branch_id: branchAccess.primaryBranchId,
      accessible_branch_ids: branchAccess.branchIds,
    })
    setIsInviteOpen(true)
  }

  async function handleInvite() {
    if (!inviteData.email || !inviteData.name || !inviteData.password) {
      toast.error('Please fill in all required fields')
      return
    }
    if (inviteData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (inviteData.accessible_branch_ids.length === 0 || !inviteData.branch_id) {
      toast.error('Select at least one branch for this staff member')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteData),
      })

      const result = await safeJsonParse(res)

      if (!res.ok) throw new Error(result.error || 'Failed to create staff')

      toast.success('Staff created successfully!')
      if (result.staff) {
        setStaff(prev => [...prev, result.staff])
      }
      setIsInviteOpen(false)
      const branchAccess = getInitialBranchAccess({ role: 'staff' }, branches)
      setInviteData({
        email: '',
        name: '',
        password: '',
        role: 'staff',
        phone: '',
        permissions: getDefaultPermissions() as Record<string, boolean>,
        branch_id: branchAccess.primaryBranchId,
        accessible_branch_ids: branchAccess.branchIds,
      })
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function openEdit(member: StaffMember) {
    setSelectedStaff(member)
    const memberPerms = (member.permissions && Object.keys(member.permissions).length > 0)
      ? member.permissions
      : getDefaultPermissions()
    const branchAccess = getInitialBranchAccess(member, branches)
    setEditData({
      name: member.name || '',
      phone: member.phone || '',
      role: member.role,
      status: member.status,
      permissions: { ...memberPerms },
      branch_id: branchAccess.primaryBranchId,
      accessible_branch_ids: branchAccess.branchIds,
    })
    setIsPermissionsOpen(false)
    setIsEditOpen(true)
  }

  function openPermissions(member: StaffMember) {
    setSelectedStaff(member)
    const memberPerms = (member.permissions && Object.keys(member.permissions).length > 0)
      ? member.permissions
      : getDefaultPermissions()
    const branchAccess = getInitialBranchAccess(member, branches)
    setEditData(prev => ({
      ...prev,
      name: member.name || '',
      permissions: { ...memberPerms },
      branch_id: branchAccess.primaryBranchId,
      accessible_branch_ids: branchAccess.branchIds,
    }))
    setIsPermissionsOpen(true)
  }

  async function handleUpdate() {
    if (!selectedStaff) return
    if (editData.accessible_branch_ids.length === 0 || !editData.branch_id) {
      toast.error('Select at least one branch for this staff member')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/staff/${selectedStaff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editData.name,
          phone: editData.phone,
          role: editData.role,
          status: editData.status,
          permissions: editData.permissions,
          branch_id: editData.branch_id,
          accessible_branch_ids: editData.accessible_branch_ids,
        }),
      })
      const result = await safeJsonParse(res)

      if (!res.ok) throw new Error(result.error || 'Failed to update staff')

      toast.success('Staff updated successfully')
      if (result.staff) {
        setStaff(prev => prev.map(member => member.id === result.staff.id ? result.staff : member))
      }
      setIsEditOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function getRelatedRecord<T>(record: T | T[] | null | undefined): T | null {
    if (!record) return null
    return Array.isArray(record) ? record[0] || null : record
  }

  function openTask(member?: StaffMember) {
    setTaskData({
      title: '',
      description: '',
      assigned_to: member?.id || staff.find(item => item.status === 'active')?.id || '',
      priority: 'normal',
      due_at: '',
    })
    setIsTaskOpen(true)
  }

  async function handleCreateTask() {
    if (!taskData.title.trim() || !taskData.assigned_to) {
      toast.error('Add a task title and select a staff member')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/staff/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      })
      const result = await safeJsonParse(res)
      if (!res.ok) throw new Error(result.error || 'Failed to assign task')

      toast.success('Task assigned')
      if (result.task) {
        setTasks(prev => [result.task, ...prev])
      }
      setIsTaskOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleTaskStatus(taskId: string, status: StaffTask['status']) {
    const previousTasks = tasks
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, status } : task))
    try {
      const res = await fetch('/api/staff/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status }),
      })
      const result = await safeJsonParse(res)
      if (!res.ok) throw new Error(result.error || 'Failed to update task')
      if (result.task) {
        setTasks(prev => prev.map(task => task.id === taskId ? result.task : task))
      }
      toast.success('Task updated')
    } catch (error: any) {
      setTasks(previousTasks)
      toast.error(error.message)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) return
    
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete staff')
      
      toast.success('Staff deleted successfully')
      setStaff(prev => prev.filter(m => m.id !== id))
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by name or email..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {canManage && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => openTask()} className="h-10 px-5">
              <ClipboardList className="w-4 h-4 mr-2" />
              Assign Task
            </Button>
            <Button onClick={openInvite} className="h-10 px-6">
              <Plus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {roleSections.map(section => (
          <Card key={section.role} className="border-0 bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{section.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{section.helper}</p>
                </div>
                <Badge variant="outline" className={`rounded-full ${ROLE_COLORS[section.role]}`}>
                  {section.count}
                </Badge>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>{section.active} active</span>
                <span>{section.count - section.active} suspended</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">Staff Tasks</h2>
              <p className="text-xs text-slate-500">Admins, owners, and managers can assign and track daily staff work.</p>
            </div>
            <div className="flex gap-2 text-xs">
              <Badge variant="outline" className="rounded-full bg-slate-50">{activeTasks.length} open</Badge>
              <Badge variant="outline" className="rounded-full bg-red-50 text-red-700">{tasks.filter(task => task.status === 'blocked').length} blocked</Badge>
            </div>
          </div>
          {tasks.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                    <th className="py-2 pr-3 font-medium">Task</th>
                    <th className="py-2 pr-3 font-medium">Staff</th>
                    <th className="py-2 pr-3 font-medium">Due</th>
                    <th className="py-2 pr-3 font-medium">Priority</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tasks.slice(0, 8).map(task => {
                    const assignee = getRelatedRecord(task.assignee)
                    const booking = getRelatedRecord(task.booking)
                    return (
                      <tr key={task.id} className="align-top">
                        <td className="py-3 pr-3">
                          <p className="font-medium text-slate-900">{task.title}</p>
                          <p className="mt-1 max-w-md truncate text-xs text-slate-500">
                            {booking?.booking_number ? `${booking.booking_number} - ` : ''}{task.description || 'No description'}
                          </p>
                        </td>
                        <td className="py-3 pr-3">
                          <p className="text-xs font-medium text-slate-800">{assignee?.name || assignee?.email || 'Unassigned'}</p>
                          <p className="text-[11px] capitalize text-slate-400">{assignee?.role || 'staff'}</p>
                        </td>
                        <td className="py-3 pr-3 text-xs text-slate-500 whitespace-nowrap">
                          {task.due_at ? new Date(task.due_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'No due date'}
                        </td>
                        <td className="py-3 pr-3">
                          <Badge variant="outline" className={`rounded-full text-[11px] capitalize ${task.priority === 'urgent' ? 'bg-red-50 text-red-700 border-red-100' : task.priority === 'low' ? 'bg-slate-50 text-slate-600' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                            {task.priority}
                          </Badge>
                        </td>
                        <td className="py-3">
                          {canManage ? (
                            <Select value={task.status} onValueChange={(value) => handleTaskStatus(task.id, value as StaffTask['status'])}>
                              <SelectTrigger className="h-8 w-32 rounded-xl border-slate-200 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="doing">Doing</SelectItem>
                                <SelectItem value="done">Done</SelectItem>
                                <SelectItem value="blocked">Blocked</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline" className="rounded-full capitalize">{task.status}</Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">No staff tasks yet</p>
              <p className="mt-1 text-xs text-slate-500">Assign preparation, calling, pickup, return, or custom tasks from here.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member) => {
          const initials = member.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
          const branchAccess = getInitialBranchAccess(member, branches)
          const primaryBranch = branches.find(branch => branch.id === branchAccess.primaryBranchId)
          
          return (
            <Card key={member.id} className="group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 rounded-2xl border-2 border-slate-50 shadow-sm">
                      <AvatarFallback className="bg-indigo-50 text-[#4f46e5] font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 group-hover:text-[#4f46e5] transition-colors">
                        {member.name || 'Set name'}
                      </h3>
                      <Badge variant="outline" className={`mt-1 text-[10px] uppercase font-bold tracking-tight py-0 px-2 rounded-full ${ROLE_COLORS[member.role]}`}>
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                  
                  {canManage && member.id !== currentUserId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl">
                        <DropdownMenuItem onClick={() => openEdit(member)} className="text-sm rounded-lg cursor-pointer">
                          <Pencil className="w-4 h-4 mr-2 text-slate-500" /> Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openPermissions(member)} className="text-sm rounded-lg cursor-pointer">
                          <Shield className="w-4 h-4 mr-2 text-slate-500" /> Manage Permissions
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openTask(member)} className="text-sm rounded-lg cursor-pointer">
                          <ClipboardList className="w-4 h-4 mr-2 text-slate-500" /> Assign Task
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(member.id)} className="text-sm rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                          <UserMinus className="w-4 h-4 mr-2" /> Delete Staff
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-600 hover:text-slate-900 transition-colors">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400" />
                      {member.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="truncate">
                      {primaryBranch?.name || 'No branch'} - {branchAccess.branchIds.length} accessible
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400 uppercase font-medium tracking-wider">
                  <span>Status: {member.status}</span>
                  <span suppressHydrationWarning>{member.last_login ? `Last login: ${new Date(member.last_login).toLocaleDateString()}` : 'Never logged in'}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {filteredStaff.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <UserCog className="w-16 h-16 mx-auto mb-4 text-slate-200" />
            <h3 className="text-lg font-medium text-slate-900">No staff found</h3>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your search query.</p>
          </div>
        )}
      </div>

      {/* Task Modal */}
      <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
        <DialogContent className="rounded-2xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Assign Staff Task</DialogTitle>
            <DialogDescription>
              Create a task that admins, owners, and managers can track from staff and audit screens.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="task-title">Task Title</Label>
              <Input
                id="task-title"
                placeholder="Call customer / prepare item / collect balance"
                value={taskData.title}
                onChange={e => setTaskData(prev => ({ ...prev, title: e.target.value }))}
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Assign To</Label>
              <Select value={taskData.assigned_to} onValueChange={value => setTaskData(prev => ({ ...prev, assigned_to: value }))}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {staff.filter(member => member.status === 'active').map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name || member.email} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={taskData.priority} onValueChange={value => setTaskData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-due">Due Date</Label>
                <Input
                  id="task-due"
                  type="datetime-local"
                  value={taskData.due_at}
                  onChange={e => setTaskData(prev => ({ ...prev, due_at: e.target.value }))}
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-description">Notes</Label>
              <Textarea
                id="task-description"
                placeholder="Add any handoff note or instruction"
                value={taskData.description}
                onChange={e => setTaskData(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-24 rounded-xl border-slate-200"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsTaskOpen(false)} className="rounded-xl flex-1 sm:flex-none">Cancel</Button>
            <Button onClick={handleCreateTask} disabled={isSubmitting} className="flex-1 sm:flex-none">
              {isSubmitting ? 'Assigning...' : 'Assign Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Modal */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add Staff</DialogTitle>
            <DialogDescription>
              Create a staff account with email, password, role, and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="invite-name">Full Name</Label>
              <Input 
                id="invite-name" 
                placeholder="John Doe" 
                value={inviteData.name}
                onChange={e => setInviteData(p => ({...p, name: e.target.value}))}
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input 
                id="invite-email" 
                type="email" 
                placeholder="john@example.com" 
                value={inviteData.email}
                onChange={e => setInviteData(p => ({...p, email: e.target.value}))}
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-password">Password</Label>
              <Input
                id="invite-password"
                type="text"
                placeholder="Minimum 8 characters"
                value={inviteData.password}
                onChange={e => setInviteData(p => ({...p, password: e.target.value}))}
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-phone">Phone Number <span className="text-slate-400">(optional)</span></Label>
              <Input 
                id="invite-phone" 
                type="tel" 
                placeholder="9876543210" 
                value={inviteData.phone}
                onChange={e => setInviteData(p => ({...p, phone: e.target.value}))}
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={inviteData.role} onValueChange={v => setInviteData(p => ({...p, role: v, permissions: getPermissionsForRole(v)}))}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="washing_staff">Washing Staff</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <PermissionAccessEditor
              permissions={inviteData.permissions}
              onPermissionsChange={(permissions) => setInviteData(prev => ({ ...prev, permissions }))}
              branches={branches}
              selectedBranchIds={inviteData.accessible_branch_ids}
              primaryBranchId={inviteData.branch_id}
              onBranchAccessChange={(accessibleBranchIds, branchId) => setInviteData(prev => ({
                ...prev,
                accessible_branch_ids: accessibleBranchIds,
                branch_id: branchId,
              }))}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsInviteOpen(false)} className="rounded-xl flex-1 sm:flex-none">Cancel</Button>
            <Button 
              onClick={handleInvite} 
              disabled={isSubmitting} 
              className="flex-1 sm:flex-none"
            >
              {isSubmitting ? 'Creating Staff...' : 'Create Staff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update information for {selectedStaff?.name || selectedStaff?.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input 
                id="edit-name" 
                value={editData.name}
                onChange={e => setEditData(p => ({...p, name: e.target.value}))}
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input 
                id="edit-phone" 
                value={editData.phone}
                onChange={e => setEditData(p => ({...p, phone: e.target.value}))}
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={editData.role} onValueChange={v => setEditData(p => ({...p, role: v, permissions: getPermissionsForRole(v)}))}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="washing_staff">Washing Staff</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={editData.status} onValueChange={v => setEditData(p => ({...p, status: v}))}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl flex-1 sm:flex-none">Cancel</Button>
            <Button 
              onClick={handleUpdate} 
              disabled={isSubmitting} 
              className="flex-1 sm:flex-none"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Modal */}
      <Dialog open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#4f46e5]" />
              Access & Permissions
            </DialogTitle>
            <DialogDescription>
              Toggle feature access and branch access for {selectedStaff?.name || selectedStaff?.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <PermissionAccessEditor
              permissions={editData.permissions}
              onPermissionsChange={(permissions) => setEditData(prev => ({ ...prev, permissions }))}
              branches={branches}
              selectedBranchIds={editData.accessible_branch_ids}
              primaryBranchId={editData.branch_id}
              onBranchAccessChange={(accessibleBranchIds, branchId) => setEditData(prev => ({
                ...prev,
                accessible_branch_ids: accessibleBranchIds,
                branch_id: branchId,
              }))}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsPermissionsOpen(false)} className="rounded-xl flex-1 sm:flex-none">Cancel</Button>
            <Button
              onClick={async () => {
                if (!selectedStaff) return
                if (editData.accessible_branch_ids.length === 0 || !editData.branch_id) {
                  toast.error('Select at least one branch for this staff member')
                  return
                }
                setIsSubmitting(true)
                try {
                  const res = await fetch(`/api/staff/${selectedStaff.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      permissions: editData.permissions,
                      branch_id: editData.branch_id,
                      accessible_branch_ids: editData.accessible_branch_ids,
                    }),
                  })
                  const result = await safeJsonParse(res)
                  if (!res.ok) throw new Error(result.error || 'Failed to update permissions')
                  toast.success('Permissions updated successfully')
                  if (result.staff) {
                    setStaff(prev => prev.map(member => member.id === result.staff.id ? result.staff : member))
                  }
                  setIsPermissionsOpen(false)
                  router.refresh()
                } catch (error: any) {
                  toast.error(error.message)
                } finally {
                  setIsSubmitting(false)
                }
              }}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              {isSubmitting ? 'Saving...' : 'Save Permissions'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
