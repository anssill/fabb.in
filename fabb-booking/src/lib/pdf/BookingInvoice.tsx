'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer'

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
  const items = booking.booking_items || []
  const payments = booking.booking_payments || []

  const subtotal = items.reduce((acc: number, item: any) => acc + (Number(item.rental_rate) * Number(item.quantity)), 0)
  const paid = payments.reduce((acc: number, p: any) => acc + Number(p.amount), 0)
  const balance = subtotal - paid

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{business.name}</Text>
            <Text>{branch.address || branch.city}</Text>
            <Text>{branch.city}, {business.state || ''}</Text>
            <Text>GSTIN: {business.gst_number || 'N/A'}</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={{ textAlign: 'right', marginTop: 10 }}>#{booking.booking_number}</Text>
            <Text style={{ textAlign: 'right' }}>Date: {new Date(booking.created_at).toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Bill To & Details */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailBox}>
            <Text style={styles.detailTitle}>Bill To</Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold' }}>{customer?.name}</Text>
            <Text>{customer?.phone}</Text>
          </View>
          <View style={styles.detailBox}>
            <Text style={styles.detailTitle}>Timeline</Text>
            <Text>Pickup: {new Date(booking.pickup_date).toLocaleDateString()}</Text>
            <Text>Return: {new Date(booking.return_date).toLocaleDateString()}</Text>
          </View>
          <View style={styles.detailBox}>
            <Text style={styles.detailTitle}>Status</Text>
            <Text style={{ textTransform: 'uppercase', color: '#2563eb' }}>{booking.status}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.col1}>#</Text>
            <Text style={styles.col2}>Item</Text>
            <Text style={styles.col3}>Size</Text>
            <Text style={styles.col4}>Rate</Text>
            <Text style={styles.col5}>Total</Text>
          </View>
          {items.map((item: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.col1}>{i + 1}</Text>
              <Text style={styles.col2}>{item.item_name}</Text>
              <Text style={styles.col3}>{item.item_variants?.size || '-'}</Text>
              <Text style={styles.col4}>₹{Number(item.rental_rate).toLocaleString()}</Text>
              <Text style={styles.col5}>₹{(Number(item.rental_rate) * Number(item.quantity)).toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={{ marginTop: 20 }}>
          <View style={styles.totals}>
            <Text style={styles.totalsLabel}>Subtotal:</Text>
            <Text style={styles.totalsValue}>₹{subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.totals}>
            <Text style={styles.totalsLabel}>Paid:</Text>
            <Text style={styles.totalsValue}>₹{paid.toLocaleString()}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Balance Due:</Text>
            <Text style={styles.grandTotalValue}>₹{balance.toLocaleString()}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business! Please return the items by {new Date(booking.return_date).toLocaleDateString()}.</Text>
          <Text style={{ marginTop: 4 }}>Company Terms & Conditions Apply.</Text>
        </View>
      </Page>
    </Document>
  )
}
