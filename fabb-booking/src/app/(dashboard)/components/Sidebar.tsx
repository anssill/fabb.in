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

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
  roles?: string[]
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
  role,
  roleLabels,
  unreadNotifications,
  initials
}: { 
  sidebarCollapsed: boolean
  pathname: string
  onNavigate?: () => void
  staff: Props['staff']
  role: string
  roleLabels: Record<string, string>
  unreadNotifications: number
  initials: string
}) {
  const isVisible = (item: NavItem) => {
    if (!item.roles) return true
    return item.roles.includes(role)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Brand Section */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {staff.business?.name || 'Fabb.booking'}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {staff.branch?.name || 'Main Branch'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
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
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                        }`}
                        onClick={onNavigate}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-blue-600 rounded-r" />
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
      <div className="border-t border-slate-200 dark:border-slate-700 py-2 px-2">
        <ul className="space-y-0.5">
          {BOTTOM_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            const badgeCount = item.label === 'Notifications' ? unreadNotifications : undefined

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
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
      <div className="border-t border-slate-200 dark:border-slate-700 p-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="text-xs bg-blue-100 text-blue-700">{initials}</AvatarFallback>
          </Avatar>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {staff.name || 'User'}
              </p>
              <p className="text-xs text-slate-500 truncate">{roleLabels[role] || role}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface Props {
  staff: {
    name: string | null
    role: string
    profile_photo_url: string | null
    business?: { name: string; logo_url: string | null }
    branch?: { name: string }
  }
}

export function SidebarWrapper({ staff }: Props) {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen, unreadNotifications } = useAppStore()
  const role = staff.role

  const isVisible = (item: NavItem) => {
    if (!item.roles) return true
    return item.roles.includes(role)
  }

  const initials = staff.name
    ? staff.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    owner: 'Owner',
    manager: 'Manager',
    staff: 'Floor Staff',
  }

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand Section */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {staff.business?.name || 'Fabb.booking'}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {staff.branch?.name || 'Main Branch'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
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
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-blue-600 rounded-r" />
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
      <div className="border-t border-slate-200 dark:border-slate-700 py-2 px-2">
        <ul className="space-y-0.5">
          {BOTTOM_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            const badgeCount = item.label === 'Notifications' ? unreadNotifications : undefined

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
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
      <div className="border-t border-slate-200 dark:border-slate-700 p-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="text-xs bg-blue-100 text-blue-700">{initials}</AvatarFallback>
          </Avatar>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {staff.name || 'User'}
              </p>
              <p className="text-xs text-slate-500 truncate">{roleLabels[role] || role}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-3 left-3 z-50 lg:hidden"
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
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        <NavContent />
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm"
        >
          {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>
    </>
  )
}
