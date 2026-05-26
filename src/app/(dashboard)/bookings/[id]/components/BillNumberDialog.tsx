'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FileText, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { safeJsonParse } from '@/lib/api-utils'

interface BillNumberDialogProps {
  bookingId: string
  billNumber?: string | null
  triggerClassName?: string
}

export function BillNumberDialog({ bookingId, billNumber, triggerClassName }: BillNumberDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [value, setValue] = useState(billNumber || '')

  const saveBillNumber = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/operations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billNumber: value }),
      })
      const data = await safeJsonParse(res)
      if (!res.ok) throw new Error(data.error || 'Failed to update bill number')

      toast.success(value.trim() ? 'Bill number saved' : 'Bill number removed')
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update bill number')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant={billNumber ? 'outline' : 'default'} size="sm" className={triggerClassName}>
          <FileText className="mr-1.5 h-4 w-4" />
          {billNumber ? 'Edit Bill No.' : 'Add Bill No.'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{billNumber ? 'Edit bill number' : 'Add bill number'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Physical bill number</Label>
            <Input
              value={value}
              onChange={(event) => setValue(event.target.value.toUpperCase().slice(0, 40))}
              placeholder="Example: BILL-1024"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Use this when the physical bill was missed during booking creation.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={saveBillNumber} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
