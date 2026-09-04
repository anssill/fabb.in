'use client'

import { useEffect, useState } from 'react'
import { addDays, format } from 'date-fns'
import { CalendarDays, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type Variant = { id: string; size: string; total_stock: number }
type Row = { variant_id: string; size: string; physical_stock: number; peak_booked: number; unavailable_quantity: number; out_quantity: number; available_quantity: number }

export function AvailabilityCalendar({ itemId, businessId, branchId, variants }: { itemId: string; businessId: string; branchId: string; variants: Variant[] }) {
  const [range, setRange] = useState({ from: new Date(), to: addDays(new Date(), 14) })
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const supabase = createClient()
      const rpc = supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: Row[] | null }>
      const { data } = await rpc('get_rental_availability', {
        p_business_id: businessId, p_branch_id: branchId, p_item_id: itemId,
        p_from: format(range.from, 'yyyy-MM-dd'), p_to: format(range.to, 'yyyy-MM-dd'), p_requested_quantity: 0,
      })
      if (active) { setRows(data ?? []); setLoading(false) }
    }
    void load()
    return () => { active = false }
  }, [branchId, businessId, itemId, range])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div><CardTitle className="text-base">Rental availability</CardTitle><p className="text-xs text-muted-foreground">Minimum availability and peak bookings for the selected period.</p></div>
        <Popover>
          <PopoverTrigger asChild><Button variant="outline"><CalendarDays className="mr-2 h-4 w-4" />{format(range.from, 'dd MMM')} – {format(range.to, 'dd MMM yyyy')}</Button></PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end"><Calendar mode="range" selected={range} numberOfMonths={2} onSelect={(value) => { if (value?.from) setRange({ from: value.from, to: value.to ?? value.from }) }} /></PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent>
        {loading ? <div className="flex items-center justify-center py-10 text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Calculating dates…</div> : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs text-muted-foreground"><tr><th className="p-3">Size</th><th className="p-3 text-center">Physical</th><th className="p-3 text-center">Peak booked</th><th className="p-3 text-center">Out now</th><th className="p-3 text-center">Damaged/missing</th><th className="p-3 text-center">Available</th></tr></thead>
              <tbody className="divide-y">{variants.map((variant) => {
                const row = rows.find((entry) => entry.variant_id === variant.id)
                return <tr key={variant.id}><td className="p-3 font-medium">{variant.size}</td><td className="p-3 text-center">{row?.physical_stock ?? variant.total_stock}</td><td className="p-3 text-center">{row?.peak_booked ?? 0}</td><td className="p-3 text-center">{row?.out_quantity ?? 0}</td><td className="p-3 text-center">{row?.unavailable_quantity ?? 0}</td><td className="p-3 text-center font-semibold text-emerald-600">{row?.available_quantity ?? variant.total_stock}</td></tr>
              })}</tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">Function and fitting dates are informational. Only pickup through planned return affects availability.</p>
      </CardContent>
    </Card>
  )
}
