'use client'
import { Document, Page, Image } from '@react-pdf/renderer'
/** The PDF embeds the same rendered document shown in Settings and shared as PNG. */
export function BookingInvoice({ image, height }: { image: string; height: number }) {
  return <Document><Page size={[226.77, height]} style={{ padding: 0, backgroundColor: '#fff' }}><Image src={image} style={{ width: 226.77, height }}/></Page></Document>
}
