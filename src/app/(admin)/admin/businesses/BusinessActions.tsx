'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { safeJsonParse } from '@/lib/api-utils'
import { MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Props {
  businessId: string
  currentStatus: string
  businessName: string
}

export function BusinessActions({ businessId, currentStatus, businessName }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const isSuspended = currentStatus === 'suspended'

  const handleStatusToggle = async () => {
    const newStatus = isSuspended ? 'active' : 'suspended'
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const data = await safeJsonParse(res)
        throw new Error(data.error || 'Failed to update status')
      }

      toast.success(
        isSuspended
          ? `${businessName} reactivated`
          : `${businessName} suspended`
      )
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Action failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400"
          disabled={isLoading}
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/admin/businesses/${businessId}`)}>
          View Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleStatusToggle}>
          {isSuspended ? 'Reactivate Business' : 'Suspend Business'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
