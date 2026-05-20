import { createClient } from '@/lib/supabase/server'
import { StaffClient } from './StaffClient'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: currentStaff } = await supabase
    .from('staff')
    .select('business_id, role')
    .eq('id', user.id)
    .single()
    
  if (!currentStaff) return null

  // Fetch all staff members
  const { data: staffMembers } = await supabase
    .from('staff')
    .select('id, name, email, phone, role, status, profile_photo_url, last_login, branch_id, permissions')
    .eq('business_id', currentStaff.business_id)
    .order('created_at')

  // Fetch branches for the dropdowns
  const { data: branches } = await supabase
    .from('branches')
    .select('id, name')
    .eq('business_id', currentStaff.business_id)
    .order('name')

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Team Management</h1>
        <p className="text-slate-500 mt-1">Manage your team members, roles, and branch assignments.</p>
      </div>

      <StaffClient 
        initialStaff={staffMembers || []} 
        branches={branches || []}
        businessId={currentStaff.business_id}
        currentUserId={user.id}
        currentUserRole={currentStaff.role}
      />
    </div>
  )
}
