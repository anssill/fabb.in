'use client'

import { useEffect } from 'react'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { Topbar } from '@/components/layout/Topbar'
import { PinLock } from '@/components/layout/PinLock'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'
import type { Staff } from '@/lib/types/echo'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const setProfile = useUserStore((s) => s.setProfile)
  const setActiveBranchId = useUserStore((s) => s.setActiveBranchId)
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  // Hydrate user profile + active branch from Supabase on mount
  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      const isDev = process.env.NODE_ENV === 'development'
      const bypassAuth = document.cookie.includes('bypass-auth=true')

      if (isDev && bypassAuth) {
        const mockStaff: Staff = {
          id: '00000000-0000-0000-0000-000000000003',
          business_id: '00000000-0000-0000-0000-000000000001',
          branch_id: '00000000-0000-0000-0000-000000000002',
          email: 'dev@echo.app',
          name: 'Echo Dev',
          phone: '+91 9999999999',
          role: 'super_admin',
          status: 'approved',
          custom_permissions: {},
          google_id: null,
          pin_code: '1234',
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
        }
        setProfile(mockStaff)
        if (!activeBranchId) setActiveBranchId(mockStaff.branch_id!)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: staffData } = await supabase
        .from('staff')
        .select('*')
        .eq('id', user.id)
        .single()

      if (staffData) {
        setProfile(staffData as Staff)
        // Set active branch: use persisted value if still valid, else use staff's branch
        if (!activeBranchId && staffData.branch_id) {
          setActiveBranchId(staffData.branch_id)
        }
      }
    })()
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <SidebarProvider>
      <PinLock />
      <AppSidebar />
      <main className="w-full h-screen overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-950/50">
        <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 shrink-0 bg-white dark:bg-zinc-950/20 justify-between">
          <SidebarTrigger />
          <Topbar />
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </SidebarProvider>
  )
}
