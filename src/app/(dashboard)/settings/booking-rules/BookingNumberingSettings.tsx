'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import { hasPermission } from '@/lib/permissions'
import { MAX_BOOKING_COUNTER, normalizeBookingNumber, type BookingNumberSettings } from '@/lib/booking-number'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function BookingNumberingSettings({ branchId, branchPrefix }: { branchId: string; branchPrefix: string }) {
  const [db] = useState(createClient)
  const staff = useAppStore(state => state.staff)
  const canManage = !!staff && hasPermission(staff.role, staff.permissions, 'manage_settings')
  const [prefix, setPrefix] = useState(branchPrefix || 'FAB')
  const [nextNumber, setNextNumber] = useState('1001')
  const [saved, setSaved] = useState<BookingNumberSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let cancelled = false
    db.from('booking_number_settings').select('*').eq('branch_id', branchId).maybeSingle().then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        setError('Could not load booking numbering. Please reload before saving.')
      } else {
        const settings = data as BookingNumberSettings | null
        setSaved(settings)
        setPrefix(settings?.prefix ?? (branchPrefix || 'FAB'))
        setNextNumber(String(settings?.next_number ?? 1001))
        setError('')
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [db, branchId, branchPrefix, reload])

  const normalized = normalizeBookingNumber(prefix)
  const counter = Number(nextNumber)
  const valid = /^[A-Z0-9/_-]{1,20}$/.test(normalized) && Number.isSafeInteger(counter) && counter >= 1 && counter <= MAX_BOOKING_COUNTER && counter >= (saved?.next_number ?? 1)

  async function save() {
    if (!valid || !canManage) return
    setSaving(true)
    setError('')
    try {
      const { data, error } = await db.rpc('save_booking_number_settings', {
        p_branch_id: branchId, p_prefix: normalized, p_next_number: counter,
      })
      if (error) throw error
      const settings = data as BookingNumberSettings
      setSaved(settings)
      setPrefix(settings.prefix)
      setNextNumber(String(settings.next_number))
      toast.success('Booking numbering saved')
    } catch (error) {
      setError(error instanceof Error ? error.message : (error as { message?: string }).message || 'Could not save booking numbering')
    } finally {
      setSaving(false)
    }
  }

  return <Card>
    <CardHeader>
      <CardTitle className="text-base">Booking Numbering</CardTitle>
      <CardDescription>Set automatic numbers for new bookings at this branch. Existing booking numbers stay unchanged.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {loading ? <p className="text-sm text-muted-foreground">Loading numbering…</p> : <>
        <p className="text-sm text-muted-foreground">{saved ? 'Sequential numbering is enabled.' : 'Current date-based numbering stays active until you save here.'}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="booking-number-prefix">Prefix</Label>
            <Input id="booking-number-prefix" value={prefix} maxLength={20} disabled={!canManage || saving} onChange={event => setPrefix(event.target.value.toUpperCase())} placeholder="FABB" />
            <p className="text-xs text-muted-foreground">1–20 letters, numbers, hyphens, underscores or slashes.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="booking-next-number">Next number</Label>
            <Input id="booking-next-number" type="number" min={saved?.next_number ?? 1} max={MAX_BOOKING_COUNTER} step={1} value={nextNumber} disabled={!canManage || saving} onChange={event => setNextNumber(event.target.value)} />
            <p className="text-xs text-muted-foreground">Move forward only. Changing the prefix does not reset the counter.</p>
          </div>
        </div>
        <p className="rounded-lg bg-muted p-3 text-sm">Preview: <strong className="break-all">{valid ? normalized + '-' + counter : 'Enter a valid prefix and next number'}</strong></p>
        <p className="text-xs text-muted-foreground">Numbers already used are skipped. A custom number can also be entered when creating a booking.</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={save} disabled={!valid || !canManage || saving || !!error}>{saving ? 'Saving…' : 'Save numbering'}</Button>
          <Button type="button" variant="outline" disabled={saving} onClick={() => { setLoading(true); setReload(value => value + 1) }}>Reload latest counter</Button>
        </div>
      </>}
    </CardContent>
  </Card>
}
