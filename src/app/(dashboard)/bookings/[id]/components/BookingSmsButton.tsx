'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import { SendSmsDialog } from '@/components/sms/SendSmsDialog'

interface BookingSmsButtonProps {
  phone: string
  customerName: string
  bookingNumber: string
  bookingId: string
  customerId: string
  pickupDate: string
  returnDate: string
  variant?: 'outline' | 'default' | 'ghost' | 'sm'
  className?: string
  showLabel?: boolean
}

export function BookingSmsButton({
  phone,
  customerName,
  bookingNumber,
  bookingId,
  customerId,
  pickupDate,
  returnDate,
  variant = 'outline',
  className = '',
  showLabel = true
}: BookingSmsButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const variables = {
    '{pickup_date}': new Date(pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    '{return_date}': new Date(returnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    '{time}': '11:00 AM', // Default pickup time or fetch from settings
  }

  return (
    <>
      <Button 
        variant={variant as any} 
        size="sm" 
        className={className}
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="w-4 h-4 mr-1.5" />
        {showLabel && 'SMS'}
      </Button>

      <SendSmsDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        phone={phone}
        customerName={customerName}
        bookingNumber={bookingNumber}
        bookingId={bookingId}
        customerId={customerId}
        variables={variables}
        defaultTemplate="booking_confirmed"
      />
    </>
  )
}
