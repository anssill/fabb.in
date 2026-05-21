import { supabaseAdmin } from '@/lib/supabase/admin'
import { safeJsonParse } from '../api-utils'

interface SendSMSOptions {
  phone: string
  message?: string
  templateId?: string
  placeholders?: Record<string, string>
  bookingId?: string
  customerId?: string
  authKey?: string
  senderId?: string
  /** Optional: pass business_id so logging works even without an active user session (e.g. OTP login) */
  businessId?: string
  /** Optional: pass branch_id for logging */
  branchId?: string
  /** Optional: pass the staff_id who triggered the send */
  sentBy?: string
}

export async function sendSMS({
  phone,
  message,
  templateId,
  placeholders,
  bookingId,
  customerId,
  authKey: providedAuthKey,
  senderId: providedSenderId,
  businessId,
  branchId,
  sentBy,
}: SendSMSOptions) {
  const authKey = providedAuthKey || process.env.MSG91_AUTH_KEY
  const senderId = providedSenderId || process.env.MSG91_SENDER_ID || 'BRFABB'

  if (!authKey) {
    console.warn('MSG91_AUTH_KEY is not set. Skipping SMS.')
    return { success: false, error: 'Auth key missing' }
  }

  // Clean phone number: remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '')
  // Ensure it has country code (defaulting to 91 for India if only 10 digits)
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone

  let result: any = {}
  let isSuccess = false

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

    result = await safeJsonParse(response)
    isSuccess = response.ok && (result.type === 'success' || result.status === 'success')

  } catch (error) {
    console.error('Error sending SMS via MSG91:', error)
    return { success: false, error }
  }

  // Log to sms_log using admin client (works even without an active user session)
  // This is a best-effort log — we never fail the SMS send because of a logging error.
  try {
    // If businessId wasn't passed in, try to resolve it from the sentBy staff record
    let resolvedBusinessId = businessId
    let resolvedBranchId = branchId

    if (!resolvedBusinessId && sentBy) {
      const { data: staff } = await supabaseAdmin
        .from('staff')
        .select('business_id, branch_id')
        .eq('id', sentBy)
        .single()
      resolvedBusinessId = staff?.business_id
      resolvedBranchId = resolvedBranchId ?? staff?.branch_id
    }

    if (resolvedBusinessId) {
      await supabaseAdmin.from('sms_log').insert({
        business_id: resolvedBusinessId,
        branch_id: resolvedBranchId ?? null,
        customer_id: customerId ?? null,
        booking_id: bookingId ?? null,
        phone: formattedPhone,
        message: message || `Template: ${templateId}`,
        template_id: templateId ?? null,
        status: isSuccess ? 'sent' : 'failed',
        provider_response: result,
        sent_by: sentBy ?? null,
      })
    }
  } catch (logError) {
    // Never let logging failures affect the return value
    console.warn('SMS log insert failed (non-fatal):', logError)
  }

  return { success: isSuccess, data: result }
}
