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
import { Bell, LogOut, User, Settings, Moon, Sun, Search } from 'lucide-react'
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
    <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-white/70 bg-[#e9ebf5]/85 px-3 backdrop-blur-xl transition-all duration-300 sm:px-4 xl:left-[17.5rem] xl:px-7 dark:border-slate-800 dark:bg-slate-950/80">
      <div className="ml-10 flex min-w-0 flex-1 items-center gap-3 xl:ml-0">
        <div className="hidden h-10 w-10 place-items-center rounded-full bg-white text-slate-600 shadow-sm sm:grid">
          <Search className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold capitalize text-slate-950 dark:text-white">
            {pathSegments.at(-1)?.replace(/-/g, ' ') || 'Dashboard'}
          </p>
          <p className="hidden text-xs text-slate-500 sm:block">Fabb workspace</p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Button variant="ghost" size="sm" onClick={toggleDarkMode} className="h-10 w-10 rounded-full bg-white text-slate-500 shadow-sm">
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="relative h-10 w-10 rounded-full bg-white text-slate-500 shadow-sm"
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-10 gap-2 rounded-full bg-white px-2 shadow-sm sm:h-11 sm:pr-3">
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
