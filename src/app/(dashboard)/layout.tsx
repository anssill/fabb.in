import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentStaff } from '@/lib/auth/get-current-staff'
import { SidebarWrapper } from './components/Sidebar'
import { Header } from './components/Header'
import { StoreInitializer } from './components/StoreInitializer'
import { NotificationRealtime } from '@/components/notifications/NotificationRealtime'
import { DataRealtime } from '@/components/shared/DataRealtime'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { user, staff } = await getCurrentStaff()

  if (!user) redirect('/login')
  if (!staff) redirect('/login')
  
  // Mandatory setup check
  // If the owner/staff hasn't completed the setup wizard, force them back
  if (staff.setup_completed === false) {
    redirect('/setup')
  }

  const [{ data: business }, { data: branches }] = await Promise.all([
    supabase
      .from('businesses')
      .select('*')
      .eq('id', staff.business_id)
      .single(),
    supabase
      .from('branches')
      .select('id, name, prefix, address, city, state, phone, email, is_default, status, settings, gps_radius_metres, lat, lng')
      .eq('business_id', staff.business_id)
      .eq('status', 'active'),
  ])

  const branchAccess = Array.isArray(staff.accessible_branch_ids) ? staff.accessible_branch_ids : []
  const visibleBranches = staff.role === 'owner' || staff.role === 'super_admin' || branchAccess.length === 0
    ? branches || []
    : (branches || []).filter(branch => branchAccess.includes(branch.id))
  const activeBranchId = visibleBranches.some(branch => branch.id === staff.branch_id)
    ? staff.branch_id
    : visibleBranches[0]?.id || staff.branch_id
  const staffWithActiveBranch = { ...staff, branch_id: activeBranchId }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#e9ebf5] text-slate-950 dark:bg-slate-950">
      <StoreInitializer staff={staffWithActiveBranch} business={business} branches={visibleBranches} />
      <SidebarWrapper staff={staffWithActiveBranch} branches={visibleBranches} />
      <NotificationRealtime />
      <DataRealtime />
      <div className="flex min-h-screen min-w-0 flex-col transition-all duration-300 xl:ml-[17.5rem]">
        <Header staff={staff} />
        <main className="min-w-0 flex-1 px-3 pb-[calc(80px+env(safe-area-inset-bottom))] pt-[calc(56px+env(safe-area-inset-top))] sm:px-5 md:pb-8 md:pt-18 xl:p-7 xl:pt-20">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
