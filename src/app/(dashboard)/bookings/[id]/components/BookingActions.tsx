'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { QRScanner } from '@/components/shared/QRScanner'
import { QrCode, Loader2, Package, CheckCircle, RefreshCw, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { syncFullInventory } from '@/app/(dashboard)/inventory/inventory-actions'
import { AddPaymentDialog } from './AddPaymentDialog'
import { CancelBookingDialog } from './CancelBookingDialog'

interface BookingActionsProps {
  booking: {
    id: string
    status: string
    business_id: string
    branch_id: string
    staff_id: string
    balance_due: number
    deposit_amount: number
    total_amount: number
    booking_items: Array<{ id: string; item_name: string; size: string; quantity: number }>
  }
}

export function BookingActions({ booking }: BookingActionsProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
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

      toast.success(`Booking marked as ${newStatus === 'closed' ? 'closed' : newStatus}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await syncFullInventory()
      toast.success('Inventory stock levels reconciled')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Sync failed')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleScanSuccess = async (sku: string) => {
    setIsUpdating(true)
    try {
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

  const isActive = booking.status !== 'closed' && booking.status !== 'cancelled'
  const canCancel = booking.status === 'booked' || booking.status === 'out'

  return (
    <div className="space-y-3">
      {/* Process Pickup — dedicated page */}
      {booking.status === 'booked' && (
        <Button
          className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          size="sm"
          asChild
        >
          <Link href={`/bookings/${booking.id}/pickup`}>
            <Package className="w-4 h-4 mr-2" />
            Process Pickup
          </Link>
        </Button>
      )}

      {/* Process Return — dedicated page */}
      {booking.status === 'out' && (
        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          size="sm"
          asChild
        >
          <Link href={`/bookings/${booking.id}/return`}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Process Return
          </Link>
        </Button>
      )}

      {/* Close Booking */}
      {booking.status === 'returned' && (
        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          size="sm"
          onClick={() => handleManualStatusChange('closed')}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" />
          )}
          Close Booking
        </Button>
      )}

      {/* Add Payment — visible for all non-terminal statuses */}
      {isActive && (
        <AddPaymentDialog
          bookingId={booking.id}
          businessId={booking.business_id}
          branchId={booking.branch_id}
          staffId={booking.staff_id}
          balanceDue={booking.balance_due}
          depositAmount={booking.deposit_amount}
          totalAmount={booking.total_amount}
        />
      )}

      {/* Cancel Booking */}
      {canCancel && (
        <CancelBookingDialog
          bookingId={booking.id}
          onSuccess={() => router.refresh()}
        />
      )}

      {/* QR Scanner */}
      <Button
        variant="outline"
        className="w-full border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100"
        size="sm"
        onClick={() => setIsScannerOpen(true)}
      >
        <QrCode className="w-4 h-4 mr-2" />
        Scan Item Tag
      </Button>

      {/* Reconcile */}
      <Button
        variant="ghost"
        className="w-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 text-xs py-1 h-auto"
        onClick={handleSync}
        disabled={isSyncing}
      >
        {isSyncing ? (
          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
        ) : (
          <RefreshCw className="w-3 h-3 mr-2" />
        )}
        {isSyncing ? 'Syncing Stock...' : 'Reconcile System Stock'}
      </Button>

      <QRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  )
}
