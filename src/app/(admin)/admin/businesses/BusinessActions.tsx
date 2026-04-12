'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
        const _text = await res.text();
        const data = _text ? JSON.parse(_text) : {}
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

  const handleExtendTrial = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}/trial`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const _text = await res.text();
        const data = _text ? JSON.parse(_text) : {}
        throw new Error(data.error || 'Failed to extend trial')
      }

      toast.success(`Trial extended by 14 days for ${businessName}`)
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
        <DropdownMenuItem onClick={handleExtendTrial}>
          Extend Trial by 14 Days
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
