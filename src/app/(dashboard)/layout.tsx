import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SidebarWrapper } from './components/Sidebar'
import { Header } from './components/Header'
import { StoreInitializer } from './components/StoreInitializer'
import { NotificationRealtime } from '@/components/notifications/NotificationRealtime'
import { DataRealtime } from '@/components/shared/DataRealtime'
import { StaffActivityHeartbeat } from './components/StaffActivityHeartbeat'
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
  
  if (!['active', 'approved', 'invited'].includes(staff.status)) redirect('/suspended')
  if (staff.role === 'super_admin') redirect('/admin/dashboard')

  // Business onboarding is only required for owners.
  if (staff.role === 'owner' && staff.setup_completed === false) {
    redirect('/setup')
  }

  const [{ data: business }, { data: branches }] = await Promise.all([
    supabase.from('businesses').select('*').eq('id', staff.business_id).single(),
    supabase.from('branches')
      .select('id, name, prefix, address, city, state, phone, email, is_default, status, settings, gps_radius_metres, lat, lng')
      .eq('business_id', staff.business_id).eq('status', 'active'),
  ])

  return (
    <div className="min-h-screen bg-[#e9ebf5] text-slate-950 dark:bg-slate-950">
      <StoreInitializer staff={staff} business={business} branches={branches || []} />
      <SidebarWrapper staff={staff} branches={branches || []} />
      <StaffActivityHeartbeat />
      <NotificationRealtime />
      <DataRealtime />
      <div className="lg:ml-[17.5rem] flex flex-col min-h-screen transition-all duration-300">
        <Header staff={staff} />
        <main className="min-w-0 flex-1 p-3 pt-16 sm:p-5 sm:pt-18 lg:p-7 lg:pt-20">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
