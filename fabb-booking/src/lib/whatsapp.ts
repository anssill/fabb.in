export type WhatsAppTemplateData = {
  phoneNumber: string
  templateName: string
  languageCode?: string
  variables: string[]
}

export class WhatsAppService {
  private static API_URL = 'https://api.interakt.ai/v1/public/message/'

  /**
   * Sends a template-based WhatsApp message via Interakt
   */
  static async sendTemplate(data: WhatsAppTemplateData) {
    const apiKey = process.env.INTERAKT_API_KEY
    if (!apiKey) {
      console.warn('INTERAKT_API_KEY not configured. Skipping WhatsApp message.')
      return null
    }

    // Clean phone number: remove any non-digits, ensure it starts with country code (defaults to 91 for India)
    let cleanPhone = data.phoneNumber.replace(/\D/g, '')
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone
    }

    try {
      const payload = {
        fullPhoneNumber: cleanPhone,
        type: 'Template',
        template: {
          name: data.templateName,
          languageCode: data.languageCode || 'en',
          bodyValues: data.variables,
        },
      }

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${apiKey}`,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send WhatsApp message')
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
    // Example: "Hi [1], your booking [2] is confirmed for [3]. Thank you!"
    return [customerName, bookingNumber, new Date(pickupDate).toLocaleDateString('en-IN')]
  }
}
