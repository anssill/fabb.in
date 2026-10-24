'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Search, Package, Plus, Minus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import { calculateBookingPricing, calculateItemPricing, clampItemDiscount } from '@/lib/booking-pricing'
import { ItemDiscountInput } from '@/components/payments/ItemDiscountInput'
import type { BookingItem, BookingDates } from '../page'

interface Props {
  items: BookingItem[]
  setItems: (items: BookingItem[]) => void
  dates: BookingDates
  setDates: (dates: BookingDates) => void
  branchId?: string
  reservedQuantities?: Record<string, number>
}
interface SearchResult {
  id: string
  name: string
  sku: string | null
  price: number
  cover_image_url: string | null
  item_variants: { id: string; size: string; total_stock: number; price_override: number | null }[]
}
const NO_RESERVATIONS: Record<string, number> = {}
type AvailabilityRow = { variant_id: string; physical_stock: number; peak_booked: number; out_quantity: number; unavailable_quantity: number; available_quantity: number }

function ItemPhoto({ src, name }: { src?: string | null; name: string }) {
  const [failed, setFailed] = useState(false)
  return <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
    {src && !failed
      ? <Image unoptimized src={src} alt={`${name} photo`} width={48} height={48} className="h-full w-full object-contain" onError={() => setFailed(true)} />
      : <Package aria-hidden="true" className="h-5 w-5 text-muted-foreground" />}
  </div>
}

