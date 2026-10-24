'use client'
import { toCanvas } from 'html-to-image'
import { BookingInvoice } from '@/lib/pdf/BookingInvoice'
export interface InvoiceFiles { image: File; pdf: Blob; pdfUrl: string; imageUrl: string }
export async function exportInvoice(node: HTMLElement, bookingNumber: string): Promise<InvoiceFiles> {
  await document.fonts.ready
  await Promise.all(Array.from(node.querySelectorAll('img')).map(async image => {
    if (!image.complete) await image.decode()
    if (!image.naturalWidth) throw new Error('Business logo could not load. Check the logo in Company settings and retry.')
  }))
  const canvas = await toCanvas(node, { pixelRatio: 3, backgroundColor: '#ffffff', fontEmbedCSS: '', cacheBust: false })
  const imageBlob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not create invoice image')), 'image/png'))
  const safeName = bookingNumber.replace(/[^a-zA-Z0-9_-]/g, '-') || 'booking'
  const image = new File([imageBlob], `Invoice-${safeName}.png`, { type: 'image/png' })
  const { pdf } = await import('@react-pdf/renderer')
  const height = canvas.height / canvas.width * 226.77
  const pdfBlob = await pdf(<BookingInvoice image={canvas.toDataURL('image/png')} height={height}/>).toBlob()
  return { image, pdf: pdfBlob, imageUrl: URL.createObjectURL(image), pdfUrl: URL.createObjectURL(pdfBlob) }
}
export function downloadFile(url: string, filename: string) {
  const link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove()
}
