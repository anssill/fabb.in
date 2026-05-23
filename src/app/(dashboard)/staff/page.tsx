import { createClient } from '@/lib/supabase/server'
import { StaffClient } from './StaffClient'

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
    .select('id, name, email, phone, role, status, profile_photo_url, last_login, permissions')
    .eq('business_id', currentStaff.business_id)
    .order('created_at')

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div>
        <h1 className="text-[1.65rem] font-semibold tracking-normal text-slate-950">Team Management</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your team members, roles, passwords, and access permissions.</p>
      </div>

      <StaffClient 
        initialStaff={staffMembers || []} 
        currentUserId={user.id}
        currentUserRole={currentStaff.role}
      />
    </div>
  )
}
