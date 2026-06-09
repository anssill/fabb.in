import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/current-user'
import { AdminSidebar } from './components/AdminSidebar'
import { AdminHeader } from './components/AdminHeader'
import { StoreInitializer } from '../(dashboard)/components/StoreInitializer'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) redirect('/login')

  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!staff || staff.role !== 'super_admin') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Passing empty objects to keep the store happy during system-level operations */}
      <StoreInitializer staff={staff} business={{}} branches={[]} />
      <AdminSidebar staff={staff} />
      <div className="lg:ml-64 flex flex-col min-h-screen transition-all duration-300">
        <AdminHeader />
        <main className="flex-1 p-4 lg:p-6 mt-14 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
