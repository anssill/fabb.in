'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, LogOut, User, Settings, Moon, Sun, Search, Plus } from 'lucide-react'
import { useState } from 'react'

interface Props {
  staff: {
    name: string | null
    role: string
    email: string
    profile_photo_url: string | null
  }
}

export function Header({ staff }: Props) {
  const router = useRouter()
  const { unreadNotifications } = useAppStore()
  const [darkMode, setDarkMode] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  const initials = staff.name
    ? staff.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const pathname = usePathname()
  const pathSegments = pathname.split('/').filter(Boolean)

  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-[calc(56px+env(safe-area-inset-top))] items-end justify-between border-b border-white/70 bg-[#e9ebf5]/90 px-3 pb-2 pt-[env(safe-area-inset-top)] backdrop-blur-xl transition-all duration-300 sm:px-4 md:h-16 md:items-center md:pb-0 md:pt-0 xl:left-[17.5rem] xl:px-7 dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex min-w-0 flex-1 items-center justify-center gap-3 md:ml-10 md:justify-start xl:ml-0">
        <div className="hidden h-10 w-10 place-items-center rounded-full bg-white text-slate-600 shadow-sm md:grid">
          <Search className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-center text-sm font-semibold capitalize text-slate-950 md:text-left dark:text-white">
            {pathSegments.at(-1)?.replace(/-/g, ' ') || 'Dashboard'}
          </p>
          <p className="hidden text-xs text-slate-500 md:block">Fabb workspace</p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Button variant="ghost" size="sm" onClick={toggleDarkMode} className="hidden h-11 w-11 rounded-full bg-white text-slate-500 shadow-sm md:inline-flex md:h-10 md:w-10">
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="relative hidden h-11 w-11 rounded-full bg-white text-slate-500 shadow-sm md:inline-flex md:h-10 md:w-10"
          onClick={() => router.push('/notifications')}
        >
          <Bell className="w-4 h-4" />
          {unreadNotifications > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-[16px] text-[10px] px-1 flex items-center justify-center"
            >
              {unreadNotifications}
            </Badge>
          )}
        </Button>

        <Button variant="ghost" size="icon-sm" className="h-12 w-12 rounded-full bg-white text-slate-700 shadow-sm md:hidden" onClick={() => router.push('/bookings/new')} aria-label="New booking">
          <Plus className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="hidden h-11 gap-2 rounded-full bg-white px-2 shadow-sm sm:pr-3 md:inline-flex md:h-10">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="text-xs bg-blue-100 text-blue-700">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden text-left lg:block">
                <span className="block text-sm font-semibold leading-tight text-slate-800 dark:text-slate-100">{staff.name || 'User'}</span>
                <span className="block text-[11px] capitalize leading-tight text-slate-400">{staff.role.replace(/_/g, ' ')}</span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="font-medium">{staff.name}</p>
              <p className="text-xs text-slate-500 font-normal">{staff.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings/account')}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
