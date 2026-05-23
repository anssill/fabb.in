import { createClient } from '@/lib/supabase/client'

export class StorageService {
  private static async uploadMedia(bucket: string, path: string, file: File, fallbackMessage: string): Promise<string> {
    const formData = new FormData()
    formData.append('bucket', bucket)
    formData.append('path', path)
    formData.append('file', file)

    const response = await fetch('/api/uploads/media', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(data?.error || fallbackMessage)
    }

    return data.publicUrl
  }

  static async uploadItemImage(businessId: string, file: File): Promise<string> {
    return this.uploadMedia('images', `${businessId}/items`, file, 'Failed to upload image')
  }

  static async uploadCustomerID(businessId: string, file: File): Promise<string> {
    const formData = new FormData()
    formData.append('businessId', businessId)
    formData.append('file', file)

    const response = await fetch('/api/uploads/customer-id', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(data?.error || 'Failed to upload ID proof')
    }

    return data.publicUrl
  }

  static async uploadCompanyLogo(businessId: string, file: File): Promise<string> {
    return this.uploadMedia('images', `${businessId}/logos`, file, 'Failed to upload logo')
  }

  static async uploadStaffPhoto(businessId: string, staffId: string, file: File): Promise<string> {
    return this.uploadMedia('images', `${businessId}/staff/${staffId}`, file, 'Failed to upload photo')
  }

  static async deleteImage(imageUrl: string): Promise<void> {
    if (!imageUrl) return

    const supabase = createClient()
    
    // Extract the path from the URL.
    // Example URL: https://[project].supabase.co/storage/v1/object/public/images/business_id/items/12345_image.jpg
    const bucketName = 'images'
    const urlParts = imageUrl.split(`/storage/v1/object/public/${bucketName}/`)
    
    if (urlParts.length !== 2) {
      console.warn('Could not extract path from storage URL:', imageUrl)
      return // Not a valid supervised storage URL or from another source
    }

    const pathToDelete = urlParts[1]

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([pathToDelete])

    if (error) {
      console.error('Delete Error:', error)
      throw new Error(`Failed to delete image: ${error.message}`)
    }
  }
}
