'use client'

import { motion } from 'framer-motion'
import { Button } from '@heroui/react'
import { Ban, MessageCircle, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SuspendedPage() {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col relative overflow-hidden justify-center items-center py-12 px-4">
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-red-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md z-10 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-slate-900/40 backdrop-blur-xl border border-red-500/20 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden text-center"
        >
          {/* Inner top glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Ban className="w-10 h-10 text-red-400" />
          </motion.div>

          <h1 className="text-2xl font-bold text-white mb-2">Account Suspended</h1>
          <p className="text-slate-400 mb-2">
            Your account has been suspended by your business administrator.
          </p>
          <p className="text-sm text-slate-500 mb-8">
            If you believe this is a mistake, contact your admin.
          </p>

          <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
            <a
              href="https://wa.me/919876543210?text=Hi%2C%20my%20Fabb.booking%20account%20has%20been%20suspended"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button
                className="w-full bg-green-600 hover:bg-green-500 text-white h-12 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
              >
                <MessageCircle className="w-4 h-4" />
                Contact Admin on WhatsApp
              </Button>
            </a>
            <Button
              variant="ghost"
              className="w-full text-slate-400 hover:text-white h-10 rounded-xl flex items-center justify-center gap-2"
              onPress={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
