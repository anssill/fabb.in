import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface BookingDetailProps {
  booking: any
}

export function BookingDetail({ booking }: BookingDetailProps) {
  if (!booking) return <div>Loading...</div>

  const isPaid = booking.balance_due <= 0
  const isPartial = booking.advance_paid > 0 && booking.balance_due > 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg shadow-sm border">
        <h2 className="text-3xl font-bold font-mono tracking-wider">{booking.booking_id_display || 'NEW-BOOKING'}</h2>
        <p className="text-muted-foreground mt-2 font-medium">
          {booking.customers?.name} • +91 {booking.customers?.phone}
        </p>
        <div className="mt-4 flex gap-2">
           <Badge className="bg-[#CCFF00] text-black font-semibold text-xs tracking-widest uppercase hover:bg-[#bbe600]">
             {booking.status}
           </Badge>
           <Badge variant={isPaid ? 'default' : isPartial ? 'secondary' : 'destructive'} className={isPaid ? 'bg-black text-white' : ''}>
              {isPaid ? 'Paid' : isPartial ? 'Partial' : 'Unpaid'}
           </Badge>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12 bg-muted/50 rounded-md">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        <div className="p-4 border border-x-border border-b-border border-t-transparent rounded-b-md bg-card shadow-sm mt-0 min-h-[300px]">
          <TabsContent value="details" className="mt-0 space-y-4">
            <h3 className="text-lg font-bold mb-4">Booking Details</h3>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs uppercase font-semibold tracking-wider">Pickup Date</span>
                <p className="font-medium">{booking.pickup_date ? format(new Date(booking.pickup_date), 'dd MMM yyyy') : '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs uppercase font-semibold tracking-wider">Return Date</span>
                <p className="font-medium">{booking.return_date ? format(new Date(booking.return_date), 'dd MMM yyyy') : '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs uppercase font-semibold tracking-wider">Occasion</span>
                <p className="font-medium capitalize">{booking.occasion || '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs uppercase font-semibold tracking-wider">Source</span>
                <p className="font-medium capitalize">{booking.booking_source || '-'}</p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="payments" className="mt-0">
             <h3 className="text-lg font-bold mb-4">Payment Ledger</h3>
             {booking.booking_payments?.length > 0 ? (
               <div className="space-y-3">
                 {booking.booking_payments.map((p: any) => (
                   <div key={p.id} className="flex justify-between items-center p-3 border rounded-md">
                     <div>
                       <p className="font-semibold capitalize">{p.type} <span className="text-muted-foreground text-xs font-normal">({p.method})</span></p>
                       <p className="text-xs text-muted-foreground">{format(new Date(p.timestamp), 'dd MMM, HH:mm')}</p>
                     </div>
                     <div className="font-mono font-bold">₹{p.amount}</div>
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-muted-foreground text-sm">No payment records found.</p>
             )}
          </TabsContent>
          <TabsContent value="items" className="mt-0">
             <h3 className="text-lg font-bold mb-4">Item Inventory</h3>
             {booking.booking_items?.length > 0 ? (
               <div className="space-y-3">
                 {booking.booking_items.map((bi: any) => (
                   <div key={bi.id} className="flex justify-between items-center p-3 border rounded-md">
                     <div>
                       <p className="font-semibold">{bi.item?.name}</p>
                       <p className="text-xs text-muted-foreground">Size: {bi.size || '-'} | Qty: {bi.quantity}</p>
                     </div>
                     <div className="text-right">
                       <p className="font-mono font-bold">₹{bi.subtotal}</p>
                       <p className="text-xs text-muted-foreground">₹{bi.price}/day</p>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-muted-foreground text-sm">No items found.</p>
             )}
          </TabsContent>
          <TabsContent value="notes" className="mt-0">
             <h3 className="text-lg font-bold mb-4">Internal Notes</h3>
             <p className="text-muted-foreground text-sm">Any staff can add. Visible only to Manager +.</p>
          </TabsContent>
          <TabsContent value="timeline" className="mt-0">
             <h3 className="text-lg font-bold mb-4">Chronology</h3>
             {booking.booking_timeline?.length > 0 ? (
               <div className="space-y-4">
                 {booking.booking_timeline.map((event: any) => (
                   <div key={event.id} className="flex gap-4">
                     <div className="flex flex-col items-center">
                       <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                       <div className="flex-1 w-px bg-border my-1" />
                     </div>
                     <div>
                       <p className="text-sm font-semibold">{event.event_type}</p>
                       <p className="text-xs text-muted-foreground">{format(new Date(event.timestamp), 'dd MMM, HH:mm')} • {event.staff_name || 'System'}</p>
                       {event.description && <p className="text-sm mt-1">{event.description}</p>}
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-muted-foreground text-sm">No timeline events found.</p>
             )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
