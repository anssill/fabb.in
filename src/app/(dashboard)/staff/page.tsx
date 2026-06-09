import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/current-user'
import { StaffClient } from './StaffClient'

export default async function StaffPage() {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return null

  const { data: currentStaff } = await supabase
    .from('staff')
    .select('business_id, role')
    .eq('id', user.id)
    .single()
    
  if (!currentStaff) return null

  const [{ data: staffMembers }, { data: branches }, { data: tasks }] = await Promise.all([
    supabase
      .from('staff')
      .select('id, name, email, phone, role, status, branch_id, accessible_branch_ids, profile_photo_url, last_login, permissions')
      .eq('business_id', currentStaff.business_id)
      .order('created_at'),
    supabase
      .from('branches')
      .select('id, name, prefix, city, is_default')
      .eq('business_id', currentStaff.business_id)
      .eq('status', 'active')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true }),
    (supabase as any)
      .from('booking_tasks')
      .select(`
        id, title, description, status, priority, due_at, created_at, assigned_to, created_by,
        assignee:staff!booking_tasks_assigned_to_fkey(id, name, email, role),
        creator:staff!booking_tasks_created_by_fkey(id, name, email, role),
        booking:bookings(id, booking_number)
      `)
      .eq('business_id', currentStaff.business_id)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div>
        <h1 className="text-[1.65rem] font-semibold tracking-normal text-slate-950">Team Management</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your team members, roles, passwords, and access permissions.</p>
      </div>

      <StaffClient 
        initialStaff={staffMembers || []} 
        initialTasks={tasks || []}
        branches={branches || []}
        currentUserId={user.id}
        currentUserRole={currentStaff.role}
      />
    </div>
  )
}
