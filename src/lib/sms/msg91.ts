import { createClient } from '@/lib/supabase/server'
import { safeJsonParse } from '../api-utils'

interface SendSMSOptions {
  phone: string
  message?: string
  templateId?: string
  placeholders?: Record<string, string>
  bookingId?: string
  customerId?: string
}

export async function sendSMS({
  phone,
  message,
  templateId,
  placeholders,
  bookingId,
  customerId
}: SendSMSOptions) {
  const authKey = process.env.MSG91_AUTH_KEY
  const senderId = process.env.MSG91_SENDER_ID || 'BRFABB'

  if (!authKey) {
    console.warn('MSG91_AUTH_KEY is not set. Skipping SMS.')
    return { success: false, error: 'Auth key missing' }
  }

  // Clean phone number: remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '')
  // Ensure it has country code (defaulting to 91 for India if only 10 digits)
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone

  const supabase = await createClient()

  try {
    // Determine if we use a template (preferred) or direct message
    const body = templateId 
      ? {
          template_id: templateId,
          short_url: '1', // auto shorten URLs
          realTimeResponse: '1',
          recipients: [
            {
              mobiles: formattedPhone,
              ...placeholders
            }
          ]
        }
      : {
          sender: senderId,
          route: '4', // Transactional
          country: '91',
          sms: [
            {
              message: message || '',
              to: [formattedPhone]
            }
          ]
        }

    const endpoint = templateId 
      ? 'https://api.msg91.com/api/v5/flow/'
      : 'https://api.msg91.com/api/v2/sendsms'

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': authKey
      },
      body: JSON.stringify(body)
    })

    const result = await safeJsonParse(response)
    const isSuccess = response.ok && (result.type === 'success' || result.status === 'success')

    // Log to sms_log
    const { data: { user } } = await supabase.auth.getUser()
    
    // Get business_id and branch_id for logging
    const { data: staff } = await supabase
      .from('staff')
      .select('business_id, branch_id')
      .eq('id', user?.id)
      .single()

    await supabase.from('sms_log').insert({
      business_id: staff?.business_id,
      branch_id: staff?.branch_id,
      customer_id: customerId,
      booking_id: bookingId,
      phone: formattedPhone,
      message: message || `Template: ${templateId}`,
      template_id: templateId,
      status: isSuccess ? 'sent' : 'failed',
      provider_response: result,
      sent_by: user?.id
    })

    return { success: isSuccess, data: result }
  } catch (error) {
    console.error('Error sending SMS via MSG91:', error)
    return { success: false, error }
  }
}
