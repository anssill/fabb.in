'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarCheck,
  Package,
  Users,
  CreditCard,
  BarChart3,
  Waves,
  UserCog,
  Wallet,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { BranchSwitcher } from './BranchSwitcher'
import { hasPermission, ROUTE_PERMISSION_MAP } from '@/lib/permissions'
import { BrandLogo } from '@/components/brand/BrandLogo'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
  roles?: string[]
}

type Branch = {
  id: string
  name?: string | null
  prefix?: string | null
  [key: string]: unknown
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Bookings', href: '/bookings', icon: CalendarCheck },
  { label: 'Inventory', href: '/inventory', icon: Package },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Payments', href: '/payments', icon: CreditCard },
  { label: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['owner', 'manager', 'super_admin'] },
  { label: 'Washing', href: '/washing', icon: Waves },
  { label: 'Staff', href: '/staff', icon: UserCog, roles: ['owner', 'manager', 'super_admin'] },
  { label: 'Expenses', href: '/expenses', icon: Wallet, roles: ['owner', 'manager', 'super_admin'] },
]

const BOTTOM_ITEMS: NavItem[] = [
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Notifications', href: '/notifications', icon: Bell },
]

function NavContent({ 
  sidebarCollapsed, 
  pathname, 
  onNavigate,
  staff,
  branches,
  role,
  roleLabels,
  unreadNotifications,
  initials
}: { 
  sidebarCollapsed: boolean
  pathname: string
  onNavigate?: () => void
  staff: Props['staff']
  branches: Branch[]
  role: string
  roleLabels: Record<string, string>
  unreadNotifications: number
  initials: string
}) {
  const isVisible = (item: NavItem) => {
    if (!item.roles) {
      // Check individual permissions
      const permKey = ROUTE_PERMISSION_MAP[item.href]
      if (permKey) {
        return hasPermission(role, staff?.permissions, permKey)
      }
      return true
    }
    if (!item.roles.includes(role)) return false
    // Also check individual permissions for role-gated items
    const permKey = ROUTE_PERMISSION_MAP[item.href]
    if (permKey) {
      return hasPermission(role, staff?.permissions, permKey)
    }
    return true
  }

  return (
    <div className="flex flex-col h-full">
      {/* Brand Section */}
      <div className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <BrandLogo compact className="h-9 w-9 shrink-0 transition-transform hover:scale-105" />
            {!sidebarCollapsed && (
              <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
                {staff.business?.name || 'Fabb'}
              </p>
            )}
          </div>
          
          <BranchSwitcher 
            branches={branches} 
            currentBranchId={staff.branch_id || ''} 
            collapsed={sidebarCollapsed}
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        <ul className="space-y-1 px-3">
          {NAV_ITEMS.filter(isVisible).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const badgeCount = item.label === 'Notifications' ? unreadNotifications : item.badge

            return (
              <li key={item.href}>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={`relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-[#4f46e5] text-white shadow-sm'
                            : 'text-slate-500 hover:bg-white hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                        }`}
                        onClick={onNavigate}
                      >
                        {isActive && (
                          <div className="absolute left-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white/70" />
                        )}
                        <Icon className="w-5 h-5 shrink-0" />
                        {!sidebarCollapsed && (
                          <>
                            <span className="truncate">{item.label}</span>
                            {badgeCount ? (
                              <Badge variant="secondary" className="ml-auto text-xs h-5 min-w-[20px] justify-center">
                                {badgeCount}
                              </Badge>
                            ) : null}
                          </>
                        )}
                      </Link>
                    </TooltipTrigger>
                    {sidebarCollapsed && (
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="px-3 py-2">
        <ul className="space-y-1">
          {BOTTOM_ITEMS.filter(isVisible).map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            const badgeCount = item.label === 'Notifications' ? unreadNotifications : undefined

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#4f46e5] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-white hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                  onClick={onNavigate}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span>{item.label}</span>
                      {badgeCount ? (
                        <Badge variant="destructive" className="ml-auto text-xs h-5 min-w-[20px] justify-center">
                          {badgeCount}
                        </Badge>
                      ) : null}
                    </>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      {/* User section */}
      <div className="m-3 rounded-3xl bg-white p-3 shadow-sm dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="text-xs bg-blue-100 text-blue-700">{initials}</AvatarFallback>
          </Avatar>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {staff.name || 'User'}
              </p>
              <p className="truncate text-xs text-slate-500">{roleLabels[role] || role}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface Props {
  staff: {
    id: string
    name: string | null
    role: string
    profile_photo_url: string | null
    branch_id: string | null
    accessible_branch_ids?: string[] | null
    permissions?: Record<string, boolean> | null
    business?: { name: string; logo_url: string | null }
    branch?: { name: string }
  }
  branches: Branch[]
}

export function SidebarWrapper({ staff, branches }: Props) {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen, unreadNotifications } = useAppStore()
  const role = staff.role

  const initials = staff.name
    ? staff.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    owner: 'Owner',
    manager: 'Manager',
    staff: 'Floor Staff',
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
          className="fixed left-3 top-3 z-50 rounded-full bg-white shadow-sm lg:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 transform bg-[#f7f8fd] transition-transform duration-300 dark:bg-slate-900 lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavContent 
          sidebarCollapsed={false} 
          pathname={pathname} 
          onNavigate={() => setMobileMenuOpen(false)}
          staff={staff}
          branches={branches}
          role={role}
          roleLabels={roleLabels}
          unreadNotifications={unreadNotifications}
          initials={initials}
        />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`fixed bottom-5 left-5 top-5 z-40 hidden flex-col rounded-[1.75rem] bg-[#f7f8fd] shadow-sm ring-1 ring-white/80 transition-all duration-300 dark:bg-slate-900 dark:ring-slate-800 lg:flex ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        <NavContent 
          sidebarCollapsed={sidebarCollapsed} 
          pathname={pathname} 
          onNavigate={() => setMobileMenuOpen(false)}
          staff={staff}
          branches={branches}
          role={role}
          roleLabels={roleLabels}
          unreadNotifications={unreadNotifications}
          initials={initials}
        />
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 flex h-7 w-7 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-400 shadow-sm hover:text-slate-600 dark:border-slate-700 dark:bg-slate-800"
        >
          {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>
    </>
  )
}