export function ItemsStep({ items, setItems, dates, setDates, branchId, reservedQuantities = NO_RESERVATIONS }: Props) {
  const { staff, activeBranch } = useAppStore()
  const businessId = staff?.business_id
  const branch = branchId ?? activeBranch?.id ?? staff?.branch_id
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(true)
  const [searchError, setSearchError] = useState('')
  const [retry, setRetry] = useState(0)
  const [available, setAvailable] = useState<Record<string, number>>({})
  const [availabilityRows, setAvailabilityRows] = useState<AvailabilityRow[]>([])
  const [checkedPeriod, setCheckedPeriod] = useState('')
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const period = `${branch}:${dates.pickup_date}:${dates.return_date}`
  const validPeriod = !!dates.pickup_date && !!dates.return_date && dates.return_date >= dates.pickup_date
  const [checking, setChecking] = useState(true)
  const [availabilityError, setAvailabilityError] = useState(false)
  const [selectedListRef, setSelectedListRef] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(async () => {
      setSearching(true)
      setSearchError('')
      setResults([])
      if (!businessId || !branch) { setSearching(false); return }
      try {
        let query = createClient().from('items')
          .select('id, name, sku, price, cover_image_url, item_variants!inner(id, size, total_stock, price_override)')
          .eq('business_id', businessId).eq('branch_id', branch).eq('is_active', true).is('archived_at', null)
          .eq('item_variants.branch_id', branch).is('item_variants.archived_at', null)
        const term = searchQuery.trim().replace(/[,().%_*"\\]/g, ' ')
        if (term) query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%`)
        const { data, error } = await query.order('name').limit(30)
        if (error) throw error
        if (!cancelled) setResults(data ?? [])
      } catch {
        if (!cancelled) setSearchError('Could not load products. Try again.')
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 250)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [businessId, branch, searchQuery, retry])

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(async () => {
      setAvailable({})
      setAvailabilityError(false)
      setChecking(true)
      if (!businessId || !branch || !dates.pickup_date || !dates.return_date || dates.return_date < dates.pickup_date) { setChecking(false); return }
      try {
        const { data, error } = await createClient().rpc('get_rental_availability', {
          p_business_id: businessId, p_branch_id: branch,
          p_from: dates.pickup_date, p_to: dates.return_date, p_requested_quantity: 0,
        })
        if (error) throw error
        if (!cancelled) { setAvailabilityRows(data ?? []); setCheckedPeriod(`${branch}:${dates.pickup_date}:${dates.return_date}`) }
        if (!cancelled) setAvailable(Object.fromEntries((data ?? []).map((row: { variant_id: string; available_quantity: number }) => [row.variant_id, row.available_quantity + (reservedQuantities[row.variant_id] ?? 0)])))
      } catch {
        if (!cancelled) setAvailabilityError(true)
      } finally {
        if (!cancelled) setChecking(false)
      }
    }, 0)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [businessId, branch, dates.pickup_date, dates.return_date, reservedQuantities, retry])

  const addItem = (product: SearchResult, variant: SearchResult['item_variants'][number]) => {
    if (items.some(item => item.variant_id === variant.id)) return
    setItems([...items, {
      item_id: product.id, variant_id: variant.id, name: product.name, sku: product.sku ?? undefined,
      cover_image_url: product.cover_image_url,
      size: variant.size, price: Number(variant.price_override ?? product.price), quantity: 1,
      discount_percent: 0, discount_flat: 0, rental_days: 1, rate_basis: 'booking',
    }])
    toast.success(`${product.name} · ${variant.size} added`)
  }
  const change = (id: string, field: 'quantity' | 'price' | 'discount_percent', value: number) => {
    if (!Number.isFinite(value)) return
    const maximum = field === 'quantity' ? 100000 : field === 'price' ? 99999999 : 100
    const normalized = Math.min(maximum, Math.max(field === 'quantity' ? 1 : 0, field === 'quantity' ? Math.trunc(value) : value))
    setItems(items.map(item => item.variant_id === id ? clampItemDiscount({ ...item, [field]: normalized }) : item))
  }
  const hasConflict = items.some(item => available[item.variant_id] !== undefined && item.quantity > available[item.variant_id])
  const totals = calculateBookingPricing(items)

  return <>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" />Booking products</CardTitle>
      <CardDescription>Add multiple products and sizes to the same booking. Adjust each quantity, price and discount below.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-5">
      <section className="space-y-3 rounded-lg border p-3" aria-label="Availability dates">
        <h3 className="font-semibold">Check item availability by date</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><Label htmlFor="availability-from">Pickup date</Label><Input id="availability-from" type="date" disabled={!!branchId} value={dates.pickup_date} onChange={event => setDates({ ...dates, pickup_date: event.target.value })} /></div>
          <div><Label htmlFor="availability-to">Return date</Label><Input id="availability-to" type="date" disabled={!!branchId} min={dates.pickup_date} value={dates.return_date} onChange={event => setDates({ ...dates, return_date: event.target.value })} /></div>
        </div>
        <p className="text-xs text-muted-foreground">Search by item code or name, then select “Full availability” to check every size for the whole rental period. These are the booking dates.</p>
        {!validPeriod && <p role="alert" className="text-sm text-destructive">Choose a pickup date and a return date on or after pickup.</p>}
        <Button type="button" variant="outline" size="sm" onClick={() => setRetry(value => value + 1)}>Refresh availability</Button>
      </section>
      <section className="space-y-3" aria-label="Add products">
        <Label htmlFor="booking-product-search">Add another product</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input id="booking-product-search" className="pl-10" placeholder="Search by product name or code…" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} />
        </div>
        {searchError ? <div role="alert" className="text-sm text-destructive">{searchError} <Button type="button" variant="outline" size="sm" onClick={() => setRetry(value => value + 1)}>Retry</Button></div>
          : searching ? <p role="status" className="text-sm text-muted-foreground">Loading products…</p>
          : !results.length ? <p className="rounded-lg border p-4 text-sm text-muted-foreground">No matching products with active sizes. Try another name or code.</p>
          : <div className="max-h-72 space-y-3 overflow-y-auto rounded-xl border p-3">
            {results.map(product => <div key={product.id} className="space-y-2 rounded-lg border bg-background p-3">
              <div className="flex items-center gap-3">
                <ItemPhoto key={product.cover_image_url || product.id} src={product.cover_image_url} name={product.name} />
                <div className="min-w-0"><p className="break-words font-medium">{product.name}</p><p className="text-xs text-muted-foreground">{product.sku}</p></div>
                <Button type="button" variant="outline" size="sm" className="ml-auto" aria-expanded={expandedProduct === product.id} onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}>Full availability</Button>
              </div>
              {expandedProduct === product.id && <div aria-live="polite" className="overflow-x-auto">
                {!validPeriod ? <p>Choose valid dates above.</p> : availabilityError ? <p role="alert">Availability could not be checked. Use Refresh availability to retry.</p> : checking || checkedPeriod !== period ? <p role="status">Checking availability…</p> : <>
                  <p className="my-2 text-xs">{dates.pickup_date} through {dates.return_date} (inclusive)</p>
                  <table className="w-full text-left text-xs"><thead><tr>{['Size', 'Stock', 'Peak booked', 'Out now', 'Damaged / missing', 'Available', 'In this booking'].map(label => <th key={label} className="p-2">{label}</th>)}</tr></thead>
                    <tbody>{product.item_variants.map(variant => { const row = availabilityRows.find(entry => entry.variant_id === variant.id); return <tr key={variant.id} className="border-t"><td className="p-2">{variant.size}</td>{[row?.physical_stock, row?.peak_booked, row?.out_quantity, row?.unavailable_quantity, row ? available[variant.id] : undefined, items.find(item => item.variant_id === variant.id)?.quantity ?? 0].map((value, index) => <td key={index} className="p-2">{value ?? 'Unknown'}</td>)}</tr> })}</tbody>
                  </table><p className="my-2 text-xs text-muted-foreground">Available is the minimum over the period. Out-now and peak-booked counts may overlap.{branchId ? ' Available includes the quantity already reserved by this booking.' : ''}</p>
                </>}
              </div>}
              <div className="flex flex-wrap gap-2">{product.item_variants.map(variant => {
                const selected = items.some(item => item.variant_id === variant.id)
                const capacity = available[variant.id]
                return <Button key={variant.id} type="button" variant={selected ? 'secondary' : 'outline'} size="sm" disabled={selected} onClick={() => addItem(product, variant)} aria-label={`Add ${product.name} size ${variant.size}`}>
                  {selected ? 'Added' : '+'} {variant.size}
                  {!selected && validPeriod && !availabilityError && !checking && checkedPeriod === period && capacity !== undefined && <span className="text-xs"> · {capacity} available</span>}
                </Button>
              })}</div>
            </div>)}
            <p className="text-xs text-muted-foreground">Showing up to 30 products. Search to find more.</p>
          </div>}
      </section>
      <section className="space-y-3" aria-label="Selected booking products">
        <h3 className="font-semibold">Selected products ({items.length}) · {items.reduce((sum, item) => sum + item.quantity, 0)} pieces</h3>
        <div className="flex items-stretch gap-2">
        <div
          ref={setSelectedListRef}
          aria-label="Selected items scroll area"
          tabIndex={0}
          className="h-[55dvh] min-h-64 max-h-[36rem] min-w-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto overscroll-y-contain rounded-xl border-2 border-border bg-muted/10 p-3 pr-2 [scrollbar-width:thin] [scrollbar-color:hsl(var(--foreground)/.35)_transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {!items.length && <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">No products selected. Add one or more products above.</p>}
          {items.map(item => <SelectedBookingItem key={item.variant_id} item={item} onChange={(updated) => setItems(items.map(line => line.variant_id === item.variant_id ? updated : line))} onRemove={() => setItems(items.filter(line => line.variant_id !== item.variant_id))} />)}
        </div>
        <div className="flex w-10 shrink-0 flex-col justify-center gap-2" aria-label="Scroll selected items">
          <Button type="button" variant="outline" size="icon" aria-label="Scroll selected items up" onClick={() => selectedListRef?.scrollBy({ top: -260, behavior: 'smooth' })}><ChevronUp className="h-5 w-5" /></Button>
          <Button type="button" variant="outline" size="icon" aria-label="Scroll selected items down" onClick={() => selectedListRef?.scrollBy({ top: 260, behavior: 'smooth' })}><ChevronDown className="h-5 w-5" /></Button>
        </div>
        </div>
        <p className="text-right font-semibold" aria-live="polite">Products total: ₹{totals.total_amount.toLocaleString('en-IN')}</p>
      </section>
      {(availabilityError || checking) && <p className="text-xs text-muted-foreground" role="status">{checking ? 'Checking date availability…' : 'Availability preview unavailable. Stock will be checked when you save.'}</p>}
      {(hasConflict || !!branchId) && <div className="space-y-2 rounded-lg border p-3">
        {hasConflict && <p className="text-sm text-amber-700">The selected quantity exceeds available stock. An authorized override is required.</p>}
        <Label htmlFor="overbook-reason">Overbooking reason{hasConflict ? ' *' : ' (only if needed)'}</Label>
        <Input id="overbook-reason" value={dates.overbook_reason ?? ''} onChange={event => setDates({ ...dates, overbook_reason: event.target.value })} placeholder="Explain any approved stock shortage" />
      </div>}
    </CardContent>
  </>
}

function SelectedBookingItem({ item, onChange, onRemove }: { item: BookingItem; onChange: (item: BookingItem) => void; onRemove: () => void }) {
  const [editing, setEditing] = useState(false)
  const setField = (field: 'quantity' | 'price', raw: number) => {
    if (!Number.isFinite(raw)) return
    const value = field === 'quantity' ? Math.min(100000, Math.max(1, Math.trunc(raw))) : Math.min(99999999, Math.max(0, raw))
    onChange(clampItemDiscount({ ...item, [field]: value }))
  }
  return <div className="space-y-3 rounded-xl border bg-muted/20 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <ItemPhoto key={item.cover_image_url || item.item_id} src={item.cover_image_url} name={item.name} />
              <div className="min-w-0"><p className="break-words font-medium">{item.name}</p><p className="text-xs text-muted-foreground">Size {item.size}{item.sku ? ` · ${item.sku}` : ''} · {item.rate_basis === 'day' ? `${item.rental_days} billable day(s)` : 'Price for the entire booking'}</p></div>
            </div>
            <div className="flex shrink-0 gap-1"><Button type="button" variant="outline" size="sm" onClick={() => setEditing(value => !value)} aria-expanded={editing}>{editing ? 'Done' : 'Edit'}</Button><Button type="button" variant="ghost" size="sm" className="text-destructive" aria-label={`Remove ${item.name} size ${item.size}`} onClick={onRemove}><Trash2 className="h-4 w-4" /><span className="sr-only">Remove</span></Button></div>
          </div>
          {editing && <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1"><Label htmlFor={`${item.variant_id}-edit-size`}>Size</Label><Input id={`${item.variant_id}-edit-size`} value={item.size} onChange={event => onChange({ ...item, size: event.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor={`${item.variant_id}-quantity`}>Quantity</Label><div className="flex items-center gap-1">
              <Button type="button" variant="outline" size="icon" aria-label={`Decrease ${item.name} quantity`} disabled={item.quantity <= 1} onClick={() => setField('quantity', item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
              <Input id={`${item.variant_id}-quantity`} type="number" min="1" max="100000" step="1" value={item.quantity} onChange={event => setField('quantity', Number(event.target.value))} className="min-w-0 text-center" />
              <Button type="button" variant="outline" size="icon" aria-label={`Increase ${item.name} quantity`} onClick={() => setField('quantity', item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
            </div></div>
            <div className="space-y-1"><Label htmlFor={`${item.variant_id}-price`}>Price per piece (₹)</Label><Input id={`${item.variant_id}-price`} type="number" min="0" max="99999999" step="0.01" value={item.price} onChange={event => setField('price', Number(event.target.value))} /></div>
            <ItemDiscountInput item={item} onChange={discount => onChange(clampItemDiscount({ ...item, ...discount }))} />
          </div>}
          {!editing && <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1"><Label>Quantity</Label><p className="rounded-md border bg-background px-3 py-2">{item.quantity}</p></div>
            <div className="space-y-1"><Label>Price per piece</Label><p className="rounded-md border bg-background px-3 py-2">₹{item.price.toLocaleString('en-IN')}</p></div>
            <div className="space-y-1"><Label>Discount</Label><p className="rounded-md border bg-background px-3 py-2">{item.discount_flat != null ? `₹${item.discount_flat.toLocaleString('en-IN')}` : `${item.discount_percent ?? 0}%`}</p></div>
          </div>}
          <p className="text-right text-sm font-semibold">Line total: ₹{calculateItemPricing(item).total_amount.toLocaleString('en-IN')}</p>
        </div>
}
