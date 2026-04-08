'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
}

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Admin Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Businesses', href: '/admin/businesses', icon: Building2 },
  { label: 'Global Users', href: '/admin/users', icon: Users },
  { label: 'Permissions', href: '/admin/permissions', icon: ShieldCheck },
]

const BOTTOM_ITEMS: NavItem[] = [
  { label: 'System Settings', href: '/admin/settings', icon: Settings },
]

function NavContent({ 
  sidebarCollapsed, 
  pathname, 
  onNavigate 
}: { 
  sidebarCollapsed: boolean
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand Section */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">
                Super Admin
              </p>
              <p className="text-xs text-slate-500 truncate">
                Platform Console
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <li key={item.href}>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                        onClick={onNavigate}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </TooltipTrigger>
                    {sidebarCollapsed && (
                      <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-slate-800 p-3">
        <ul className="space-y-1">
          {BOTTOM_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                  onClick={onNavigate}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
          <li>
            <button
              onClick={() => {}}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:bg-red-950/30 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </li>
        </ul>
      </div>

      {/* User section */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 shrink-0 ring-2 ring-blue-500/20">
            <AvatarFallback className="text-xs bg-slate-800 text-blue-400">A</AvatarFallback>
          </Avatar>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">
                System Admin
              </p>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Ansil</p>
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
  }
}

export function AdminSidebar({ staff }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useAppStore()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = staff.name
    ? staff.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A'

  const NavContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand Section */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">
                Super Admin
              </p>
              <p className="text-xs text-slate-500 truncate">
                Platform Console
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <li key={item.href}>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </TooltipTrigger>
                    {sidebarCollapsed && (
                      <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-slate-800 p-3">
        <ul className="space-y-1">
          {BOTTOM_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
          <li>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:bg-red-950/30 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </li>
        </ul>
      </div>

      {/* User section */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 shrink-0 ring-2 ring-blue-500/20">
            <AvatarFallback className="text-xs bg-slate-800 text-blue-400">{initials}</AvatarFallback>
          </Avatar>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">
                {staff.name || 'System Admin'}
              </p>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Ansil</p>
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
        className="fixed top-3 left-3 z-50 lg:hidden text-slate-400"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <NavContent />
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 w-6 h-6 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-slate-500 hover:text-white shadow-xl hover:scale-110 transition-all"
        >
          {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>
    </>
  )
}
