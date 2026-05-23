'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MediaUpload } from '@/components/shared/MediaUpload'
import { createClient } from '@/lib/supabase/client'
import { Shield, User as UserIcon } from 'lucide-react'
import { toast } from 'sonner'

interface CustomerDocumentSectionProps {
  customerId: string
  businessId: string
  initialIdProofUrl?: string
  initialProfilePhotoUrl?: string
}

export function CustomerDocumentSection({
  customerId,
  businessId,
  initialIdProofUrl,
  initialProfilePhotoUrl
}: CustomerDocumentSectionProps) {
  const [idProofUrl, setIdProofUrl] = useState(initialIdProofUrl)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(initialProfilePhotoUrl)

  const updateCustomer = async (field: string, url: string | null) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('customers')
      .update({ [field]: url })
      .eq('id', customerId)

    if (error) {
      toast.error(`Failed to update customer ${field}`)
      throw error
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            Identity Proof
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MediaUpload
            bucket="documents"
            path={`${businessId}/customers/${customerId}/id_proof`}
            value={idProofUrl}
            onUploadComplete={(url) => {
              setIdProofUrl(url)
              updateCustomer('id_proof_url', url)
            }}
            onRemove={() => {
              setIdProofUrl(undefined)
              updateCustomer('id_proof_url', null)
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-violet-600" />
            Profile Photo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MediaUpload
            bucket="images"
            path={`${businessId}/customers/${customerId}/profile`}
            value={profilePhotoUrl}
            onUploadComplete={(url) => {
              setProfilePhotoUrl(url)
              updateCustomer('profile_photo_url', url)
            }}
            onRemove={() => {
              setProfilePhotoUrl(undefined)
              updateCustomer('profile_photo_url', null)
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
