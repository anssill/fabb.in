export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' }, { value: 'bank_transfer', label: 'Bank transfer' },
] as const
export type PaymentMethod = typeof PAYMENT_METHODS[number]['value']
export interface PaymentPart { method: PaymentMethod; amount: number; reference?: string }
export interface PaymentAllocation { method: PaymentMethod; reference?: string; splits?: PaymentPart[] }
const cents = (value: number) => {
  if (!Number.isFinite(value) || value < 0 || value > 99999999 || Math.abs(value * 100 - Math.round(value * 100)) > 0.00001) throw new Error('Enter a valid amount with at most two decimal places')
  return Math.round(value * 100)
}
export function paymentParts(total: number, allocation: PaymentAllocation): PaymentPart[] {
  const expected = cents(total)
  if (expected === 0) return []
  const parts = allocation.splits ?? [{ method: allocation.method, amount: total, reference: allocation.reference }]
  if (!Array.isArray(parts) || parts.length < 1 || parts.length > 8) throw new Error('Use between one and eight payment methods')
  let sum = 0
  const normalized = parts.map(part => {
    if (!part || !PAYMENT_METHODS.some(method => method.value === part.method)) throw new Error('Choose a valid payment method')
    const amount = cents(part.amount)
    if (!amount) throw new Error('Each payment part must be greater than zero')
    sum += amount
    return { method: part.method, amount: amount / 100, reference: part.reference?.trim() || undefined }
  })
  if (sum !== expected) throw new Error('Payment parts must add up to the amount collected')
  return normalized
}
export function paymentError(total: number, allocation: PaymentAllocation): string | null {
  try { paymentParts(total, allocation); return null } catch (error) { return error instanceof Error ? error.message : 'Invalid payment' }
}
export function paymentSummary(total: number, allocation: PaymentAllocation): string {
  if (!total) return 'No payment'
  return (allocation.splits ?? [{ method: allocation.method, amount: total }]).map(part => `${PAYMENT_METHODS.find(m => m.value === part.method)?.label ?? part.method} ₹${part.amount.toLocaleString('en-IN')}`).join(' + ')
}
