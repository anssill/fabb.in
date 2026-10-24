import { calculateBillableRentalDays } from '@/lib/booking-utils'
export interface InvoiceSettings {
  prefix: string; gst_enabled: boolean; gst_rate: number; show_logo: boolean;
  footer_text: string; terms_text: string; show_bank_details: boolean;
  bank_name: string; bank_account: string; bank_ifsc: string; signature_line: boolean;
  whatsapp_invoice_template: string; whatsapp_status_template: string;
}
export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  prefix: 'INV', gst_enabled: false, gst_rate: 18, show_logo: true,
  footer_text: 'Thank you for choosing us.',
  terms_text: 'Terms & Conditions Apply. This is a computer-generated invoice.',
  show_bank_details: false, bank_name: '', bank_account: '', bank_ifsc: '', signature_line: true,
  whatsapp_invoice_template: 'Dear {customer_name}, your booking {booking_number} at {business_name} is {status}.\nPickup: {pickup_date}\nReturn: {return_date}\nTotal: {total}\nPaid: {paid}\nBalance due: {balance}\nYour invoice is attached.',
  whatsapp_status_template: 'Dear {customer_name}, your booking {booking_number} at {business_name} is now {status}.\nPickup: {pickup_date}\nReturn: {return_date}\nBalance due: {balance}',
}
export function invoiceSettings(settings?: Partial<InvoiceSettings>, businessName = 'us'): InvoiceSettings {
  return Object.fromEntries(Object.entries(DEFAULT_INVOICE_SETTINGS).map(([key, fallback]) => [key, settings?.[key as keyof InvoiceSettings] ?? (key === 'footer_text' ? `Thank you for choosing ${businessName}.` : fallback)])) as unknown as InvoiceSettings
}
const one = (value: any) => Array.isArray(value) ? value[0] : value
export function buildInvoice(booking: any, businessInput: any, branchInput: any) {
  const business = one(businessInput) ?? {}, branch = one(branchInput) ?? {}, customer = one(booking.customer) ?? {}
  const settings = invoiceSettings(branch.settings?.invoice, business.name || 'us')
  const payments = (booking.booking_payments ?? []).filter((p: any) => !p.is_voided)
  const paid = payments.reduce((sum: number, p: any) => sum + (['advance', 'balance'].includes(p.type) ? Number(p.amount) : p.type === 'refund' ? -Number(p.amount) : 0), 0)
  const deposit = payments.reduce((sum: number, p: any) => sum + (p.type === 'deposit' ? Number(p.amount) : p.type === 'deposit_refund' ? -Number(p.amount) : 0), 0)
  const advance = payments.filter((p: any) => p.type === 'advance').reduce((sum: number, p: any) => sum + Number(p.amount), 0)
  const balancePayments = payments.filter((p: any) => p.type === 'balance').reduce((sum: number, p: any) => sum + Number(p.amount), 0)
  const refunds = payments.filter((p: any) => p.type === 'refund').reduce((sum: number, p: any) => sum + Number(p.amount), 0)
  const addressLines = [branch.address || business.address, [branch.city || business.city, business.state].filter(Boolean).join(', ')].filter(Boolean)
  return {
    settings, advance, balancePayments, refunds, addressLines, status: String(booking.status || 'confirmed').replace(/_/g, ' '),
    rentalDays: calculateBillableRentalDays(booking.pickup_date, booking.return_date), occasion: booking.occasion || '',
 businessName: business.name || 'Your business', logoUrl: business.logo_url || '',
    address: [business.address || branch.address, business.city || branch.city, business.state].filter(Boolean).join(', '),
    gstin: business.gst_number || '', phone: business.phone || branch.phone || '', customerName: customer.name || 'Customer', customerPhone: customer.phone || '', additionalPhones: (booking.additional_contact_numbers || []) as string[],
    bookingNumber: String(booking.booking_number || ''), invoiceNumber: `${settings.prefix || 'INV'}-${booking.booking_number || ''}`,
    createdAt: booking.created_at, pickupDate: booking.pickup_date, returnDate: booking.return_date, physicalBill: booking.physical_bill_number || '',
    items: (booking.booking_items ?? []).map((item: any) => {
      const price = Number(item.price ?? 0), quantity = Number(item.quantity ?? 1), days = item.rate_basis === 'booking' ? 1 : Number(item.rental_days ?? 1)
      const discount = Number(item.discount_percent ?? 0)
      const discountFlat = item.discount_flat == null ? null : Number(item.discount_flat)
      return { name: item.item_name || item.name || '-', size: item.size || '', price, quantity, discount, discountFlat, days, rateBasis: item.rate_basis ?? 'day', total: Number(item.line_total ?? Math.round((price * quantity * days - (discountFlat ?? price * quantity * days * discount / 100)) * 100) / 100) }
    }),
    subtotal: Number(booking.subtotal ?? 0), discount: Number(booking.discount_amount ?? 0), tax: Number(booking.tax_amount ?? 0),
    total: Number(booking.total_amount ?? 0), paid, deposit, balance: Math.max(0, Number(booking.total_amount ?? 0) - paid), payments,
  }
}
export type InvoiceData = ReturnType<typeof buildInvoice>
export function whatsappPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^00/, '')
  if (digits.length === 10) return `91${digits}`
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`
  if (digits.length >= 8 && digits.length <= 15) return digits
  return ''
}
export function renderWhatsAppTemplate(template: string, invoice: InvoiceData): string {
  const values: Record<string, string> = {
    customer_name: invoice.customerName, business_name: invoice.businessName,
    booking_number: invoice.bookingNumber, invoice_number: invoice.invoiceNumber, status: invoice.status,
    pickup_date: invoice.pickupDate || '', return_date: invoice.returnDate || '',
    total: `₹${invoice.total.toLocaleString('en-IN')}`, paid: `₹${invoice.paid.toLocaleString('en-IN')}`,
    balance: `₹${invoice.balance.toLocaleString('en-IN')}`,
  }
  return template.replace(/\{([a-z_]+)\}/g, (match, key: string) => values[key] ?? match)
}
export function invoiceMessage(invoice: InvoiceData): string {
  return renderWhatsAppTemplate(invoice.settings.whatsapp_invoice_template, invoice)
}
export function bookingStatusMessage(invoice: InvoiceData): string {
  return renderWhatsAppTemplate(invoice.settings.whatsapp_status_template, invoice)
}
