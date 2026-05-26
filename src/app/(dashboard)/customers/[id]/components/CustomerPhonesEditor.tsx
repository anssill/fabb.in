'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { Edit, Loader2, Phone, Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface CustomerPhonesEditorProps {
  customerId: string
  initialPhone: string
  initialAlternatePhone?: string | null
  initialEmergencyPhone?: string | null
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, '').slice(0, 10)
}

export function CustomerPhonesEditor({
  customerId,
  initialPhone,
  initialAlternatePhone,
  initialEmergencyPhone,
}: CustomerPhonesEditorProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [phone, setPhone] = useState(initialPhone || '')
  const [alternatePhone, setAlternatePhone] = useState(initialAlternatePhone || '')
  const [emergencyPhone, setEmergencyPhone] = useState(initialEmergencyPhone || '')

  const reset = () => {
    setPhone(initialPhone || '')
    setAlternatePhone(initialAlternatePhone || '')
    setEmergencyPhone(initialEmergencyPhone || '')
    setEditing(false)
  }

  const save = async () => {
    if (normalizePhone(phone).length < 10) {
      toast.error('Primary phone number is required')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('customers')
        .update({
          phone: normalizePhone(phone),
          alternate_phone: normalizePhone(alternatePhone) || null,
          emergency_phone: normalizePhone(emergencyPhone) || null,
        })
        .eq('id', customerId)

      if (error) throw error

      toast.success('Customer phone numbers updated')
      setEditing(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update phone numbers')
    } finally {
      setSaving(false)
    }
  }

  const rows = [
    { label: 'Primary', value: initialPhone },
    { label: 'Alternate', value: initialAlternatePhone },
    { label: 'Emergency', value: initialEmergencyPhone },
  ]

  if (!editing) {
    return (
      <div className="rounded-lg border border-border bg-background p-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Phone numbers</p>
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Edit className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-2">
              <span className="text-xs font-medium text-muted-foreground">{row.label}</span>
              {row.value ? (
                <a
                  href={`tel:${row.value}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {row.value}
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">Not added</span>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Edit phone numbers</p>
        <Button type="button" variant="ghost" size="sm" onClick={reset} disabled={saving}>
          <X className="mr-1 h-3.5 w-3.5" />
          Cancel
        </Button>
      </div>
      <div className="grid gap-3">
        <div className="space-y-1.5">
          <Label>Primary phone *</Label>
          <Input value={phone} onChange={(event) => setPhone(normalizePhone(event.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label>Alternate phone</Label>
          <Input value={alternatePhone} onChange={(event) => setAlternatePhone(normalizePhone(event.target.value))} placeholder="Optional" />
        </div>
        <div className="space-y-1.5">
          <Label>Emergency phone</Label>
          <Input value={emergencyPhone} onChange={(event) => setEmergencyPhone(normalizePhone(event.target.value))} placeholder="Optional" />
        </div>
      </div>
      <Button type="button" className="mt-3 w-full" onClick={save} disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save phones
      </Button>
    </div>
  )
}
