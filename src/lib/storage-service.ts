import { createClient } from '@/lib/supabase/client'

export class StorageService {
  static async uploadItemImage(businessId: string, file: File): Promise<string> {
    const supabase = createClient()
    
    // Generate a unique file path: images/{business_id}/items/{timestamp}_{filename}
    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.\-]/g, '_')}`
    const filePath = `${businessId}/items/${fileName}`

    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Upload Error:', error)
      throw new Error(`Failed to upload image: ${error.message}`)
    }


    return `/api/images?path=${encodeURIComponent(data.path)}`
  }

  static async uploadCustomerID(businessId: string, file: File): Promise<string> {
    const client = createClient()
    const path = businessId + '/customers/' + crypto.randomUUID() + '.jpg'
    const { error } = await client.storage.from('customer-private').upload(path, file)
    if (error) throw new Error(error.message)
    return '/api/customer-document?path=' + encodeURIComponent(path)
  }

  static async uploadCompanyLogo(businessId: string, file: File): Promise<string> {
    const supabase = createClient()
    
    // Generate a unique file path: images/{business_id}/logos/{timestamp}_{filename}
    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.\-]/g, '_')}`
    const filePath = `${businessId}/logos/${fileName}`

    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Logo Upload Error:', error)
      throw new Error(`Failed to upload logo: ${error.message}`)
    }


    return `/api/images?path=${encodeURIComponent(data.path)}`
  }

  static async deleteImage(imageUrl: string): Promise<void> {
    if (!imageUrl) return

    const supabase = createClient()
    
    // Extract the path from the URL.
    // Example URL: https://[project].supabase.co/storage/v1/object/public/images/business_id/items/12345_image.jpg
    const bucketName = 'images'
    const urlParts = imageUrl.split(`/storage/v1/object/public/${bucketName}/`)
    
    if (urlParts.length !== 2 && !imageUrl.startsWith('/api/images?')) {
      console.warn('Could not extract path from storage URL:', imageUrl)
      return // Not a valid supervised storage URL or from another source
    }

    const pathToDelete = imageUrl.startsWith('/api/images?') ? new URL(imageUrl, 'http://local').searchParams.get('path')! : urlParts[1]

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([pathToDelete])

    if (error) {
      console.error('Delete Error:', error)
      throw new Error(`Failed to delete image: ${error.message}`)
    }
  }
}
