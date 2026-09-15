export type PricedItem = { price: number; quantity: number; discount_percent?: number; rental_days?: number }
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
  const discount_amount = money(subtotal * money(discount) / 100)
  return { subtotal, discount_amount, total_amount: money(subtotal - discount_amount) }
}
export function calculateBookingPricing(items: PricedItem[]) {
  return items.reduce((total, item) => {
    const line = calculateItemPricing(item)
    return { subtotal: money(total.subtotal + line.subtotal), discount_amount: money(total.discount_amount + line.discount_amount), total_amount: money(total.total_amount + line.total_amount) }
  }, { subtotal: 0, discount_amount: 0, total_amount: 0 })
}
