import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

interface BookingCardProps {
  booking: any // Using any for now since exact types aren't generated
  onClick?: () => void
}

export function BookingCard({ booking, onClick }: BookingCardProps) {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'confirmed': return 'bg-[#22c55e]'
      case 'active': return 'bg-[#3b82f6]'
      case 'overdue': return 'bg-[#ef4444]'
      case 'returned': return 'bg-[#6b7280]'
      case 'draft': return 'bg-[#CCFF00] text-black'
      default: return 'bg-gray-200 text-black'
    }
  }

  const itemsArr = booking.booking_items?.map((bi: any) => `${bi.item?.name} (${bi.size || '-'}×${bi.quantity})`) || []
  const itemsString = itemsArr.length > 0 ? itemsArr.join(', ') : 'No items'

  // calculate payment status naively
  const isPaid = booking.balance_due <= 0
  const isPartial = booking.advance_paid > 0 && booking.balance_due > 0

  return (
    <Card className={`cursor-pointer transition-colors hover:bg-muted ${booking.status === 'overdue' ? 'border-l-4 border-l-[#ef4444]' : ''}`} onClick={onClick}>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <Badge className={`${getStatusColor(booking.status)} uppercase font-bold tracking-wider text-[10px]`}>
            {booking.status}
          </Badge>
          <span className="text-xs font-mono text-muted-foreground">{booking.booking_id_display}</span>
        </div>
        
        <div>
          <p className="font-semibold">{booking.customers?.name}</p>
          <p className="text-sm text-muted-foreground">{booking.customers?.phone}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground line-clamp-1">Items: {itemsString}</p>
        </div>

        <div className="flex justify-between items-end">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Pick:</span> {booking.pickup_date ? format(new Date(booking.pickup_date), 'dd MMM yyyy') : '-'} <br />
            <span className="font-medium text-foreground">Ret:</span> {booking.return_date ? format(new Date(booking.return_date), 'dd MMM yyyy') : '-'}
          </div>
          <div>
            <Badge variant={isPaid ? 'default' : isPartial ? 'secondary' : 'destructive'} className={isPaid ? 'bg-black text-white' : ''}>
              {isPaid ? 'Paid' : isPartial ? 'Partial' : 'Unpaid'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
