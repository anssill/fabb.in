import type { CSSProperties, ReactNode } from 'react'
import type { InvoiceData } from '@/lib/invoice'

// Match the supplied 80 mm receipt: PDF points converted to CSS pixels at 96 dpi.
const pt = (value: number) => value * 4 / 3
const row: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: pt(8), marginBottom: pt(3) }
const valueStyle: CSSProperties = { fontWeight: 700, textAlign: 'right', flexShrink: 0, maxWidth: '78%' }
const footer: CSSProperties = { textAlign: 'center', fontSize: pt(7), color: '#333', marginTop: pt(8), whiteSpace: 'pre-wrap' }
const fmt = (amount: number) => `Rs.${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
const date = (value: string, withYear = true) => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' as const } : {}) }) : '-'
function Divider() { return <div aria-hidden="true" style={{ borderTop: '0.667px dashed #111', marginTop: pt(7), marginBottom: pt(7) }}/> }
function Heading({ children }: { children: ReactNode }) { return <h3 style={{ fontSize: pt(8), fontWeight: 700, margin: 0, marginBottom: pt(4) }}>{children}</h3> }
function AmountRow({ label, amount, bold = true }: { label: string; amount: number; bold?: boolean }) { return <div style={row}><span>{label}</span><span style={{ ...valueStyle, fontWeight: bold ? 700 : 400 }}>{fmt(amount)}</span></div> }

export function InvoiceDocument({ invoice }: { invoice: InvoiceData }) {
  const i = invoice, s = i.settings
  return <article aria-label="80 mm invoice" style={{ display: 'flex', flexDirection: 'column', width: 302.36, minHeight: pt(Math.max(430, 480 + i.items.length * 65 + i.payments.length * 20)), padding: pt(10), boxSizing: 'border-box', background: '#fff', color: '#111', font: `${pt(8)}px/1.1 Arial, Helvetica, sans-serif`, overflowWrap: 'anywhere', textAlign: 'left' }}>
    <header style={{ textAlign: 'center' }}>
      {s.show_logo && i.logoUrl && <img src={i.logoUrl} alt={i.businessName} style={{ display: 'block', width: pt(48), height: pt(48), objectFit: 'contain', margin: `0 auto ${pt(5)}px` }} crossOrigin="anonymous"/>}
      <p style={{ fontWeight: 700, fontSize: pt(12), marginBottom: pt(2) }}>{i.businessName}</p>
      {i.addressLines.map((line: string, index: number) => <p key={index}>{line}</p>)}
      {i.gstin && i.tax > 0 && <p>GSTIN: {i.gstin}</p>}
      {i.phone && <p>Ph: {i.phone}</p>}
    </header>
    <Divider/>
    <p style={{ textAlign: 'center', fontWeight: 700 }}>BOOKING INVOICE</p>
    <div style={row}><span style={{ color: '#333' }}>Bill No</span><span style={valueStyle}>{i.invoiceNumber}</span></div>
    <div style={row}><span style={{ color: '#333' }}>Date</span><span style={valueStyle}>{date(i.createdAt)}</span></div>
    {i.physicalBill && <div style={row}><span>Physical Bill</span><span style={valueStyle}>{i.physicalBill}</span></div>}
    <Divider/>
    <section><Heading>CUSTOMER</Heading><p style={{ fontWeight: 700 }}>{i.customerName}</p>{i.customerPhone && <p>{i.customerPhone}</p>}{i.additionalPhones.map(phone => <p key={phone}>Additional: {phone}</p>)}</section>
    <Divider/>
    <section><Heading>RENTAL</Heading>
      <div style={row}><span style={{ color: '#333' }}>Pickup</span><span style={valueStyle}>{date(i.pickupDate, false)}</span></div>
      <div style={row}><span style={{ color: '#333' }}>Return</span><span style={valueStyle}>{date(i.returnDate, false)}</span></div>
      <div style={row}><span style={{ color: '#333' }}>Duration</span><span style={valueStyle}>{i.rentalDays} day{i.rentalDays === 1 ? '' : 's'}</span></div>
      {i.occasion && <div style={row}><span>Occasion</span><span style={valueStyle}>{i.occasion}</span></div>}
    </section>
    <Divider/>
    <section><Heading>ITEMS</Heading>
      {i.items.map((item: InvoiceData['items'][number], index: number) => <div key={index} style={{ marginBottom: pt(6) }}>
        <p style={{ fontWeight: 700 }}>{index + 1}. {item.name}{item.size && ` (${item.size})`}</p>
        <div style={{ ...row, marginTop: pt(2), marginBottom: 0 }}><span style={{ color: '#333', minWidth: 0 }}>{item.quantity} x {fmt(item.price)}/pc {item.rateBasis === 'booking' ? '(entire booking)' : `x ${item.days}d`} · {item.discountFlat != null ? fmt(item.discountFlat) : `${item.discount}%`} off</span><span style={valueStyle}>{fmt(item.total)}</span></div>
      </div>)}
    </section>
    <Divider/>
    <section>
      <AmountRow label="Subtotal after discount" amount={i.total - i.tax} bold={false}/>
      {i.tax > 0 && <AmountRow label="GST" amount={i.tax} bold={false}/>}
      <AmountRow label="Total Amount" amount={i.total}/>
      {i.advance > 0 && <AmountRow label="Advance Paid" amount={i.advance}/>}
      {i.balancePayments > 0 && <AmountRow label="Balance Payments" amount={i.balancePayments}/>}
      {i.refunds > 0 && <AmountRow label="Rental Refunds" amount={i.refunds}/>}
      {i.deposit > 0 && <AmountRow label="Security Deposit" amount={i.deposit}/>}
      <div style={{ ...row, borderTop: '0.667px solid #111', paddingTop: pt(5), marginTop: pt(4), fontSize: pt(10), fontWeight: 700 }}><span>Balance Due</span><span style={valueStyle}>{fmt(i.balance)}</span></div>
    </section>
    {i.payments.length > 0 && <><Divider/><section><Heading>PAYMENTS</Heading>{i.payments.map((payment: any, index: number) => <div key={index} style={row}><div style={{ color: '#333' }}>{String(payment.type).replaceAll('_', ' ')} / {String(payment.method).replaceAll('_', ' ')}{payment.reference_number && <p style={{ fontSize: pt(7), marginTop: pt(2) }}>Ref: {payment.reference_number}</p>}</div><span style={valueStyle}>{fmt(Number(payment.amount))}</span></div>)}</section></>}
    <Divider/>
    {s.show_bank_details && (s.bank_name || s.bank_account || s.bank_ifsc) && <section>{s.bank_name && <p>Bank: {s.bank_name}</p>}{s.bank_account && <p>A/C: {s.bank_account}</p>}{s.bank_ifsc && <p>IFSC: {s.bank_ifsc}</p>}</section>}
    {s.signature_line && <p style={{ ...footer, marginTop: pt(25) }}>Authorised Signatory</p>}
    {s.footer_text && <p style={footer}>{s.footer_text}</p>}
    {s.terms_text && <p style={footer}>{s.terms_text}</p>}
  </article>
}
