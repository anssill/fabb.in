import { safeJsonParse } from './api-utils'

export type WhatsAppTemplateData = {
  phoneNumber: string
  templateName: string
  languageCode?: string
  variables: string[]
}

export class WhatsAppService {
  /**
   * Sends a template-based WhatsApp message via the official Meta WhatsApp Cloud API
   */
  static async sendTemplate(data: WhatsAppTemplateData, overrideToken?: string) {
    const token = overrideToken || process.env.WHATSAPP_ACCESS_TOKEN
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!token || !phoneId) {
      console.warn('WhatsApp API token or Phone Number ID not configured. Skipping message.')
      return null
    }

    // Clean phone number: remove any non-digits, ensure it starts with country code (defaults to 91 for India)
    let cleanPhone = data.phoneNumber.replace(/\D/g, '')
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone
    }

    try {
      // Format variables for Meta API
      const parameters = data.variables.map(val => ({
        type: 'text',
        text: String(val)
      }))

      const payload = {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'template',
        template: {
          name: data.templateName,
          language: {
            code: data.languageCode || 'en',
          },
          ...((parameters.length > 0) && {
            components: [
              {
                type: 'body',
                parameters: parameters,
              },
            ],
          }),
        },
      }

      const response = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const result = await safeJsonParse(response)

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to send WhatsApp message via Meta API')
      }

      return result
    } catch (error) {
      console.error('WhatsApp Service Error:', error)
      throw error
    }
  }

  /**
   * Helper to format variables for common templates
   */
  static formatConfirmationVars(customerName: string, bookingNumber: string, pickupDate: string) {
    // Example: "Hi {{1}}, your booking {{2}} is confirmed for {{3}}. Thank you!"
    return [customerName, bookingNumber, new Date(pickupDate).toLocaleDateString('en-IN')]
  }
}
