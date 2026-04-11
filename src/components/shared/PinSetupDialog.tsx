'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Lock, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

interface Props {
  staffId: string
  hasPinSet: boolean
}

export function PinSetupDialog({ staffId, hasPinSet }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast.error('PIN must be exactly 4 digits')
      return
    }
    if (pin !== confirmPin) {
      toast.error('PINs do not match')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const hash = await hashPin(pin)
      const { error } = await supabase
        .from('staff')
        .update({ pin_hash: hash })
        .eq('id', staffId)

      if (error) throw error
      toast.success('PIN set successfully. Screen will lock after 5 minutes of inactivity.')
      setOpen(false)
      setPin('')
      setConfirmPin('')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to set PIN')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm('Remove PIN lock? Your screen will no longer lock automatically.')) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('staff')
        .update({ pin_hash: null })
        .eq('id', staffId)
      if (error) throw error
      toast.success('PIN removed')
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove PIN')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Lock className="w-4 h-4" />
          {hasPinSet ? 'Change PIN' : 'Set Screen PIN'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            {hasPinSet ? 'Change PIN' : 'Set Screen Lock PIN'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-500">
            Your screen will automatically lock after 5 minutes of inactivity. Enter your 4-digit PIN to unlock.
          </p>

          <div className="space-y-1.5">
            <Label>New PIN (4 digits)</Label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              className="text-center text-2xl tracking-widest"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Confirm PIN</Label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              className="text-center text-2xl tracking-widest"
            />
          </div>

          <div className="flex gap-2 pt-1">
            {hasPinSet && (
              <Button variant="outline" className="flex-1 text-red-500 hover:text-red-600" onClick={handleRemove} disabled={saving}>
                Remove PIN
              </Button>
            )}
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={saving || pin.length !== 4 || confirmPin.length !== 4}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save PIN'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
