'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { QRScanner } from '@/components/shared/QRScanner'
import { QrCode, Loader2, Package, CheckCircle, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface BookingActionsProps {
  booking: {
    id: string
    status: string
  }
}

export function BookingActions({ booking }: BookingActionsProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  const handleManualStatusChange = async (newStatus: string) => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/bookings/${booking.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      
      toast.success(`Booking marked as ${newStatus}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleScanSuccess = async (sku: string) => {
    setIsUpdating(true)
    try {
      // Find the item in the booking by SKU and update its specific status or the whole booking
      const res = await fetch(`/api/bookings/${booking.id}/items/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku }),
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Scan failed')

      toast.success(`Item ${sku} identified: ${data.message}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Dynamic Actions based on Status */}
      {booking.status === 'booked' && (
        <Button 
          className="w-full bg-amber-500 hover:bg-amber-600 text-white" 
          size="sm"
          onClick={() => handleManualStatusChange('out')}
          disabled={isUpdating}
        >
          {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Package className="w-4 h-4 mr-2" />}
          Mark as Picked Up
        </Button>
      )}

      {booking.status === 'out' && (
        <Button 
          className="w-full bg-green-600 hover:bg-green-700 text-white" 
          size="sm"
          onClick={() => handleManualStatusChange('returned')}
          disabled={isUpdating}
        >
          {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
          Mark as Returned
        </Button>
      )}

      {booking.status === 'returned' && (
        <Button 
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
          size="sm"
          onClick={() => handleManualStatusChange('completed')}
          disabled={isUpdating}
        >
          {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
          Complete Booking
        </Button>
      )}

      {/* QR Scanner Trigger */}
      <Button 
        variant="outline" 
        className="w-full border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100" 
        size="sm"
        onClick={() => setIsScannerOpen(true)}
      >
        <QrCode className="w-4 h-4 mr-2" />
        Scan Item Tag
      </Button>

      <QRScanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScanSuccess={handleScanSuccess} 
      />
    </div>
  )
}
