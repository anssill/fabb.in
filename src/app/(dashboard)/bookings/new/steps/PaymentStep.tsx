'use client'

import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreditCard } from 'lucide-react'
import type { BookingPayment } from '../page'

interface Props {
  payment: BookingPayment
  setPayment: (p: BookingPayment) => void
  totalAmount: number
}

export function PaymentStep({ payment, setPayment, totalAmount }: Props) {
  const balanceDue = totalAmount - payment.advance_amount - (payment.deposit_amount ?? 0)
  const minAdvance = Math.round(totalAmount * 0.3)

  const presets = [
    { label: '30%', value: Math.round(totalAmount * 0.3) },
    { label: '50%', value: Math.round(totalAmount * 0.5) },
    { label: 'Full', value: totalAmount },
  ]

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Payment
        </CardTitle>
        <CardDescription>Record the advance payment for this booking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total due */}
        <div className="p-4 bg-muted/50 border border-border rounded-lg flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Amount</span>
          <span className="text-lg font-semibold text-foreground">₹{totalAmount.toLocaleString('en-IN')}</span>
        </div>

        {/* Advance amount */}
        <div className="space-y-2">
          <Label>Advance amount *</Label>
          <Input
            type="number"
            value={payment.advance_amount || ''}
            onChange={(e) => setPayment({ ...payment, advance_amount: Math.min(Number(e.target.value), totalAmount) })}
            placeholder={`Min ₹${minAdvance}`}
            min={0}
            max={totalAmount}
          />
          <div className="flex gap-2">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setPayment({ ...payment, advance_amount: preset.value })}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  payment.advance_amount === preset.value
                    ? 'bg-primary text-primary-foreground border-primary font-medium'
                    : 'border-input text-muted-foreground hover:bg-muted'
                }`}
              >
                {preset.label} (₹{preset.value.toLocaleString('en-IN')})
              </button>
            ))}
          </div>
        </div>

        {/* Payment method */}
        <div className="space-y-2">
          <Label>Payment method</Label>
          <Select
            value={payment.method}
            onValueChange={(v) => setPayment({ ...payment, method: v as BookingPayment['method'] })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">💵 Cash</SelectItem>
              <SelectItem value="upi">📱 UPI</SelectItem>
              <SelectItem value="card">💳 Card</SelectItem>
              <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reference */}
        {payment.method !== 'cash' && (
          <div className="space-y-2">
            <Label>Transaction reference <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              value={payment.reference || ''}
              onChange={(e) => setPayment({ ...payment, reference: e.target.value })}
              placeholder="UPI ref / transaction ID"
            />
          </div>
        )}

        {/* Security deposit */}
        <div className="space-y-2">
          <Label>Security deposit <span className="text-muted-foreground">(optional)</span></Label>
          <Input
            type="number"
            value={payment.deposit_amount || ''}
            onChange={(e) => setPayment({ ...payment, deposit_amount: Number(e.target.value) })}
            placeholder="0"
            min={0}
          />
          <p className="text-xs text-muted-foreground">Refundable deposit collected at pickup</p>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Notes <span className="text-muted-foreground">(optional)</span></Label>
          <Input
            value={payment.notes || ''}
            onChange={(e) => setPayment({ ...payment, notes: e.target.value })}
            placeholder="Any payment notes"
          />
        </div>

        {/* Summary */}
        <div className="p-4 bg-muted/50 border border-border rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Advance</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹{payment.advance_amount.toLocaleString('en-IN')}</span>
          </div>
          {(payment.deposit_amount ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Security Deposit</span>
              <span className="font-semibold text-primary">₹{(payment.deposit_amount ?? 0).toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Balance due</span>
            <span className={`font-bold ${balanceDue > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              ₹{Math.max(0, balanceDue).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </CardContent>
    </>
  )
}
