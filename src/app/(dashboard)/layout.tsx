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
    .select('*, business:businesses(*), branch:branches(*)')
    .eq('id', user.id)
    .single()

  if (!staff) redirect('/login')
  
  // Mandatory setup check
  // If the owner/staff hasn't completed the setup wizard, force them back
  if (staff.setup_completed === false) {
    redirect('/setup')
  }

  // Get all branches for this business
  const { data: branches } = await supabase
    .from('branches')
    .select('id, name, prefix, address, city, state, phone, email, is_default, status, settings, gps_radius_metres, lat, lng')
    .eq('business_id', staff.business_id)
    .eq('status', 'active')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <StoreInitializer staff={staff} business={staff.business} branches={branches || []} />
      <SidebarWrapper staff={staff} branches={branches || []} />
      <NotificationRealtime />
      <DataRealtime />
      <div className="lg:ml-60 flex flex-col min-h-screen transition-all duration-300">
        <Header staff={staff} />
        <main className="flex-1 p-4 lg:p-6 mt-14">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
