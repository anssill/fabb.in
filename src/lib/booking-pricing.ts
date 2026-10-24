export type PricedItem = { price: number; quantity: number; discount_percent?: number; discount_flat?: number | null; rental_days?: number }
export const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100
export function calculateItemPricing(item: PricedItem) {
  const days = item.rental_days ?? 1
  const discount = item.discount_percent ?? 0
  if (!Number.isFinite(item.price) || item.price < 0 || item.price > 99999999 ||
      !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100000 ||
      !Number.isInteger(days) || days < 1 || !Number.isFinite(discount) || discount < 0 || discount > 100) {
    throw new Error('Enter a valid per-piece price, quantity and discount between 0 and 100%.')
  }
  const subtotal = money(money(item.price) * item.quantity * days)
  const flat = item.discount_flat
  if (flat != null && (!Number.isFinite(flat) || flat < 0 || money(flat) > subtotal)) throw new Error('Rupee discount must be between zero and the item subtotal.')
  const discount_amount = flat != null ? money(flat) : money(subtotal * money(discount) / 100)
  return { subtotal, discount_amount, total_amount: money(subtotal - discount_amount) }
}

export function clampItemDiscount<T extends PricedItem>(item: T): T {
  return item.discount_flat == null ? item : { ...item, discount_flat: Math.min(item.discount_flat, money(money(item.price) * item.quantity * (item.rental_days ?? 1))) }
}
export function calculateBookingPricing(items: PricedItem[]) {
  return items.reduce((total, item) => {
    const line = calculateItemPricing(item)
    return { subtotal: money(total.subtotal + line.subtotal), discount_amount: money(total.discount_amount + line.discount_amount), total_amount: money(total.total_amount + line.total_amount) }
  }, { subtotal: 0, discount_amount: 0, total_amount: 0 })
}

export function applyBookingTax(total: ReturnType<typeof calculateBookingPricing>, settings: { gst_enabled?: boolean; gst_rate?: number } = {}) {
  const rate = Number(settings.gst_rate ?? 18)
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) throw new Error('Invalid GST rate in invoice settings')
  const tax_amount = settings.gst_enabled ? money(total.total_amount * rate / 100) : 0
  return { ...total, tax_amount, total_amount: money(total.total_amount + tax_amount) }
}
