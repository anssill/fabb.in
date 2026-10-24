'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import type { BookingDates } from '../page'

export function BookingPreparation({ dates, setDates, requestId, onUploadingChange }: {
  dates: BookingDates; setDates: Dispatch<SetStateAction<BookingDates>>; requestId: string; onUploadingChange: (value: boolean) => void
}) {
  const { staff, activeBranch } = useAppStore()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const photos = dates.condition_photos ?? []
  async function upload(file: File) {
    setError('')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose a JPG, PNG or WebP photo up to 5 MB.'); return
    }
    if (!staff?.business_id || !activeBranch || photos.length >= 10) return
    setUploading(true); onUploadingChange(true)
    try {
      const path = `${staff.business_id}/condition/${activeBranch.id}/${requestId}/${crypto.randomUUID()}.${file.type.split('/')[1]}`
      const { error } = await createClient().storage.from('rental-evidence').upload(path, file)
      if (error) throw error
      const url = `/api/rental-evidence?path=${encodeURIComponent(path)}`
      setDates(current => ({ ...current, condition_photos: [...(current.condition_photos ?? []), url] }))
    } catch { setError('Photo upload failed. Please try again before continuing.') }
    finally { setUploading(false); onUploadingChange(false) }
  }
  return <section className="space-y-4 border-t p-6" aria-label="Optional booking preparation">
    <h3 className="font-semibold">Customer alterations & item condition (optional)</h3>
    <div className="space-y-2"><Label htmlFor="alteration-notes">Customer alteration requirements</Label>
      <Textarea id="alteration-notes" maxLength={4000} value={dates.alteration_notes ?? ''} onChange={event => setDates(current => ({ ...current, alteration_notes: event.target.value }))} placeholder="Item code, measurements, sleeve/length changes, fitting instructions…" /></div>
    <div className="space-y-2"><Label htmlFor="condition-notes">Item condition check</Label>
      <Textarea id="condition-notes" maxLength={4000} value={dates.condition_notes ?? ''} onChange={event => setDates(current => ({ ...current, condition_notes: event.target.value }))} placeholder="Item code and condition: marks, stitching, accessories, existing damage…" /></div>
    <div className="space-y-2"><Label htmlFor="condition-photo">Condition photos (optional)</Label>
      <Input id="condition-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading || photos.length >= 10} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void upload(file) }} />
      <p className="text-xs text-muted-foreground">Up to 10 photos, 5 MB each. Leave this section blank if no check is needed.</p></div>
    {uploading && <p role="status">Uploading photo…</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="grid grid-cols-2 gap-3">{photos.map((url, index) => <div key={url} className="space-y-2 rounded-lg border p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={`Item condition ${index + 1}`} className="h-32 w-full object-contain" />
      <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => setDates(current => ({ ...current, condition_photos: current.condition_photos?.filter(photo => photo !== url) }))}>Remove photo {index + 1}</Button>
    </div>)}</div>
  </section>
}
