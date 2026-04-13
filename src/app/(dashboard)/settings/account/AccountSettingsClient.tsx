'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { safeJsonParse } from '@/lib/api-utils'
import { toast } from 'sonner'
import { Save, Camera, Lock, AlertTriangle, ShieldCheck } from 'lucide-react'
import { PinSetupDialog } from '@/components/shared/PinSetupDialog'

export function AccountSettingsClient() {
  const { staff, setStaff } = useAppStore()
  const supabase = createClient()
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  const [name, setName] = useState(staff?.name ?? '')
  const [phone, setPhone] = useState('') // would need phone in staff model

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const initials = staff?.name
    ? staff.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : staff?.email?.slice(0, 2).toUpperCase() ?? 'U'

  async function handleSaveProfile() {
    if (!staff) return
    setIsSavingProfile(true)
    try {
      const { error } = await supabase
        .from('staff')
        .update({ name })
        .eq('id', staff.id)
      if (error) throw error
      setStaff({ ...staff, name })
      toast.success('Profile updated')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handleChangePassword() {
    if (!newPassword || newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setIsSavingPassword(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await safeJsonParse(res)
      if (!res.ok) throw new Error(data.error || 'Failed to change password')
      toast.success('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSavingPassword(false)
    }
  }

  const passwordStrength = newPassword.length === 0 ? 0 :
    newPassword.length < 6 ? 1 :
    newPassword.length < 10 ? 2 :
    /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 4 : 3

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-green-500']

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-16 h-16">
                <AvatarImage src={staff?.profile_photo_url ?? undefined} />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 shadow-sm">
                <Camera className="w-3 h-3 text-slate-500" />
              </button>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{staff?.name || staff?.email}</p>
              <p className="text-xs text-slate-500 capitalize">{staff?.role?.replace('_', ' ')}</p>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-blue-600 mt-1 -ml-2">Change photo</Button>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input value={staff?.email ?? ''} readOnly className="bg-slate-50 text-slate-500 cursor-not-allowed" />
              <p className="text-xs text-slate-400">Email cannot be changed here. Contact your admin.</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveProfile} disabled={isSavingProfile}>
              {isSavingProfile ? 'Saving...' : <><Save className="w-4 h-4 mr-2" />Save profile</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Section */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Current Password</Label>
            <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 8 characters" />
              {newPassword.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= passwordStrength ? strengthColor[passwordStrength] : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <p className={`text-xs ${passwordStrength <= 1 ? 'text-red-500' : passwordStrength === 2 ? 'text-amber-500' : 'text-green-600'}`}>
                    {strengthLabel[passwordStrength]}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Confirm New Password</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password" />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleChangePassword} disabled={isSavingPassword || !currentPassword || !newPassword}>
              {isSavingPassword ? 'Updating...' : 'Update password'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Screen Lock PIN */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Screen Lock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            Set a 4-digit PIN to lock your screen after 5 minutes of inactivity. Useful on shared devices.
          </p>
          {(staff as any)?.pin_hash ? (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm text-green-700 font-medium">✓ PIN is set</p>
                <p className="text-xs text-slate-400 mt-0.5">Your screen will lock automatically when idle</p>
              </div>
              <PinSetupDialog staffId={staff?.id ?? ''} hasPinSet={true} />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm text-slate-500">No PIN set</p>
              </div>
              <PinSetupDialog staffId={staff?.id ?? ''} hasPinSet={false} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="shadow-sm border-red-100">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-4 h-4" /> Account Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            To delete your account or transfer ownership, please contact the business owner or reach out to Fabb.booking support.
          </p>
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
