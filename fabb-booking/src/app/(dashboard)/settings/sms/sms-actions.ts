'use server'

import { sendSMS } from '@/lib/sms/msg91'

export async function testSMSConnection(phone: string) {
  if (!phone) return { success: false, error: 'Phone number is required' }

  const result = await sendSMS({
    phone,
    message: 'Test message from Fabb.booking. Your MSG91 configuration is working correctly!'
  })

  return result
}
