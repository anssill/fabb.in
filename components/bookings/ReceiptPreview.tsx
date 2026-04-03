import { Booking, BookingItem, BookingPayment, Customer } from '@/lib/types/echo'

export type ReceiptItem = {
  item?: { name?: string; daily_rate?: number }
  name?: string
  size?: string
  quantity?: number
  daily_rate?: number
}

export interface ReceiptBookingShape {
  booking_id_display?: string
  customer?: { name?: string | null; phone?: string | null }
  customers?: { name?: string | null; phone?: string | null }
  items?: ReceiptItem[]
  booking_items?: ReceiptItem[]
  selectedItems?: ReceiptItem[]
  advance_paid?: number
  deposit_collected?: number
  total_amount?: number
  payment?: { advance_amount?: number; deposit_amount?: number; advance?: number; deposit?: number }
  pricing?: { total_amount?: number; total?: number; deposit?: number; advance?: number }
  [key: string]: unknown
}

interface ReceiptPreviewProps {
  booking: ReceiptBookingShape
  className?: string
}

export function ReceiptPreview({ booking, className = '' }: ReceiptPreviewProps) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${booking.booking_id_display || 'DEMO-123'}`

  // Determine items based on draft state or loaded database booking state
  const items = (booking.items || booking.booking_items || booking.selectedItems || []) as ReceiptItem[]
  const customerName = booking.customer?.name || booking.customers?.name || 'Walk-in'
  const customerPhone = booking.customer?.phone || booking.customers?.phone || '-'
  const advance = booking.advance_paid || booking.payment?.advance_amount || booking.payment?.advance || 0
  const deposit = booking.deposit_collected || booking.payment?.deposit_amount || booking.pricing?.deposit || 0
  const total = booking.total_amount || booking.pricing?.total_amount || booking.pricing?.total || 0
  const balance = total - advance

  return (
    <>
      <style suppressHydrationWarning>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-print-wrapper, .receipt-print-wrapper * {
            visibility: visible;
          }
          .receipt-print-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 68mm !important;
            margin: 0 !important;
            padding: 8px !important;
            box-shadow: none !important;
          }
        }
      `}</style>
      <div className={`receipt-print-wrapper mx-auto bg-white text-black p-4 font-mono text-sm shadow-md ${className}`} style={{ width: '68mm', minHeight: '100mm' }}>
      <div className="text-center font-bold text-lg mb-1">ECHO RENTALS</div>
      <div className="text-center text-xs mb-2">Branch: STX | GST: 29XXXXXXXXXX</div>
      
      <div className="border-t border-dashed border-black/40 my-2"></div>
      
      <div className="text-center text-lg font-bold my-2">{booking.booking_id_display || 'NEW-BOOKING'}</div>
      <div className="flex justify-center my-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrUrl} alt="Booking QR" width={80} height={80} className="filter grayscale" />
      </div>
      
      <div className="border-t border-dashed border-black/40 my-2"></div>
      
      <div className="mb-1 text-xs font-bold uppercase tracking-wider">Customer Details</div>
      <div className="mb-1">{customerName}</div>
      <div className="mb-2">+91 {customerPhone}</div>
      
      <div className="border-t border-dashed border-black/40 my-2"></div>
      <div className="mb-1 text-xs font-bold uppercase tracking-wider">Rental Items</div>
      {items.map((si: ReceiptItem, idx: number) => {
        const name = si.item?.name || si.name || 'Unknown Item'
        const size = si.size || '-'
        const qty = si.quantity || 1
        const rate = si.item?.daily_rate || si.daily_rate || 0
        return (
          <div key={idx} className="flex justify-between mb-1 text-xs">
            <span>{name} ({size}×{qty})</span>
            <span>₹{rate * qty}</span>
          </div>
        )
      })}
      
      <div className="border-t border-dashed border-black/40 my-2"></div>
      
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="font-semibold">Advance</span>
          <span>₹{advance}</span>
        </div>
        <div className="flex justify-between">
          <span>Deposit (Ref.)</span>
          <span>₹{deposit}</span>
        </div>
        <div className="flex justify-between font-bold pt-1 border-t border-black/20">
          <span>Balance Due</span>
          <span>₹{balance}</span>
        </div>
      </div>
      
      <div className="border-t border-solid border-black my-4"></div>
      <div className="text-[10px] text-center mt-4 uppercase leading-relaxed tracking-wider">
        Items must be returned in good condition. 
        Late returns incur a penalty.
      </div>
    </div>
    </>
  )
}
