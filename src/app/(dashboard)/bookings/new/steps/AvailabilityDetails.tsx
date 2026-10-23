'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

type Row = { variant_id: string; physical_stock: number; peak_booked: number; out_quantity: number; unavailable_quantity: number; available_quantity: number }
export function AvailabilityDetails({ itemId, businessId, branchId, from, to, variants, items }: {
  itemId: string; businessId: string; branchId: string; from: string; to: string
  variants: { id: string; size: string }[]; items: { variant_id: string; quantity: number }[]
}) {
  const key = `${businessId}:${branchId}:${itemId}:${from}:${to}`
  const valid = !!from && !!to && to >= from
  const [result, setResult] = useState<{ key: string; rows: Row[]; error?: string }>({ key: '', rows: [] })
  const [retry, setRetry] = useState(0)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      if (!valid) return
      setLoading(true)
      try {
        const { data, error } = await createClient().rpc('get_rental_availability', {
          p_business_id: businessId, p_branch_id: branchId, p_item_id: itemId,
          p_from: from, p_to: to, p_requested_quantity: 0,
        })
        if (error) throw error
        if (active) setResult({ key, rows: data ?? [] })
      } catch { if (active) setResult({ key, rows: [], error: 'Availability could not be checked. Please retry.' }) }
      finally { if (active) setLoading(false) }
    }, 0)
    return () => { active = false; clearTimeout(timer) }
  }, [businessId, branchId, itemId, from, to, valid, key, retry])
  return <section className="space-y-2 rounded-lg border p-3" aria-label="Full item availability" aria-live="polite">
    <p className="text-sm font-medium">{from} through {to} (inclusive)</p>
    {!valid ? <p role="alert">Choose valid pickup and return dates.</p> : loading || result.key !== key ? <p role="status">Checking availability…</p> : result.error ? <p role="alert" className="text-destructive">{result.error}</p> : <div className="overflow-x-auto">
      <table className="w-full text-left text-xs"><thead><tr>{['Size', 'Stock', 'Peak booked', 'Out now', 'Damaged / missing', 'Available', 'In this booking'].map(label => <th key={label} className="p-2">{label}</th>)}</tr></thead>
        <tbody>{variants.map(variant => { const row = result.rows.find(entry => entry.variant_id === variant.id); return <tr key={variant.id} className="border-t"><td className="p-2">{variant.size}</td>{[row?.physical_stock, row?.peak_booked, row?.out_quantity, row?.unavailable_quantity, row?.available_quantity, items.find(item => item.variant_id === variant.id)?.quantity ?? 0].map((value, index) => <td key={index} className="p-2">{value ?? 'Unknown'}</td>)}</tr> })}</tbody>
      </table>
    </div>}
    <p className="text-xs text-muted-foreground">Available is the minimum over the period. Out-now and peak-booked counts may overlap. Stock is checked again when the booking is confirmed.</p>
    <Button type="button" variant="outline" size="sm" disabled={!valid} onClick={() => setRetry(value => value + 1)}>Refresh availability</Button>
  </section>
}
