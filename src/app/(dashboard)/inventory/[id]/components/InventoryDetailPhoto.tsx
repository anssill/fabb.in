'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Edit, Loader2, Package } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ImageUpload } from '../../components/ImageUpload'
import { StorageService } from '@/lib/storage-service'
import { updateItemPhoto } from '../../inventory-actions'

export function InventoryDetailPhoto({ itemId, businessId, itemName, imageUrl }: { itemId: string; businessId: string; itemName: string; imageUrl: string | null }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(imageUrl)

  const save = async () => {
    if (!file) { toast.error('Choose a photo and apply the crop first'); return }
    setSaving(true)
    try {
      const url = await StorageService.uploadItemImage(businessId, file)
      const result = await updateItemPhoto(itemId, url)
      if ('error' in result) throw new Error(typeof result.error === 'string' ? result.error : 'Could not update photo')
      setEditing(false)
      setFile(null)
      toast.success('Inventory photo updated')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update photo')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3 p-3">
        {editing ? (
          <>
            <ImageUpload value={preview} onChange={(nextFile: File | null, nextPreview?: string | null) => { setFile(nextFile); setPreview(nextPreview || null) }} disabled={saving} editable />
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => { setEditing(false); setFile(null); setPreview(imageUrl) }}>Cancel</Button>
              <Button type="button" size="sm" disabled={saving || !file} onClick={save}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save photo</Button>
            </div>
          </>
        ) : (
          <>
            <div className="relative aspect-[16/8] overflow-hidden rounded-md bg-muted">{imageUrl ? <Image unoptimized src={imageUrl} alt={itemName} fill priority sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover" /> : <div className="grid h-full place-items-center"><Package className="h-16 w-16 text-muted-foreground/30" /></div>}</div>
            <div className="flex justify-end"><Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}><Edit className="mr-2 h-4 w-4" />Edit photo</Button></div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
