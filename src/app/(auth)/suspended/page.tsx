'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Ban } from 'lucide-react'
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
    <Card className="shadow-sm border-slate-200">
      <CardContent className="flex flex-col items-center text-center py-10 space-y-4">
        <Ban className="w-16 h-16 text-red-500" />
        <h1 className="text-xl font-semibold text-red-600">Account Suspended</h1>
        <p className="text-slate-600">
          Your account has been suspended by your business administrator.
        </p>
        <p className="text-sm text-slate-400">
          If you believe this is a mistake, contact your admin.
        </p>
        <div className="flex flex-col gap-2 w-full max-w-xs pt-4">
          <Button variant="outline" asChild>
            <a
              href="https://wa.me/919876543210?text=Hi%2C%20my%20Fabb.booking%20account%20has%20been%20suspended"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact Admin on WhatsApp
            </a>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
