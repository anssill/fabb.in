import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SidebarWrapper } from './components/Sidebar'
import { Header } from './components/Header'
import { StoreInitializer } from './components/StoreInitializer'
import { NotificationRealtime } from '@/components/notifications/NotificationRealtime'
import { DataRealtime } from '@/components/shared/DataRealtime'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: staff } = await supabase
    .from('staff')
    .select('*, permissions')
    .eq('id', user.id)
    .single()

  if (!staff) redirect('/login')
  
  // Mandatory setup check
  // If the owner/staff hasn't completed the setup wizard, force them back
  if (staff.setup_completed === false) {
    redirect('/setup')
  }

  // Fetch business data
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', staff.business_id)
    .single()

  // Get all branches for this business
  const { data: branches } = await supabase
    .from('branches')
    .select('id, name, prefix, address, city, state, phone, email, is_default, status, settings, gps_radius_metres, lat, lng')
    .eq('business_id', staff.business_id)
    .eq('status', 'active')

  const branchAccess = Array.isArray(staff.accessible_branch_ids) ? staff.accessible_branch_ids : []
  const visibleBranches = staff.role === 'owner' || staff.role === 'super_admin' || branchAccess.length === 0
    ? branches || []
    : (branches || []).filter(branch => branchAccess.includes(branch.id))
  const activeBranchId = visibleBranches.some(branch => branch.id === staff.branch_id)
    ? staff.branch_id
    : visibleBranches[0]?.id || staff.branch_id
  const staffWithActiveBranch = { ...staff, branch_id: activeBranchId }

  return (
    <div className="min-h-screen bg-[#e9ebf5] text-slate-950 dark:bg-slate-950">
      <StoreInitializer staff={staffWithActiveBranch} business={business} branches={visibleBranches} />
      <SidebarWrapper staff={staffWithActiveBranch} branches={visibleBranches} />
      <NotificationRealtime />
      <DataRealtime />
      <div className="lg:ml-[17.5rem] flex flex-col min-h-screen transition-all duration-300">
        <Header staff={staff} />
        <main className="flex-1 p-3 pt-16 sm:p-5 sm:pt-18 lg:p-7 lg:pt-20">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
