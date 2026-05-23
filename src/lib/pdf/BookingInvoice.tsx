'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import { calculateBillableRentalDays } from '@/lib/booking-utils'

// Register fonts if needed (Optional for standard)
// Font.register({ family: 'Inter', src: '...' })

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottom: '1pt solid #e2e8f0',
    paddingBottom: 20,
  },
  businessInfo: {
    flexDirection: 'column',
    gap: 4,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  invoiceTitle: {
    fontSize: 24,
    color: '#94a3b8',
    textAlign: 'right',
  },
  detailsGrid: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 20,
  },
  detailBox: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 8,
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  table: {
    display: 'table' as any,
    width: 'auto',
    marginBottom: 30,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #f1f5f9',
    paddingVertical: 8,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    fontWeight: 'bold',
  },
  col1: { width: '5%' },
  col2: { width: '50%' },
  col3: { width: '15%', textAlign: 'center' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '15%', textAlign: 'right' },
  totals: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  totalsLabel: {
    width: 100,
    textAlign: 'right',
    paddingRight: 10,
    color: '#64748b',
  },
  totalsValue: {
    width: 80,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  grandTotal: {
    marginTop: 20,
    paddingTop: 10,
    borderTop: '1pt solid #0f172a',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  grandTotalLabel: {
    width: 100,
    textAlign: 'right',
    paddingRight: 10,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  grandTotalValue: {
    width: 80,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTop: '0.5pt solid #e2e8f0',
    paddingTop: 10,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 8,
  },
})

interface Props {
  booking: any
  business: any
  branch: any
}

export function BookingInvoice({ booking, business, branch }: Props) {
  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer
  const items: any[] = booking.booking_items || []
  const payments: any[] = (booking.booking_payments || []).filter((p: any) => !p.is_voided)

  // Calculate rental days from pickup/return dates
  const rentalDays = booking.pickup_date && booking.return_date
    ? calculateBillableRentalDays(booking.pickup_date, booking.return_date)
    : 1

  // Use total_amount from booking if available; otherwise derive from items
  const totalAmount = Number(booking.total_amount ?? 0)
  const paid = payments.reduce((acc: number, p: any) => acc + Number(p.amount), 0)
  const balance = Math.max(0, totalAmount - paid)
  const deposit = payments
    .filter((p: any) => p.type === 'deposit')
    .reduce((acc: number, p: any) => acc + Number(p.amount), 0)
  const advance = payments
    .filter((p: any) => p.type === 'advance')
    .reduce((acc: number, p: any) => acc + Number(p.amount), 0)

  const fmt = (n: number) => `Rs.${n.toLocaleString('en-IN')}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{business.name}</Text>
            {branch.address && <Text>{branch.address}</Text>}
            <Text>{branch.city}{business.state ? `, ${business.state}` : ''}</Text>
            {business.gst_number && <Text>GSTIN: {business.gst_number}</Text>}
            {business.phone && <Text>Ph: {business.phone}</Text>}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={{ textAlign: 'right', marginTop: 10 }}>#{booking.booking_number}</Text>
            <Text style={{ textAlign: 'right' }}>
              Date: {new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* Bill To & Rental Details */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailBox}>
            <Text style={styles.detailTitle}>Bill To</Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold' }}>{customer?.name || 'Customer'}</Text>
            <Text>{customer?.phone || ''}</Text>
            {customer?.email ? <Text>{customer.email}</Text> : null}
          </View>
          <View style={styles.detailBox}>
            <Text style={styles.detailTitle}>Rental Period</Text>
            <Text>Pickup: {booking.pickup_date ? new Date(booking.pickup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</Text>
            <Text>Return: {booking.return_date ? new Date(booking.return_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</Text>
            <Text>Duration: {rentalDays} day{rentalDays !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.detailBox}>
            <Text style={styles.detailTitle}>Booking Status</Text>
            <Text style={{ textTransform: 'uppercase', color: '#2563eb' }}>{booking.status}</Text>
            {booking.occasion ? <Text style={{ marginTop: 4 }}>Occasion: {booking.occasion}</Text> : null}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.col1}>#</Text>
            <Text style={styles.col2}>Item / Size</Text>
            <Text style={styles.col3}>Qty × Days</Text>
            <Text style={styles.col4}>Rate/Day</Text>
            <Text style={styles.col5}>Total</Text>
          </View>
          {items.map((item: any, i: number) => {
            const itemRentalDays = item.rental_days ?? rentalDays
            const rate = Number(item.price ?? 0)
            const qty = Number(item.quantity ?? 1)
            const lineTotal = item.subtotal != null
              ? Number(item.subtotal)
              : rate * qty * itemRentalDays
            return (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.col1}>{i + 1}</Text>
                <Text style={styles.col2}>{item.item_name || '-'}{item.size ? `  (${item.size})` : ''}</Text>
                <Text style={styles.col3}>{qty} × {itemRentalDays}d</Text>
                <Text style={styles.col4}>{fmt(rate)}</Text>
                <Text style={styles.col5}>{fmt(lineTotal)}</Text>
              </View>
            )
          })}
        </View>

        {/* Totals */}
        <View style={{ marginTop: 20 }}>
          <View style={styles.totals}>
            <Text style={styles.totalsLabel}>Total Amount:</Text>
            <Text style={styles.totalsValue}>{fmt(totalAmount)}</Text>
          </View>
          {advance > 0 && (
            <View style={styles.totals}>
              <Text style={styles.totalsLabel}>Advance Paid:</Text>
              <Text style={styles.totalsValue}>{fmt(advance)}</Text>
            </View>
          )}
          {deposit > 0 && (
            <View style={styles.totals}>
              <Text style={styles.totalsLabel}>Security Deposit:</Text>
              <Text style={styles.totalsValue}>{fmt(deposit)}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Balance Due:</Text>
            <Text style={styles.grandTotalValue}>{fmt(balance)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Thank you for choosing {business.name}! Please return items by{' '}
            {booking.return_date ? new Date(booking.return_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'the agreed date'}.
          </Text>
          <Text style={{ marginTop: 4 }}>Terms & Conditions Apply. This is a computer-generated invoice.</Text>
        </View>
      </Page>
    </Document>
  )
}
