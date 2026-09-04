'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Building2, MapPin, Users, Settings, Receipt, MessageSquare, Package, Monitor, User, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const SETTINGS_SECTIONS = [
  { label: 'Company Profile', icon: Building2, href: '/settings/company', roles: ['owner', 'super_admin'] },
  { label: 'Branches', icon: MapPin, href: '/settings/branches', roles: ['owner', 'manager', 'super_admin'] },
  { label: 'Staff', icon: Users, href: '/staff', roles: ['owner', 'manager', 'super_admin'] },
  { label: 'Booking Rules', icon: Settings, href: '/settings/booking-rules', roles: ['owner', 'manager', 'super_admin'] },
  { label: 'Invoice Settings', icon: Receipt, href: '/settings/invoice', roles: ['owner', 'manager', 'super_admin'] },
  { label: 'SMS Notifications', icon: MessageSquare, href: '/settings/sms', roles: ['owner', 'super_admin'] },
  { label: 'Inventory Settings', icon: Package, href: '/settings/inventory', roles: ['owner', 'manager', 'super_admin'] },
  { label: 'Display Preferences', icon: Monitor, href: '/settings/display', roles: ['all'] },
  { label: 'My Account', icon: User, href: '/settings/account', roles: ['all'] },
  { label: 'Audit Log', icon: ShieldCheck, href: '/settings/audit-log', roles: ['owner', 'super_admin'] },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // We should ideally filter by role here if we use useAppStore
  const visibleSections = SETTINGS_SECTIONS

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-5 md:flex-row">
      {/* Settings Sidebar */}
      <aside className="w-full shrink-0 rounded-[1.65rem] bg-white p-3 shadow-sm md:w-72">
        <h1 className="mb-4 px-3 pt-2 text-[1.65rem] font-semibold tracking-normal text-slate-950">Settings</h1>
        <nav className="flex flex-col gap-1">
          {visibleSections.map((section) => {
            const Icon = section.icon
            const isActive = pathname === section.href || (pathname === '/settings' && section.href === '/settings/company')

            return (
              <Link
                key={section.href}
                href={section.href}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#4f46e5] text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-slate-400')} />
                {section.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Settings Content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
