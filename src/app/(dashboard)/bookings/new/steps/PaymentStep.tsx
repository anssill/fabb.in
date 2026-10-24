'use client'

import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SplitPaymentFields } from '@/components/payments/SplitPaymentFields'
import { CreditCard } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { BookingPayment } from '../page'
import { bookingNumberError, normalizeBookingNumber } from '@/lib/booking-number'

interface Props {
  customBookingNumber: string
  setCustomBookingNumber: (value: string) => void
  payment: BookingPayment
  setPayment: (p: BookingPayment) => void
  totalAmount: number
}

export function PaymentStep({ payment, setPayment, totalAmount, customBookingNumber, setCustomBookingNumber }: Props) {
  const settings = useAppStore(state => state.activeBranch?.settings)
  const minPct = Number(settings?.min_advance_pct ?? 0)
  const depositPct = Number(settings?.deposit_default_pct ?? 0)
  const numberError = bookingNumberError(customBookingNumber)
  const balanceDue = totalAmount - payment.advance_amount

  const presets = [
    { label: `Suggested ${minPct}%`, value: Math.min(totalAmount, Math.round(totalAmount * minPct) / 100) },
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
          <Label htmlFor="advance-amount">Advance amount (₹)</Label>
          <Input
            type="number"
            id="advance-amount"
            step="0.01"
            value={payment.advance_amount || ''}
            onChange={(e) => setPayment({ ...payment, advance_amount: Number(e.target.value) })}
            placeholder="0"
            min={0}
            max={totalAmount}
          />
          <p className="text-xs text-muted-foreground">Enter any amount from ₹0 to the booking total, or choose a preset below.</p>
          {(!Number.isFinite(payment.advance_amount) || payment.advance_amount < 0 || payment.advance_amount > totalAmount) && (
            <p role="alert" className="text-xs text-destructive">Enter an advance between ₹0 and ₹{totalAmount.toLocaleString('en-IN')}.</p>
          )}
          <div className="flex gap-2">
            {presets.map((preset) => (
              <button
                type="button"
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

        <SplitPaymentFields label="Advance" total={payment.advance_amount} value={payment} onChange={value => setPayment({ ...payment, ...value })}/>

        <div className="space-y-2">
          <Label htmlFor="custom-booking-number">Custom booking number <span className="text-muted-foreground">(optional)</span></Label>
          <Input id="custom-booking-number" value={customBookingNumber} maxLength={40}
            onChange={event => setCustomBookingNumber(event.target.value.toUpperCase())}
            onBlur={() => setCustomBookingNumber(normalizeBookingNumber(customBookingNumber))}
            aria-invalid={!!numberError} aria-describedby="custom-booking-number-help"
            placeholder="Automatic if left blank" />
          <p id="custom-booking-number-help" className="text-xs text-muted-foreground">Leave blank for this branch’s automatic numbering, or enter your own unique number using letters, numbers, hyphens, underscores or slashes.</p>
          {numberError && <p role="alert" className="text-xs text-destructive">{numberError}</p>}
        </div>

        {/* Physical bill number */}
        <div className="space-y-2">
          <Label>Physical bill number <span className="text-muted-foreground">(optional)</span></Label>
          <Input
            value={payment.physical_bill_number || ''}
            onChange={(e) => setPayment({ ...payment, physical_bill_number: e.target.value.toUpperCase().slice(0, 40) })}
            placeholder="Bill book number"
          />
          <p className="text-xs text-muted-foreground">Use the number from the paper bill so it can be searched later.</p>
        </div>

        <button type="button" className="text-sm text-primary underline" onClick={() => setPayment({ ...payment, deposit_amount: Math.round(totalAmount * depositPct) / 100 })}>Use default deposit ({depositPct}%)</button>
        {/* Security deposit */}
        <div className="space-y-2">
          <Label>Security deposit <span className="text-muted-foreground">(optional)</span></Label>
          <Input
            type="number"
            value={payment.deposit_amount || ''}
            onChange={(e) => setPayment({ ...payment, deposit_amount: Math.max(0, Number(e.target.value)) })}
            placeholder="0"
            min={0}
          />
          <p className="text-xs text-muted-foreground">Refundable deposit collected now, separate from rental payment</p>
        </div>

        {payment.deposit_amount > 0 && <SplitPaymentFields label="Deposit" total={payment.deposit_amount} value={{ method: payment.deposit_method ?? payment.method, reference: payment.deposit_reference, splits: payment.deposit_splits }} onChange={value => setPayment({ ...payment, deposit_method: value.method, deposit_reference: value.reference, deposit_splits: value.splits })}/>}

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
