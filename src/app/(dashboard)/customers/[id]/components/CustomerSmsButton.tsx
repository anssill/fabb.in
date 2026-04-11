'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import { SendSmsDialog } from '@/components/sms/SendSmsDialog'

interface CustomerSmsButtonProps {
  phone: string
  customerName: string
  customerId: string
  className?: string
}

export function CustomerSmsButton({
  phone,
  customerName,
  customerId,
  className = ''
}: CustomerSmsButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button 
        variant="outline" 
        className={`w-full ${className}`} 
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        Send SMS
      </Button>

      <SendSmsDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        phone={phone}
        customerName={customerName}
        customerId={customerId}
      />
    </>
  )
}
