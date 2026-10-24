type ExistingItem = { sku: string | null; category: string | null }

/** Follow the configured prefix without reusing any business SKU. */
export function nextInventorySku(items: ExistingItem[], category: string, preferredPrefix: string): string {
  const preferred = preferredPrefix.trim().toUpperCase().replace(/[-\s]+$/, '')
  const groups = new Map<string, { count: number; highest: bigint; width: number }>()
  for (const item of items) {
    const code = item.sku?.trim().toUpperCase() || ''
    const match = code.match(/^(.*?)(\d+)$/)
    if (!match || !match[1] || item.category?.trim().toLowerCase() !== category.trim().toLowerCase()) continue
    const group = groups.get(match[1]) || { count: 0, highest: BigInt(0), width: 0 }
    group.count++
    group.highest = BigInt(match[2]) > group.highest ? BigInt(match[2]) : group.highest
    group.width = Math.max(group.width, match[2].length)
    groups.set(match[1], group)
  }
  const matching = [...groups.keys()].filter(prefix => prefix === preferred || prefix === `${preferred}-`)
  const candidates = matching
  candidates.sort((a, b) => groups.get(b)!.count - groups.get(a)!.count || a.localeCompare(b))
  const prefix = candidates[0] || `${preferred}-`
  let highest = BigInt(0)
  let width = groups.get(prefix)?.width || 3
  // Include archived items and other categories sharing this code prefix.
  for (const item of items) {
    const code = item.sku?.trim().toUpperCase() || ''
    if (!code.startsWith(prefix)) continue
    const suffix = code.slice(prefix.length)
    if (!/^\d+$/.test(suffix)) continue
    highest = BigInt(suffix) > highest ? BigInt(suffix) : highest
    width = Math.max(width, suffix.length)
  }
  return `${prefix}${String(highest + BigInt(1)).padStart(width, '0')}`
}
