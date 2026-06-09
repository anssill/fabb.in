'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2 } from 'lucide-react'
import { syncFullInventory } from '../inventory-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function SyncInventoryButton() {
  const [isSyncing, setIsSyncing] = useState(false)
  const router = useRouter()

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await syncFullInventory()
      toast.success('Inventory stock levels synchronized successfully')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to synchronize inventory')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 sm:w-auto"
      onClick={handleSync}
      disabled={isSyncing}
    >
      {isSyncing ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <RefreshCw className="w-4 h-4 mr-2" />
      )}
      {isSyncing ? 'Syncing...' : 'Sync Statistics'}
    </Button>
  )
}
