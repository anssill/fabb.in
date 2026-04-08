'use client'

import { Bell, Search, ShieldAlert } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function AdminHeader() {
  return (
    <header className="fixed top-0 right-0 left-0 lg:left-0 z-30 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-4 lg:ml-64 transition-all duration-300">
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 px-2 py-0.5 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            System Admin Mode
          </Badge>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <div className="hidden md:flex relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search platform..."
              className="pl-9 h-9 bg-slate-100 dark:bg-slate-800 border-none focus-visible:ring-1"
            />
          </div>

          <Button variant="ghost" size="icon" className="relative text-slate-500">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
          </Button>
        </div>
      </div>
    </header>
  )
}
