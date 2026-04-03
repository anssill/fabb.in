'use client'

import { useState, useEffect } from 'react'
import { Bell, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/stores/useUserStore'
import { usePinStore } from '@/lib/stores/usePinStore'
import { useUnreadNotificationCount } from '@/lib/queries/useNotifications'
import { NotificationInbox } from '@/components/layout/NotificationInbox'
import { getInitials } from '@/lib/format'
import { formatInTimeZone } from 'date-fns-tz'

const IST = 'Asia/Kolkata'

function LiveClock() {
  const [time, setTime] = useState(() => formatInTimeZone(new Date(), IST, 'h:mm a'))

  useEffect(() => {
    const id = setInterval(() => {
      setTime(formatInTimeZone(new Date(), IST, 'h:mm a'))
    }, 10_000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 tabular-nums hidden sm:block">
      {time}
    </span>
  )
}

export function Topbar() {
  const supabase = createClient()
  const router = useRouter()
  const profile = useUserStore((s) => s.profile)
  const { lock } = usePinStore()
  const unread = useUnreadNotificationCount()
  const [inboxOpen, setInboxOpen] = useState(false)

  const handleSignOut = async () => {
    useUserStore.getState().onLogout()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = profile?.name ? getInitials(profile.name) : 'ST'
  const roleLabel: Record<string, string> = {
    super_admin: 'Super Admin',
    manager: 'Manager',
    floor_staff: 'Staff',
    auditor: 'Auditor',
    custom: 'Custom',
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <LiveClock />

        {/* PIN lock */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          onClick={lock}
          title="Lock screen"
        >
          <Lock className="w-4 h-4" />
        </Button>

        {/* Notifications bell */}
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          onClick={() => setInboxOpen(true)}
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-[#ccff00] border-2 border-white dark:border-zinc-950 rounded-full" />
          )}
        </Button>

        {/* Avatar + dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none cursor-pointer">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-[#ccff00] text-black font-bold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-3 py-2.5">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                {profile?.name || 'Staff'}
              </p>
              <p className="text-xs text-zinc-500 truncate">{profile?.email}</p>
              <p className="text-xs text-zinc-400 mt-0.5 capitalize">
                {roleLabel[profile?.role ?? ''] ?? profile?.role}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={lock} className="cursor-pointer">
              <Lock className="w-4 h-4 mr-2" />
              Lock screen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive font-medium cursor-pointer"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <NotificationInbox open={inboxOpen} onClose={() => setInboxOpen(false)} />
    </>
  )
}
