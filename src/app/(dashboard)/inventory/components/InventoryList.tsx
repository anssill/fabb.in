'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { addDays, format } from 'date-fns'
import { CalendarDays, Layers3, Package, QrCode, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { QRScanner } from '@/components/shared/QRScanner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type Variant = { id: string; size: string; total_stock: number; price_override: number | null }
type InventoryItem = {
  id: string; name: string; sku: string | null; category: string; cover_image_url: string | null
  price: number; deposit_amount: number; status: string; storage_location: string | null
  item_variants: Variant[] | null
}
type AvailabilityRow = {
  item_id: string; variant_id: string; size: string; physical_stock: number; peak_booked: number
  unavailable_quantity: number; out_quantity: number; available_quantity: number; shortage_quantity: number
}
type Props = { initialItems: InventoryItem[]; businessId: string; branchId: string }

export function InventoryList({ initialItems, businessId, branchId }: Props) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [availability, setAvailability] = useState<AvailabilityRow[]>([])
  const [range, setRange] = useState<{ from: Date; to: Date }>({ from: new Date(), to: addDays(new Date(), 3) })

  useEffect(() => {
    let cancelled = false
    async function loadAvailability() {
      setLoading(true)
      const supabase = createClient()
      const rpc = supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: AvailabilityRow[] | null; error: { message: string } | null }>
      const { data, error } = await rpc('get_rental_availability', {
        p_business_id: businessId, p_branch_id: branchId,
        p_from: format(range.from, 'yyyy-MM-dd'), p_to: format(range.to, 'yyyy-MM-dd'),
        p_item_id: null, p_requested_quantity: 0,
      })
      if (!cancelled) {
        if (error) console.error('Availability query failed', error.message)
        setAvailability(data ?? [])
        setLoading(false)
      }
    }
    void loadAvailability()
    return () => { cancelled = true }
  }, [branchId, businessId, range])

  const categories = useMemo(() => [...new Set(initialItems.map((item) => item.category))].sort(), [initialItems])
  const availabilityByVariant = useMemo(() => new Map(availability.map((row) => [row.variant_id, row])), [availability])
  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    return initialItems.filter((item) => {
      const matchesSearch = !normalized || item.name.toLowerCase().includes(normalized) || item.sku?.toLowerCase().includes(normalized)
      return matchesSearch && (!category || item.category === category)
    })
  }, [category, initialItems, search])

  function handleScan(value: string) {
    setScannerOpen(false)
    const match = initialItems.find((item) => item.sku === value || item.id === value)
    if (match) window.location.assign(`/inventory/${match.id}`)
  }

  return (
    <div className="space-y-5">
      <Card className="border-0 shadow-sm">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or SKU" className="pl-10" />
            </div>
            <Popover>
              <PopoverTrigger asChild><Button variant="outline" className="justify-start rounded-full px-4"><CalendarDays className="mr-2 h-4 w-4 text-primary" />{format(range.from, 'dd MMM yyyy')} – {format(range.to, 'dd MMM yyyy')}</Button></PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="range" selected={range} defaultMonth={range.from} numberOfMonths={2} onSelect={(selection) => { if (selection?.from) setRange({ from: selection.from, to: selection.to ?? selection.from }) }} />
              </PopoverContent>
            </Popover>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-full border bg-background px-4 text-sm">
              <option value="">All categories</option>
              {categories.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <Button variant="outline" onClick={() => setScannerOpen(true)}><QrCode className="mr-2 h-4 w-4" />Scan</Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Pickup and return dates are inclusive. No turnover buffer is added.</span>
            {loading && <span className="flex items-center gap-1"><Layers3 className="h-3 w-3 animate-spin" />Updating availability…</span>}
          </div>
        </CardContent>
      </Card>

      <QRScanner isOpen={scannerOpen} onClose={() => setScannerOpen(false)} onScanSuccess={handleScan} onScanError={console.warn} />

      {filtered.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((item) => {
            const rows = (item.item_variants ?? []).map((variant) => availabilityByVariant.get(variant.id) ?? {
              item_id: item.id, variant_id: variant.id, size: variant.size, physical_stock: variant.total_stock,
              peak_booked: 0, unavailable_quantity: 0, out_quantity: 0, available_quantity: variant.total_stock, shortage_quantity: 0,
            })
            const totals = rows.reduce((sum, row) => ({
              physical: sum.physical + row.physical_stock, booked: sum.booked + row.peak_booked,
              unavailable: sum.unavailable + row.unavailable_quantity, out: sum.out + row.out_quantity,
              available: sum.available + row.available_quantity,
            }), { physical: 0, booked: 0, unavailable: 0, out: 0, available: 0 })

            return (
              <Link key={item.id} href={`/inventory/${item.id}`}>
                <Card className="group h-full overflow-hidden border-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {item.cover_image_url ? <Image src={item.cover_image_url} alt={item.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition group-hover:scale-105" /> : <div className="grid h-full place-items-center"><Package className="h-12 w-12 text-muted-foreground/30" /></div>}
                    <Badge className="absolute right-3 top-3 bg-background/90 text-foreground">{totals.available} available</Badge>
                  </div>
                  <CardContent className="space-y-3 p-4">
                    <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">{item.category}</p><h3 className="truncate font-semibold">{item.name}</h3><p className="text-xs text-muted-foreground">SKU {item.sku || '—'} · ₹{item.price}</p></div>
                    <div className="grid grid-cols-4 gap-2 rounded-2xl bg-muted/60 p-3 text-center">
                      <Metric label="Stock" value={totals.physical} /><Metric label="Booked" value={totals.booked} /><Metric label="Out" value={totals.out} /><Metric label="Blocked" value={totals.unavailable} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {rows.map((row) => <span key={row.variant_id} className={`rounded-full border px-2 py-1 text-[11px] ${row.available_quantity > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30' : 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/30'}`}>{row.size}: {row.available_quantity}/{row.physical_stock}</span>)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : <Card className="border-dashed"><CardContent className="py-16 text-center text-sm text-muted-foreground">No rental items match these filters.</CardContent></Card>}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div><p className="font-semibold text-foreground">{value}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>
}
