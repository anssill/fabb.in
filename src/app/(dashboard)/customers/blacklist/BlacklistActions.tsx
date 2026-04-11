'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function BlacklistActions({ customerId, customerName }: { customerId: string; customerName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleRemove = async () => {
    if (!confirm(`Remove ${customerName} from the blacklist? They will be able to make new bookings.`)) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('customers')
        .update({ blacklisted: false, blacklisted_reason: null, blacklisted_at: null })
        .eq('id', customerId)
      if (error) throw error
      toast.success(`${customerName} removed from blacklist`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove from blacklist')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-green-600 border-green-200 hover:bg-green-50"
      onClick={handleRemove}
      disabled={loading}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3 mr-1" />}
      Remove
    </Button>
  )
}
