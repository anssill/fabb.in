import { Client } from '@notionhq/client'

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

const DATABASE_ID = process.env.NOTION_DATABASE_ID

export type NotionBookingData = {
  bookingNumber: string
  customerName: string
  status: string
  pickupDate: string
  returnDate: string
  totalAmount: number
  balanceDue: number
  advancePaid: number
  depositAmount: number
  summary: string
}

export class NotionService {
  /**
   * Syncs a booking to the master Notion database
   */
  static async syncBooking(data: NotionBookingData, existingPageId?: string) {
    if (!process.env.NOTION_API_KEY || !DATABASE_ID) {
      console.warn('Notion API key or Database ID not configured. Skipping sync.')
      return null
    }

    try {
      const properties: any = {
        'Booking Number': {
          title: [
            {
              text: {
                content: data.bookingNumber,
              },
            },
          ],
        },
        'Customer Name': {
          rich_text: [
            {
              text: {
                content: data.customerName,
              },
            },
          ],
        },
        'Status': {
          select: {
            name: this.mapStatus(data.status),
          },
        },
        'Pickup Date': {
          date: {
            start: data.pickupDate,
          },
        },
        'Return Date': {
          date: {
            start: data.returnDate,
          },
        },
        'Total Amount': {
          number: data.totalAmount,
        },
        'Balance Due': {
          number: data.balanceDue,
        },
        'Advance Paid': {
          number: data.advancePaid,
        },
        'Deposit Amount': {
          number: data.depositAmount,
        },
        'Booking Summary': {
          rich_text: [
            {
              text: {
                content: data.summary,
              },
            },
          ],
        },
      }

      if (existingPageId) {
        const response = await notion.pages.update({
          page_id: existingPageId,
          properties,
        })
        return response.id
      } else {
        const response = await notion.pages.create({
          parent: { database_id: DATABASE_ID },
          properties,
        })
        return response.id
      }
    } catch (error) {
      console.error('Error syncing to Notion:', error)
      throw error
    }
  }

  private static mapStatus(status: string): string {
    // Ensure status matches Notion select options exactly
    const statusMap: Record<string, string> = {
      'pending': 'Pending',
      'booked': 'Booked',
      'out': 'Out',
      'returned': 'Returned',
      'closed': 'Closed',
      'cancelled': 'Cancelled',
    }
    return statusMap[status.toLowerCase()] || 'Pending'
  }
}
