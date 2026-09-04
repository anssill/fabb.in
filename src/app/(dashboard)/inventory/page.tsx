import Link from 'next/link'
import { AlertTriangle, Archive, ArrowLeftRight, ClipboardCheck, Package, PackageCheck, PackageOpen, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { InventoryList } from './components/InventoryList'
import { CsvImportDialog } from './components/CsvImportDialog'

export default async function InventoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: staff } = await supabase.from('staff').select('business_id, branch_id').eq('id', user.id).single()
  if (!staff?.business_id || !staff.branch_id) return null

  const { data, count } = await supabase
    .from('items')
    .select(`id, name, sku, category, cover_image_url, price, deposit_amount, status, total_rentals, is_active, storage_location, item_variants!inner(id, size, total_stock, price_override, branch_id, archived_at)`, { count: 'exact' })
    .eq('business_id', staff.business_id)
    .eq('is_active', true)
    .is('archived_at', null)
    .eq('item_variants.branch_id', staff.branch_id)
    .is('item_variants.archived_at', null)
    .order('created_at', { ascending: false })

  const items = data ?? []
  const physicalUnits = items.reduce((sum, item) => sum + (item.item_variants ?? []).reduce((variantSum, variant) => variantSum + (variant.total_stock ?? 0), 0), 0)

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[1.65rem] font-semibold tracking-tight text-foreground">Rental inventory</h1>
          <p className="text-sm text-muted-foreground">Availability is calculated for the pickup and return dates you choose.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild><Link href="/inventory/unavailable"><AlertTriangle className="mr-2 h-4 w-4" />Damaged / missing</Link></Button>
          <Button variant="outline" asChild><Link href="/inventory/transfers"><ArrowLeftRight className="mr-2 h-4 w-4" />Transfers</Link></Button>
          <Button variant="outline" asChild><Link href="/inventory/stocktakes"><ClipboardCheck className="mr-2 h-4 w-4" />Stocktakes</Link></Button>
          <CsvImportDialog />
          <Button asChild className="h-10 px-4"><Link href="/inventory/new"><Plus className="mr-2 h-4 w-4" />Add item</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Products', value: count ?? items.length, icon: Package, tone: 'text-indigo-600 bg-indigo-500/10' },
          { label: 'Physical units', value: physicalUnits, icon: PackageCheck, tone: 'text-emerald-600 bg-emerald-500/10' },
          { label: 'Sizes', value: items.reduce((sum, item) => sum + (item.item_variants?.length ?? 0), 0), icon: PackageOpen, tone: 'text-blue-600 bg-blue-500/10' },
          { label: 'Archived', value: 0, icon: Archive, tone: 'text-slate-600 bg-slate-500/10' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="flex items-center gap-3 rounded-[1.5rem] bg-card p-4 shadow-sm">
            <span className={`grid h-10 w-10 place-items-center rounded-2xl ${tone}`}><Icon className="h-4 w-4" /></span>
            <div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
          </div>
        ))}
      </div>

      <InventoryList initialItems={items} businessId={staff.business_id} branchId={staff.branch_id} />
    </div>
  )
}
