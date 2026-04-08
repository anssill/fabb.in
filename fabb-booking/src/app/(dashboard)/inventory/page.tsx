import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Search, Filter, Package, Grid3X3, List } from 'lucide-react'
import Link from 'next/link'

const CONDITION_COLORS: Record<string, string> = {
  excellent: 'bg-green-100 text-green-700',
  good: 'bg-blue-100 text-blue-700',
  fair: 'bg-amber-100 text-amber-700',
  poor: 'bg-red-100 text-red-700',
}

export default async function InventoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: staff } = await supabase.from('staff').select('business_id').eq('id', user.id).single()
  if (!staff) return null

  const { data: items, count } = await supabase
    .from('items')
    .select(`
      id, name, sku, category, cover_image_url, daily_rate, condition, status, total_rentals, is_active,
      item_variants(id, size, colour, total_stock, available_stock, reserved_stock)
    `, { count: 'exact' })
    .eq('business_id', staff.business_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Inventory</h1>
          <p className="text-sm text-slate-500">{count ?? 0} items</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" asChild>
          <Link href="/inventory/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search items by name, SKU..." className="pl-10 h-9" />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <div className="flex gap-1 border rounded-md">
              <Button variant="ghost" size="sm"><Grid3X3 className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm"><List className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Grid */}
      {items && items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => {
            const totalStock = item.item_variants?.reduce((sum: number, v: { total_stock: number }) => sum + v.total_stock, 0) ?? 0
            const availableStock = item.item_variants?.reduce((sum: number, v: { available_stock: number }) => sum + v.available_stock, 0) ?? 0
            const sizes = item.item_variants?.map((v: { size: string }) => v.size).join(', ') || 'No sizes'

            return (
              <Link key={item.id} href={`/inventory/${item.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
                  <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center">
                    {item.cover_image_url ? (
                      <img src={item.cover_image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-12 h-12 text-slate-300" />
                    )}
                  </div>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.category} · {item.sku || 'No SKU'}</p>
                      </div>
                      <Badge className={`text-xs shrink-0 ml-2 ${CONDITION_COLORS[item.condition] || ''}`}>
                        {item.condition}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-semibold text-slate-900">₹{item.daily_rate}/day</span>
                      <span className="text-xs text-slate-500">{availableStock}/{totalStock} avail.</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Sizes: {sizes}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-16">
            <Package className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900">No items yet</h3>
            <p className="text-sm text-slate-500 mt-1">Add your first inventory item to get started.</p>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700" asChild>
              <Link href="/inventory/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
