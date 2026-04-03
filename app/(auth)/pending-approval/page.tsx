'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clock } from 'lucide-react'

export default function PendingApprovalPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  
  useEffect(() => {
    async function getUserAndStatus() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      const { data: staffData } = await supabase
        .from('staff')
        .select('name, email, status')
        .eq('id', authUser.id)
        .single()

      if (staffData) {
        if (staffData.status === 'approved') {
          router.push('/')
        } else {
          setUser({ name: staffData.name || '', email: staffData.email || authUser.email || '' })
        }
      } else {
        // Fallback user metadata if staff record is missing somehow
        setUser({ name: authUser.user_metadata?.full_name || 'User', email: authUser.email || '' })
      }
    }

    getUserAndStatus()

    // Auto-refresh every 30 seconds
    const intervalId = setInterval(getUserAndStatus, 30000)

    // Optional: Realtime subscription for immediate redirect
    const channel = supabase.channel('staff-status-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'staff' },
        (payload) => {
          if (payload.new.status === 'approved') {
            router.push('/')
          }
        }
      )
      .subscribe()

    return () => {
      clearInterval(intervalId)
      supabase.removeChannel(channel)
    }
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
          <Clock className="w-8 h-8 text-[#ccff00]" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Access Pending</h1>
        <p className="text-zinc-400 mb-6 font-medium">
          Your access request has been sent to your manager. You can close this window and wait for approval.
        </p>

        {user && (
          <div className="bg-zinc-950/50 rounded-xl p-4 w-full text-left border border-zinc-800/50 mb-6">
            <div className="text-sm text-zinc-500 mb-1">Signed in as</div>
            <div className="font-semibold text-zinc-100">{user.name}</div>
            <div className="text-sm text-zinc-400">{user.email}</div>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-zinc-500 mt-4">
          <div className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse"></div>
          Checking for approval automatically...
        </div>
      </div>
    </div>
  )
}
