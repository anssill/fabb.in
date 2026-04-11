'use client'

import { Button } from '@/components/ui/button'

import { Printer, Loader2 } from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { BookingInvoice } from '@/lib/pdf/BookingInvoice'
import { useAppStore } from '@/lib/store'

interface Props {
  booking: any
}

export function DownloadInvoiceButton({ booking }: Props) {
  const { business, activeBranch } = useAppStore()

  if (!business || !activeBranch) return (
    <Button variant="outline" size="sm" disabled>
      <Printer className="w-4 h-4 mr-1" />
      Print
    </Button>
  )

  return (
    <PDFDownloadLink
      document={<BookingInvoice booking={booking} business={business} branch={activeBranch} />}
      fileName={`Invoice-${booking.booking_number}.pdf`}
    >
      {({ loading }) => (
        <Button variant="outline" size="sm" disabled={loading} className="bg-slate-50 hover:bg-slate-100 border-slate-200">
          {loading ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Printer className="w-4 h-4 mr-1" />
          )}
          {loading ? 'Generating...' : 'Print Invoice'}
        </Button>
      )}
    </PDFDownloadLink>
  )
}
