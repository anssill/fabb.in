'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, UserCog, Search, Mail, Phone, MoreVertical, Pencil, UserMinus, Shield, Check, X as XIcon } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { safeJsonParse } from '@/lib/api-utils'
import { PERMISSIONS, getDefaultPermissions } from '@/lib/permissions'

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  manager: 'bg-blue-50 text-blue-700 border-blue-100',
  staff: 'bg-slate-100 text-slate-700 border-slate-200',
}

interface StaffMember {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: string
  status: string
  last_login: string | null
  permissions?: Record<string, boolean> | null
}

interface StaffClientProps {
  initialStaff: StaffMember[]
  businessId: string
  currentUserId: string
  currentUserRole: string
}

export function StaffClient({ initialStaff, businessId, currentUserId, currentUserRole }: StaffClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff)
  const [searchQuery, setSearchQuery] = useState('')
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [inviteData, setInviteData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'staff',
    phone: '',
    permissions: getDefaultPermissions() as Record<string, boolean>,
  })

  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    role: '',
    status: '',
    permissions: getDefaultPermissions() as Record<string, boolean>,
  })
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false)

  const filteredStaff = staff.filter(m => 
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const canManage = ['owner', 'manager'].includes(currentUserRole)

  async function handleInvite() {
    if (!inviteData.email || !inviteData.name || !inviteData.password) {
      toast.error('Please fill in all required fields')
      return
    }
    if (inviteData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteData),
      })

      const result = await safeJsonParse(res)

      if (!res.ok) throw new Error(result.error || 'Failed to create staff')

      toast.success('Staff created successfully!')
      setIsInviteOpen(false)
      setInviteData({ email: '', name: '', password: '', role: 'staff', phone: '', permissions: getDefaultPermissions() as Record<string, boolean> })
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
    setEditData({
      name: member.name || '',
      phone: member.phone || '',
      role: member.role,
      status: member.status,
      permissions: { ...memberPerms },
    })
    setIsPermissionsOpen(false)
    setIsEditOpen(true)
  }

  function openPermissions(member: StaffMember) {
    setSelectedStaff(member)
    const memberPerms = (member.permissions && Object.keys(member.permissions).length > 0)
      ? member.permissions
      : getDefaultPermissions()
    setEditData(prev => ({
      ...prev,
      name: member.name || '',
      permissions: { ...memberPerms },
    }))
    setIsPermissionsOpen(true)
  }

  async function handleUpdate() {
    if (!selectedStaff) return
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('staff')
        .update({
          name: editData.name,
          phone: editData.phone,
          role: editData.role,
          status: editData.status,
          permissions: editData.permissions,
        })
        .eq('id', selectedStaff.id)

      if (error) throw error

      toast.success('Staff updated successfully')
      setIsEditOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
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
          <Button onClick={() => setIsInviteOpen(true)} className="h-10 px-6">
            <Plus className="w-4 h-4 mr-2" />
            Add Staff
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member) => {
          const initials = member.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
          
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

      {/* Invite Modal */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md rounded-2xl">
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
              <Select value={inviteData.role} onValueChange={v => setInviteData(p => ({...p, role: v}))}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-1 max-h-64 overflow-y-auto rounded-xl border border-slate-100 p-2">
                {PERMISSIONS.map((perm) => {
                  const isEnabled = inviteData.permissions[perm.key] !== false
                  return (
                    <button
                      key={perm.key}
                      type="button"
                      onClick={() => setInviteData(prev => ({
                        ...prev,
                        permissions: {
                          ...prev.permissions,
                          [perm.key]: !isEnabled,
                        },
                      }))}
                      className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
                        isEnabled ? 'bg-indigo-50 text-indigo-900' : 'bg-slate-50 text-slate-500'
                      }`}
                    >
                      <span>
                        <span className="block text-sm font-semibold">{perm.label}</span>
                        <span className="block text-xs text-slate-500">{perm.description}</span>
                      </span>
                      <span className={`grid h-6 w-6 place-items-center rounded-full ${isEnabled ? 'bg-[#4f46e5] text-white' : 'bg-slate-200 text-slate-400'}`}>
                        {isEnabled ? <Check className="h-3.5 w-3.5" /> : <XIcon className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
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
              <Select value={editData.role} onValueChange={v => setEditData(p => ({...p, role: v}))}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
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
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#4f46e5]" />
              Manage Permissions
            </DialogTitle>
            <DialogDescription>
              Toggle access to individual modules for {selectedStaff?.name || selectedStaff?.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-1 max-h-[400px] overflow-y-auto">
            {PERMISSIONS.map((perm) => {
              const isEnabled = editData.permissions[perm.key] !== false
              return (
                <button
                  key={perm.key}
                  type="button"
                  onClick={() => setEditData(prev => ({
                    ...prev,
                    permissions: {
                      ...prev.permissions,
                      [perm.key]: !isEnabled,
                    },
                  }))}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${
                    isEnabled
                      ? 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 opacity-60'
                  }`}
                >
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${
                      isEnabled ? 'text-indigo-900' : 'text-slate-500'
                    }`}>
                      {perm.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{perm.description}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    isEnabled
                      ? 'bg-[#4f46e5] text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}>
                    {isEnabled ? <Check className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}
                  </div>
                </button>
              )
            })}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsPermissionsOpen(false)} className="rounded-xl flex-1 sm:flex-none">Cancel</Button>
            <Button
              onClick={async () => {
                if (!selectedStaff) return
                setIsSubmitting(true)
                try {
                  const { error } = await supabase
                    .from('staff')
                    .update({ permissions: editData.permissions })
                    .eq('id', selectedStaff.id)
                  if (error) throw error
                  toast.success('Permissions updated successfully')
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
