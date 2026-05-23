'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import { calculateBillableRentalDays } from '@/lib/booking-utils'

const THERMAL_WIDTH = 226.77 // 80mm in PDF points.
const MM_TO_POINTS = 2.83465

const styles = StyleSheet.create({
  page: {
    width: THERMAL_WIDTH,
    padding: 10,
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#111111',
    backgroundColor: '#ffffff',
  },
  center: {
    textAlign: 'center',
  },
  businessName: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  muted: {
    color: '#333333',
  },
  divider: {
    borderTop: '0.5pt dashed #111111',
    marginVertical: 7,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 3,
  },
  label: {
    color: '#333333',
  },
  value: {
    fontWeight: 'bold',
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  itemRow: {
    marginBottom: 6,
  },
  itemName: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 3,
  },
  grandTotal: {
    borderTop: '0.5pt solid #111111',
    paddingTop: 5,
    marginTop: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },
  footer: {
    textAlign: 'center',
    fontSize: 7,
    color: '#333333',
    marginTop: 8,
  },
  signature: {
    textAlign: 'right',
    fontSize: 7,
    marginTop: 12,
  },
})

interface Props {
  booking: any
  business: any
  branch: any
}

function formatDate(value?: string | null, withYear = true) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' as const } : {}),
  })
}

export function BookingInvoice({ booking, business, branch }: Props) {
  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer
  const items: any[] = booking.booking_items || []
  const payments: any[] = (booking.booking_payments || []).filter((p: any) => !p.is_voided)
  const settings = ((branch?.settings as any)?.invoice) || {}
  const pageWidth = Math.max(164, Number(settings.paper_width_mm ?? 80) * MM_TO_POINTS)

  const rentalDays = booking.pickup_date && booking.return_date
    ? calculateBillableRentalDays(booking.pickup_date, booking.return_date)
    : 1

  const totalAmount = Number(booking.total_amount ?? 0)
  const paid = payments.reduce((acc: number, p: any) => acc + Number(p.amount), 0)
  const balance = Math.max(0, totalAmount - paid)
  const deposit = payments
    .filter((p: any) => p.type === 'deposit')
    .reduce((acc: number, p: any) => acc + Number(p.amount), 0)
  const advance = payments
    .filter((p: any) => p.type === 'advance')
    .reduce((acc: number, p: any) => acc + Number(p.amount), 0)

  const pageHeight = Math.max(430, 300 + items.length * 34 + payments.length * 16)
  const fmt = (n: number) => `Rs.${n.toLocaleString('en-IN')}`

  return (
    <Document>
      <Page size={[pageWidth, pageHeight]} style={[styles.page, { width: pageWidth }]}>
        <Text style={styles.businessName}>{business?.name || 'Fabb.booking'}</Text>
        {branch?.address ? <Text style={styles.center}>{branch.address}</Text> : null}
        <Text style={styles.center}>
          {[branch?.city, business?.state].filter(Boolean).join(', ')}
        </Text>
        {business?.gst_number && settings.gst_enabled !== false ? <Text style={styles.center}>GSTIN: {business.gst_number}</Text> : null}
        {business?.phone ? <Text style={styles.center}>Ph: {business.phone}</Text> : null}
        {settings.vyapar_counter_name ? <Text style={styles.center}>{settings.vyapar_counter_name}</Text> : null}

        <View style={styles.divider} />

        <Text style={[styles.center, { fontWeight: 'bold' }]}>BOOKING INVOICE</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Bill No</Text>
          <Text style={styles.value}>{booking.booking_number}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{formatDate(booking.created_at)}</Text>
        </View>
        {booking.physical_bill_number ? (
          <View style={styles.row}>
            <Text style={styles.label}>Physical Bill</Text>
            <Text style={styles.value}>{booking.physical_bill_number}</Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Customer</Text>
        <Text style={{ fontWeight: 'bold' }}>{customer?.name || 'Customer'}</Text>
        {customer?.phone ? <Text>{customer.phone}</Text> : null}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Rental</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Pickup</Text>
          <Text style={styles.value}>{formatDate(booking.pickup_date, false)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Return</Text>
          <Text style={styles.value}>{formatDate(booking.return_date, false)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Duration</Text>
          <Text style={styles.value}>{rentalDays} day{rentalDays !== 1 ? 's' : ''}</Text>
        </View>
        {booking.occasion ? (
          <View style={styles.row}>
            <Text style={styles.label}>Occasion</Text>
            <Text style={styles.value}>{booking.occasion}</Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Items</Text>
        {items.map((item: any, i: number) => {
          const itemRentalDays = item.rental_days ?? rentalDays
          const rate = Number(item.price ?? 0)
          const qty = Number(item.quantity ?? 1)
          const lineTotal = item.subtotal != null
            ? Number(item.subtotal)
            : rate * qty * itemRentalDays

          return (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemName}>
                {i + 1}. {item.item_name || '-'}{item.size ? ` (${item.size})` : ''}
              </Text>
              <View style={styles.itemMeta}>
                <Text style={styles.muted}>{qty} x {itemRentalDays}d x {fmt(rate)}</Text>
                <Text style={styles.value}>{fmt(lineTotal)}</Text>
              </View>
            </View>
          )
        })}

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text>Total Amount</Text>
          <Text style={styles.value}>{fmt(totalAmount)}</Text>
        </View>
        {advance > 0 ? (
          <View style={styles.totalRow}>
            <Text>Advance Paid</Text>
            <Text style={styles.value}>{fmt(advance)}</Text>
          </View>
        ) : null}
        {deposit > 0 ? (
          <View style={styles.totalRow}>
            <Text>Security Deposit</Text>
            <Text style={styles.value}>{fmt(deposit)}</Text>
          </View>
        ) : null}
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text>Balance Due</Text>
          <Text>{fmt(balance)}</Text>
        </View>

        {payments.length > 0 ? (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Payments</Text>
            {payments.map((payment: any) => (
              <View key={payment.id} style={styles.row}>
                <Text style={styles.label}>{payment.type} / {payment.method}</Text>
                <Text style={styles.value}>{fmt(Number(payment.amount))}</Text>
              </View>
            ))}
          </>
        ) : null}

        <View style={styles.divider} />

        {settings.show_bank_details && (settings.bank_name || settings.bank_account || settings.bank_ifsc) ? (
          <>
            <Text style={styles.sectionTitle}>Bank Details</Text>
            {settings.bank_name ? <Text>{settings.bank_name}</Text> : null}
            {settings.bank_account ? <Text>A/C: {settings.bank_account}</Text> : null}
            {settings.bank_ifsc ? <Text>IFSC: {settings.bank_ifsc}</Text> : null}
            <View style={styles.divider} />
          </>
        ) : null}

        <Text style={styles.footer}>
          {settings.footer_text || `Thank you for choosing ${business?.name || 'us'}.`}
        </Text>
        <Text style={styles.footer}>
          {settings.terms_text || 'Terms & Conditions Apply. This is a computer-generated invoice.'}
        </Text>
        {settings.signature_line !== false ? (
          <Text style={styles.signature}>Authorised Signatory</Text>
        ) : null}
      </Page>
    </Document>
  )
}
