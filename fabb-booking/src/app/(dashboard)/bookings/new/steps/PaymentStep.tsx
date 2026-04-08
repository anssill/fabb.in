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
  const balanceDue = totalAmount - payment.advance_amount
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
          <CreditCard className="w-5 h-5 text-blue-600" />
          Payment
        </CardTitle>
        <CardDescription>Record the advance payment for this booking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total due */}
        <div className="p-4 bg-slate-50 rounded-lg flex justify-between items-center">
          <span className="text-sm text-slate-600">Total Amount</span>
          <span className="text-lg font-semibold text-slate-900">₹{totalAmount.toLocaleString('en-IN')}</span>
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
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
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
            <Label>Transaction reference <span className="text-slate-400">(optional)</span></Label>
            <Input
              value={payment.reference || ''}
              onChange={(e) => setPayment({ ...payment, reference: e.target.value })}
              placeholder="UPI ref / transaction ID"
            />
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <Label>Notes <span className="text-slate-400">(optional)</span></Label>
          <Input
            value={payment.notes || ''}
            onChange={(e) => setPayment({ ...payment, notes: e.target.value })}
            placeholder="Any payment notes"
          />
        </div>

        {/* Summary */}
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Advance</span>
            <span className="font-medium text-green-700">₹{payment.advance_amount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Balance due</span>
            <span className={`font-semibold ${balanceDue > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              ₹{balanceDue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </CardContent>
    </>
  )
}
