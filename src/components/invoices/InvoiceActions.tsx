'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { buildInvoice, invoiceMessage, bookingStatusMessage, whatsappPhone, type InvoiceData } from '@/lib/invoice'
import { InvoiceDocument } from './InvoiceDocument'
import type { InvoiceFiles } from '@/lib/invoice-export'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Download, Loader2, Printer, Share2 } from 'lucide-react'
import { toast } from 'sonner'

export function InvoiceActions({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false)
  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [files, setFiles] = useState<InvoiceFiles | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [sharing, setSharing] = useState(false)
  const [canShareFile, setCanShareFile] = useState(false)
  const documentRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setInvoice(null); setError('')
    async function load() {
      try {
        // Use the saved booking and its own branch, even if the active branch changed.
        const { data, error } = await createClient().from('bookings').select(`
          id, status, booking_number, created_at, pickup_date, return_date, occasion, physical_bill_number, additional_contact_numbers, subtotal, discount_amount, tax_amount, total_amount,
          customer:customers(name,phone), branch:branches(settings,address,city,phone), business:businesses(name,address,city,state,phone,gst_number,logo_url),
          booking_items(item_name,size,quantity,price,rental_days,rate_basis,discount_percent,discount_flat,line_total),
          booking_payments(id,type,amount,method,reference_number,is_voided)
        `).eq('id', bookingId).single()
        if (error || !data) throw new Error(error?.message || 'Invoice not found')
        if (!cancelled) setInvoice(buildInvoice(data, data.business, data.branch))
      } catch (error) { if (!cancelled) setError(error instanceof Error ? error.message : 'Could not load invoice') }
    }
    void load()
    return () => { cancelled = true }
  }, [open, bookingId, attempt])
  useEffect(() => {
    setFiles(null)
    if (!open || !invoice || !documentRef.current) return
    let cancelled = false
    let prepared: InvoiceFiles | undefined
    const node = documentRef.current.firstElementChild as HTMLElement
    async function prepare() {
      try {
        const { exportInvoice } = await import('@/lib/invoice-export')
        const result = await exportInvoice(node, invoice!.bookingNumber)
        if (cancelled) { URL.revokeObjectURL(result.imageUrl); URL.revokeObjectURL(result.pdfUrl); return }
        prepared = result; setFiles(result)
        setCanShareFile(Boolean(navigator.canShare?.({ files: [result.image] }) && navigator.share))
      } catch (error) { if (!cancelled) setError(error instanceof Error ? error.message : 'Could not prepare invoice') }
    }
    void prepare()
    return () => { cancelled = true; if (prepared) { URL.revokeObjectURL(prepared.imageUrl); URL.revokeObjectURL(prepared.pdfUrl) } }
  }, [open, invoice])
  const share = async () => {
    if (!files || !invoice || sharing) return
    const text = invoiceMessage(invoice)
    setSharing(true)
    try {
      if (canShareFile) {
        // Prepared ahead of this click, preserving the browser's user activation.
        await navigator.share({ files: [files.image], title: `Invoice ${invoice.bookingNumber}`, text })
      } else {
        const phone = whatsappPhone(invoice.customerPhone)
        if (!phone) throw new Error('The customer needs a valid phone number to open WhatsApp')
        const link = document.createElement('a'); link.href = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.click()
        const download = document.createElement('a'); download.href = files.imageUrl; download.download = files.image.name; download.click()
        toast.info('Invoice image downloaded. Attach it in the WhatsApp chat before sending.')
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) toast.error(error instanceof Error ? error.message : 'Could not share invoice. Use Download image to attach it manually.')
    } finally { setSharing(false) }
  }
  const shareStatus = () => {
    if (!invoice) return
    const phone = whatsappPhone(invoice.customerPhone)
    if (!phone) { toast.error('The customer needs a valid phone number to open WhatsApp'); return }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(bookingStatusMessage(invoice))}`, '_blank', 'noopener,noreferrer')
  }
  return <Dialog open={open} onOpenChange={value => { if (!sharing) setOpen(value) }}>
    <DialogTrigger asChild><Button variant="outline" size="sm"><Printer className="mr-2 h-4 w-4"/>Invoice / WhatsApp</Button></DialogTrigger>
    <DialogContent className="flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-lg">
      <DialogHeader><DialogTitle>Booking invoice</DialogTitle><DialogDescription>80 mm thermal · uses this booking branch’s saved invoice settings.</DialogDescription></DialogHeader>
      {error && <div role="alert" className="text-sm text-destructive">{error}<Button variant="link" onClick={() => setAttempt(value => value + 1)}>Retry</Button></div>}
      {!invoice && !error && <p className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin"/>Loading invoice…</p>}
      <div className="min-h-0 overflow-auto rounded-lg bg-slate-100 p-2"><div ref={documentRef} className="mx-auto w-fit">{invoice && <InvoiceDocument invoice={invoice}/>}</div></div>
      {invoice && <div className="shrink-0 space-y-2">
        {!files && !error && <p className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin"/>Preparing invoice image…</p>}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={!files} onClick={() => files && window.open(files.pdfUrl, '_blank', 'noopener,noreferrer')}><Printer className="mr-1 h-4 w-4"/>Print / PDF</Button>
          <Button variant="outline" size="sm" disabled={!files} onClick={async () => { if (files) { const { downloadFile } = await import('@/lib/invoice-export'); downloadFile(files.imageUrl, files.image.name) } }}><Download className="mr-1 h-4 w-4"/>Download image</Button>
          <Button size="sm" disabled={!files || sharing} onClick={share}><Share2 className="mr-1 h-4 w-4"/>{sharing ? 'Sharing…' : 'Share via WhatsApp'}</Button>
          <Button variant="outline" size="sm" disabled={sharing} onClick={shareStatus}><Share2 className="mr-1 h-4 w-4"/>Share status to WhatsApp</Button>
        </div>
        <p className="text-xs text-muted-foreground">{canShareFile ? 'Choose WhatsApp and the customer in the share menu. The invoice image and booking message are included.' : 'The invoice image downloads and the customer’s WhatsApp chat opens. Attach the downloaded image there before sending.'}</p>
      </div>}
    </DialogContent>
  </Dialog>
}
