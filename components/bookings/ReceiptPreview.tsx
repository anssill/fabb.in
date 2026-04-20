import { Booking } from '@/lib/types/echo'
import { JetBrains_Mono } from 'next/font/google'

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-jetbrains'
})

interface ReceiptPreviewProps {
  booking: Partial<Booking>
  className?: string
}

export function ReceiptPreview({ booking, className = '' }: ReceiptPreviewProps) {
  const qrUrl = booking?.booking_number 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${booking.booking_number}`
    : ''

  // Data mapping from the joined Supabase structure
  const items = booking?.booking_items || []
  const customerName = booking?.customers?.name || 'Walk-in'
  const customerPhone = booking?.customers?.phone || '-'
  const advance = Number(booking?.advance_amount || 0)
  const deposit = Number(booking?.deposit_amount || 0)
  const total = Number(booking?.total_amount || 0)
  const balance = Number(booking?.balance_due || (total - advance))
  
  // Business/Branch info
  const businessName = booking?.branches?.businesses?.name || 'ECHO RENTALS'
  const branchName = booking?.branches?.name || 'Main Branch'
  const branchAddress = booking?.branches?.address || ''
  const branchPhone = booking?.branches?.contact || ''
  const gstNumber = booking?.branches?.gst_number || ''

  return (
    <>
      <style suppressHydrationWarning>{`
        @media print {
          body * {
            visibility: hidden;
            background: white !important;
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
            padding: 12px !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      
      <div 
        className={`receipt-print-wrapper mx-auto bg-white text-black p-6 font-sans antialiased shadow-sm ${jetbrainsMono.variable} ${className}`} 
        style={{ width: '68mm', minHeight: '120mm' }}
      >
        {/* Header - Digital Atelier Style */}
        <div className="text-center mb-6">
          <div className="text-xl font-bold tracking-tighter uppercase mb-0.5">{businessName}</div>
          <div className="text-[10px] opacity-60 uppercase tracking-widest mb-2 font-medium">{branchName}</div>
          {branchAddress && <div className="text-[9px] leading-tight mb-1 opacity-70">{branchAddress}</div>}
          <div className="text-[9px] font-mono tracking-tight">
            {gstNumber && <span>GST: {gstNumber}</span>}
            {branchPhone && <span> • PH: {branchPhone}</span>}
          </div>
        </div>

        {/* Separator - No Solid Lines, Use Tonal Shift or Minimal Dots */}
        <div className="h-px bg-black/5 mb-6" />

        {/* Booking ID & QR */}
        <div className="text-center mb-6">
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2 opacity-40">Booking Receipt</div>
          <div className="font-mono text-lg font-bold mb-4 tracking-tighter">
            {booking?.booking_number || 'PENDING'}
          </div>
          {qrUrl && (
            <div className="flex justify-center mb-2">
              <div className="p-1 border border-black/5 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={qrUrl} 
                  alt="Booking QR" 
                  width={100} 
                  height={100} 
                  className="filter grayscale contrast-[150%]" 
                />
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-black/5 mb-6" />

        {/* Customer Section */}
        <div className="mb-6">
          <div className="text-[9px] uppercase tracking-widest font-bold mb-1.5 opacity-40 italic">Consignee</div>
          <div className="text-xs font-bold uppercase tracking-tight mb-0.5">{customerName}</div>
          <div className="text-xs font-mono opacity-80">{customerPhone}</div>
        </div>

        {/* Items Section */}
        <div className="mb-6">
          <div className="text-[9px] uppercase tracking-widest font-bold mb-2 opacity-40 italic">Rental Manifest</div>
          <div className="space-y-3">
            {items.map((item: any, idx: number) => (
              <div key={idx} className="text-xs">
                <div className="flex justify-between items-start font-bold uppercase tracking-tighter mb-0.5">
                  <span className="flex-1">{item.item_name}</span>
                  <span className="font-mono ml-2 tabular-nums">₹{Number(item.subtotal).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[10px] opacity-60 uppercase font-medium">
                  <span>{item.size} × {item.quantity} QTY</span>
                  <span className="font-mono italic">@ ₹{item.daily_rate}/DAY</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="mt-8 pt-4 bg-zinc-50/50 p-3 -mx-3">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] uppercase tracking-tight">
              <span className="opacity-50">Grand Total</span>
              <span className="font-mono font-bold tracking-tighter tabular-nums">₹{total.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-[10px] uppercase tracking-tight">
              <span className="opacity-50 font-bold">Advance Paid</span>
              <span className="font-mono font-bold tracking-tighter tabular-nums">₹{advance.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-[10px] uppercase tracking-tight">
              <span className="opacity-50 font-bold italic">Security Deposit</span>
              <span className="font-mono font-bold tracking-tighter tabular-nums">₹{deposit.toLocaleString('en-IN')}</span>
            </div>
            
            <div className="mt-3 pt-3 border-t border-black/10">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-black uppercase tracking-widest">Balance Due</span>
                <span className="font-mono text-xl font-black tracking-tighter tabular-nums">
                  ₹{balance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="text-[8px] uppercase tracking-[0.2em] font-bold leading-relaxed opacity-30 mb-4">
            * TERMS & CONDITIONS APPLY *<br />
            THANK YOU FOR CHOOSING {businessName}
          </div>
          <div className="text-[7px] opacity-20 font-mono tracking-widest uppercase">
            System generated receipt · {new Date().toISOString()}
          </div>
        </div>
      </div>
    </>
  )
}
