import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus, ShieldAlert, PackageSearch } from 'lucide-react'
import Link from 'next/link'
import { InventoryList } from './components/InventoryList'
import { QualityAuditTable } from './components/QualityAuditTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function InventoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: staff } = await supabase.from('staff').select('business_id').eq('id', user.id).single()
  if (!staff) return null

  const { data: items, count } = await supabase
    .from('items')
    .select(`
      id, name, sku, category, cover_image_url, daily_rate, condition, condition_notes, status, total_rentals, is_active,
      item_variants(id, size, colour, total_stock, available_stock, reserved_stock)
    `, { count: 'exact' })
    .eq('business_id', staff.business_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const auditItems = (items || []).filter(i => ['fair', 'poor', 'damaged'].includes(i.condition))

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inventory</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage your rental assets and real-time availability.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white rounded-full border shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm font-bold text-slate-600">{count ?? 0} Items Active</span>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200" asChild>
            <Link href="/inventory/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-white border text-slate-500 p-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-sm">
            <PackageSearch className="w-4 h-4 mr-2" />
            All Items
          </TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 rounded-sm">
            <ShieldAlert className="w-4 h-4 mr-2" />
            Quality Audit ({auditItems.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="focus-visible:outline-none focus-visible:ring-0">
          <InventoryList initialItems={items || []} />
        </TabsContent>
        <TabsContent value="audit" className="focus-visible:outline-none focus-visible:ring-0">
          <QualityAuditTable auditItems={auditItems} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
