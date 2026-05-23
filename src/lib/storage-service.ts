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

    // Get the public URL for the uploaded image
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(data.path)

    return publicUrlData.publicUrl
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

    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(data.path)

    return publicUrlData.publicUrl
  }

  static async uploadStaffPhoto(businessId: string, staffId: string, file: File): Promise<string> {
    const supabase = createClient()

    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.\-]/g, '_')}`
    const filePath = `${businessId}/staff/${staffId}/${fileName}`

    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Staff photo upload error:', error)
      throw new Error(`Failed to upload photo: ${error.message}`)
    }

    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(data.path)

    return publicUrlData.publicUrl
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
