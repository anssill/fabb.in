'use client'
import { InvoiceActions } from '@/components/invoices/InvoiceActions'
export function DownloadInvoiceButton({ booking }: { booking: { id: string } }) {
  return <InvoiceActions bookingId={booking.id}/>
}
