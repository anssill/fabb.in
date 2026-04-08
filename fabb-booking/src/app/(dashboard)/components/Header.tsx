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
import { Bell, Search, LogOut, User, Settings, Moon, Sun, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
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
    <header className="fixed top-0 right-0 left-0 lg:left-60 z-30 h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-6 transition-all duration-300">
      {/* Left: Breadcrumbs */}
      <div className="flex-1 ml-10 lg:ml-0 flex items-center gap-2 overflow-hidden">
        {pathSegments.map((segment: string, index: number) => (
          <div key={index} className="flex items-center gap-1 shrink-0">
            {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />}
            <span className={`text-sm capitalize ${
              index === pathSegments.length - 1 
                ? 'font-semibold text-slate-900 dark:text-white' 
                : 'text-slate-500'
            }`}>
              {segment.replace(/-/g, ' ')}
            </span>
          </div>
        ))}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={toggleDarkMode} className="text-slate-500">
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="relative text-slate-500"
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
            <Button variant="ghost" size="sm" className="gap-2">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="text-xs bg-blue-100 text-blue-700">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden lg:inline text-sm font-medium text-slate-700 dark:text-slate-200">
                {staff.name || 'User'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="font-medium">{staff.name}</p>
              <p className="text-xs text-slate-500 font-normal">{staff.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings/profile')}>
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
