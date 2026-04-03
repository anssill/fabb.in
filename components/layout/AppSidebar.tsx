'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar'
import {
  Home,
  Box,
  Users,
  Calendar,
  CalendarDays,
  Wand2,
  Settings,
  IndianRupee,
  PieChart,
  Network,
  UserCog,
  Receipt,
  Bell,
  Shield,
  CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUserStore } from '@/lib/stores/useUserStore'
import { useUnreadNotificationCount } from '@/lib/queries/useNotifications'
import type { StaffRole } from '@/lib/types/echo'

interface NavItem {
  title: string
  url: string
  icon: React.ElementType
  roles?: StaffRole[]
  badgeKey?: 'notifications'
}

const operations: NavItem[] = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Attendance', url: '/staff/attendance', icon: UserCog },
  { title: 'Bookings', url: '/bookings', icon: Calendar },
  { title: 'Calendar', url: '/calendar', icon: CalendarDays },
  { title: 'Washing', url: '/washing', icon: Wand2 },
  { title: 'Inventory', url: '/inventory', icon: Box },
  { title: 'Customers', url: '/customers', icon: Users },
]

const finance: NavItem[] = [
  { title: 'Payments', url: '/payments', icon: IndianRupee },
  { title: 'Expenses', url: '/expenses', icon: Receipt },
  { title: 'Reconciliation', url: '/reconciliation', icon: CheckCircle2 },
  {
    title: 'Analytics',
    url: '/analytics',
    icon: PieChart,
    roles: ['super_admin', 'manager'],
  },
]

const admin: NavItem[] = [
  {
    title: 'Staff & HR',
    url: '/staff',
    icon: UserCog,
    roles: ['super_admin', 'manager'],
  },
  {
    title: 'Franchise',
    url: '/franchise',
    icon: Network,
    roles: ['super_admin'],
  },
  {
    title: 'Notifications',
    url: '/notifications',
    icon: Bell,
    badgeKey: 'notifications',
  },
  {
    title: 'Audit',
    url: '/audit',
    icon: Shield,
    roles: ['super_admin'],
  },
  { title: 'Settings', url: '/settings', icon: Settings },
]

function NavGroup({
  label,
  items,
  role,
  notifCount,
}: {
  label: string
  items: NavItem[]
  role: StaffRole | undefined
  notifCount: number
}) {
  const pathname = usePathname()
  const visible = items.filter((i) => !i.roles || (role && i.roles.includes(role)))
  if (!visible.length) return null

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-3">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visible.map((item) => {
            const isActive =
              item.url === '/'
                ? pathname === '/'
                : pathname.startsWith(item.url)
            const badge = item.badgeKey === 'notifications' ? notifCount : 0

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={<Link href={item.url} />}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#ccff00] text-black hover:bg-[#d4ff1a]'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50'
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{item.title}</span>
                  {badge > 0 && (
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                        isActive
                          ? 'bg-black/20 text-black'
                          : 'bg-[#ccff00] text-black'
                      }`}
                    >
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  const role = useUserStore((s) => s.profile?.role)
  const name = useUserStore((s) => s.profile?.name)
  const notifCount = useUnreadNotificationCount()

  return (
    <Sidebar className="border-r border-zinc-200 dark:border-zinc-800">
      {/* Logo header */}
      <SidebarHeader className="h-14 flex items-center px-5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#ccff00] rounded-lg flex items-center justify-center shrink-0">
            <span className="text-black font-black text-sm leading-none">E</span>
          </div>
          <span className="font-bold text-zinc-900 dark:text-zinc-50 text-base tracking-tight">
            Echo
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-3 space-y-1">
        <NavGroup label="Operations" items={operations} role={role} notifCount={0} />
        <NavGroup label="Finance" items={finance} role={role} notifCount={0} />
        <NavGroup label="Admin" items={admin} role={role} notifCount={notifCount} />
      </SidebarContent>

      {/* Footer: user pill */}
      <SidebarFooter className="border-t border-zinc-200 dark:border-zinc-800 p-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-7 h-7 rounded-full bg-[#ccff00] flex items-center justify-center shrink-0">
            <span className="text-black font-bold text-xs">
              {(name || 'ST')
                .split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50 truncate">
              {name || 'Staff'}
            </p>
            <p className="text-xs text-zinc-500 capitalize">{role?.replace('_', ' ')}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
