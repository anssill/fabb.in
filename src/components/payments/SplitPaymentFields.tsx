'use client'

import { useId } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PAYMENT_METHODS, paymentError, type PaymentAllocation, type PaymentMethod, type PaymentPart } from '@/lib/payment-splits'

interface Props { total: number; value: PaymentAllocation; onChange: (value: PaymentAllocation) => void; label?: string }
export function SplitPaymentFields({ total, value, onChange, label = 'Payment' }: Props) {
  const id = useId()
  const parts = value.splits
  const error = paymentError(total, value)
  const update = (index: number, changes: Partial<PaymentPart>) => {
    const next = parts!.map((part, i) => i === index ? { ...part, ...changes } : part)
    // For the common cash + UPI case, entering cash fills the remaining UPI amount.
    if (next.length === 2 && index === 0 && changes.amount !== undefined) next[1] = { ...next[1], amount: Math.max(0, Math.round((total - changes.amount) * 100) / 100) }
    onChange({ ...value, splits: next })
  }
  const methodSelect = (method: PaymentMethod, change: (method: PaymentMethod) => void, controlId: string) => (
    <select id={controlId} value={method} onChange={event => change(event.target.value as PaymentMethod)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
      {PAYMENT_METHODS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  )
  return <fieldset className="min-w-0 space-y-3 rounded-lg border p-3">
    <legend className="px-1 text-sm font-medium">{label} method</legend>
    {!parts ? <>
      <Label htmlFor={`${id}-method`}>Method</Label>
      {methodSelect(value.method, method => onChange({ ...value, method }), `${id}-method`)}
      {value.method !== 'cash' && <div className="space-y-1"><Label htmlFor={`${id}-ref`}>Reference / UTR (optional)</Label><Input id={`${id}-ref`} value={value.reference ?? ''} onChange={e => onChange({ ...value, reference: e.target.value })}/></div>}
      <Button type="button" variant="outline" size="sm" disabled={!(total > 0)} onClick={() => onChange({ ...value, splits: [{ method: value.method, amount: 0, reference: value.reference }, { method: value.method === 'upi' ? 'cash' : 'upi', amount: total }] })}>Split payment</Button>
    </> : <>
      <p className="text-xs text-muted-foreground">Split the amount collected across cash, UPI, card or bank transfer.</p>
      {parts.map((part, index) => <div key={index} className="space-y-2 rounded-md bg-muted/40 p-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1"><Label htmlFor={`${id}-method-${index}`}>Method {index + 1}</Label>{methodSelect(part.method, method => update(index, { method }), `${id}-method-${index}`)}</div>
          <div className="space-y-1"><Label htmlFor={`${id}-amount-${index}`}>Amount {index + 1} (₹)</Label><Input id={`${id}-amount-${index}`} type="number" min="0" step="0.01" value={part.amount || ''} onChange={e => update(index, { amount: Number(e.target.value) })}/></div>
        </div>
        {part.method !== 'cash' && <div className="space-y-1"><Label htmlFor={`${id}-ref-${index}`}>Reference {index + 1} (optional)</Label><Input id={`${id}-ref-${index}`} value={part.reference ?? ''} onChange={e => update(index, { reference: e.target.value })}/></div>}
        {parts.length > 2 && <Button type="button" size="sm" variant="ghost" onClick={() => onChange({ ...value, splits: parts.filter((_, i) => i !== index) })}>Remove part {index + 1}</Button>}
      </div>)}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={parts.length >= 8} onClick={() => onChange({ ...value, splits: [...parts, { method: 'upi', amount: Math.max(0, Math.round((total - parts.reduce((sum, p) => sum + p.amount, 0)) * 100) / 100) }] })}>Add method</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ method: parts[0].method, reference: parts[0].reference, splits: undefined })}>Use one method</Button>
      </div>
      <p className="text-xs">Allocated ₹{parts.reduce((sum, part) => sum + part.amount, 0).toLocaleString('en-IN')} / ₹{total.toLocaleString('en-IN')}</p>
    </>}
    {error && total > 0 && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </fieldset>
}
