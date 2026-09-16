'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export function SettleDepositDialog({ bookingId, held }: { bookingId: string; held: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [refund, setRefund] = useState(String(held))
  const [deduction, setDeduction] = useState('0')
  const [method, setMethod] = useState('cash')
  const [note, setNote] = useState('')
  const key = useRef('')
  async function save() {
    const refundAmount = Number(refund), deductionAmount = Number(deduction)
    if (!Number.isFinite(refundAmount) || !Number.isFinite(deductionAmount) || refundAmount < 0 || deductionAmount < 0 || refundAmount + deductionAmount <= 0 || refundAmount + deductionAmount > held) { toast.error('Enter a settlement within the deposit held'); return }
    if (deductionAmount > 0 && !note.trim()) { toast.error('Add a reason for the deduction'); return }
    setSaving(true)
    key.current ||= crypto.randomUUID()
    try {
      const { error } = await (createClient() as any).rpc('settle_booking_deposit', { p_booking_id: bookingId, p_refund: refundAmount, p_deduction: deductionAmount, p_method: method, p_note: note.trim(), p_key: key.current })
      if (error) throw error
      toast.success('Deposit settled'); setOpen(false); key.current = ''; router.refresh()
    } catch (error: any) { toast.error(error.message || 'Could not settle deposit') }
    finally { setSaving(false) }
  }
  return <Dialog open={open} onOpenChange={value => { if (!saving) { setOpen(value); if (value) { setRefund(String(held)); setDeduction('0'); setNote('') } } }}>
    <DialogTrigger asChild><Button variant="outline" className="w-full">Settle deposit</Button></DialogTrigger>
    <DialogContent><DialogHeader><DialogTitle>Settle deposit</DialogTitle><DialogDescription>₹{held.toLocaleString('en-IN')} held. Deposit settlement stays available after the booking closes.</DialogDescription></DialogHeader>
      <label className="space-y-2 text-sm">Refund amount<Input type="number" min="0" max={held} step="0.01" value={refund} onChange={e => setRefund(e.target.value)} /></label>
      <label className="space-y-2 text-sm">Deduction amount<Input type="number" min="0" max={held} step="0.01" value={deduction} onChange={e => setDeduction(e.target.value)} /></label>
      <label className="space-y-2 text-sm">Refund method<select className="block w-full rounded-lg border p-2" value={method} onChange={e => setMethod(e.target.value)}><option value="cash">Cash</option><option value="upi">UPI</option><option value="bank_transfer">Bank transfer</option><option value="card">Card</option></select></label>
      <label className="space-y-2 text-sm">Reason / notes<Input value={note} onChange={e => setNote(e.target.value)} /></label>
      <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save settlement'}</Button>
    </DialogContent>
  </Dialog>
}
