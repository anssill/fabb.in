import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus, Package, Layers, Waves, ShieldAlert, PackageSearch } from 'lucide-react'
import Link from 'next/link'
import { InventoryList } from './components/InventoryList'
import { QualityAuditTable } from './components/QualityAuditTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { SyncInventoryButton } from './components/SyncInventoryButton'
import { CsvImportDialog } from './components/CsvImportDialog'

export default async function InventoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: staff } = await supabase.from('staff').select('business_id, branch_id').eq('id', user.id).single()
  if (!staff) return null

  const { data: items, count } = await supabase
    .from('items')
    .select(`
      id, name, sku, category, cover_image_url, price, deposit_amount,
      condition, condition_notes, status, total_rentals, is_active, storage_location,
      completeness_score, last_rented_at,
      item_variants(id, size, colour, total_stock, available_stock, reserved_stock)
    `, { count: 'exact' })
    .eq('business_id', staff.business_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const allItems = items || []
  const totalItems = count ?? 0
  const availableItems = allItems.filter(i => i.status === 'available').length
  const onRentItems = allItems.filter(i => {
    const reserved = ((i.item_variants || []) as any[]).reduce((s: number, v: any) => s + (v.reserved_stock ?? 0), 0)
    return reserved > 0
  }).length
  const inWashingItems = allItems.filter(i => i.status === 'in_washing').length
  const auditItems = allItems.filter(i => ['fair', 'poor'].includes(i.condition))

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.65rem] font-semibold tracking-normal text-slate-950">Inventory</h1>
          <p className="text-sm text-slate-500">Manage your rental assets and live availability</p>
        </div>
        <div className="flex items-center gap-2">
          <SyncInventoryButton />
          <CsvImportDialog />
          <Button className="h-10 px-4" asChild>
            <Link href="/inventory/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Link>
          </Button>
        </div>
      </div>


      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Items', value: totalItems, icon: Package, color: 'text-[#4f46e5] bg-indigo-50' },
          { label: 'Available', value: availableItems, icon: Layers, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20' },
          { label: 'On Rent', value: onRentItems, icon: PackageSearch, color: 'text-blue-600 bg-blue-50' },
          { label: 'In Washing', value: inWashingItems, icon: Waves, color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-3 rounded-[1.65rem] bg-white p-4 shadow-sm">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            <PackageSearch className="w-4 h-4 mr-2" />
            All Items ({totalItems})
          </TabsTrigger>
          <TabsTrigger value="audit">
            <ShieldAlert className="w-4 h-4 mr-2" />
            Quality Audit ({auditItems.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <InventoryList initialItems={allItems} />
        </TabsContent>
        <TabsContent value="audit">
          <QualityAuditTable auditItems={auditItems} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
