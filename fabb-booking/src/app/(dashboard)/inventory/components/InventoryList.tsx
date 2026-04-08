'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Package, QrCode, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { QRScanner } from '@/components/shared/QRScanner'

const CONDITION_COLORS: Record<string, string> = {
  excellent: 'bg-green-100 text-green-700',
  good: 'bg-blue-100 text-blue-700',
  fair: 'bg-amber-100 text-amber-700',
  poor: 'bg-red-100 text-red-700',
}

interface InventoryListProps {
  initialItems: any[]
}

export function InventoryList({ initialItems }: InventoryListProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const router = useRouter()

  const categories = useMemo(() => {
    const cats = new Set(initialItems.map(item => item.category))
    return Array.from(cats).sort()
  }, [initialItems])

  const filteredItems = useMemo(() => {
    return initialItems.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(search.toLowerCase()))
      
      const matchesCategory = !selectedCategory || item.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [search, selectedCategory, initialItems])

  const handleScanSuccess = (decodedText: string) => {
    setIsScannerOpen(false)
    // Try to find an item with this SKU or ID
    const foundItem = initialItems.find(item => 
      item.sku === decodedText || item.id === decodedText
    )
    if (foundItem) {
      router.push(`/inventory/${foundItem.id}`)
    } else {
      alert(`No item found with SKU: ${decodedText}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search items by name, SKU..." 
                className="pl-10 h-10 border-slate-200 focus:ring-blue-500 rounded-lg"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="h-10 border-slate-200 hover:bg-slate-50 relative group"
                onClick={() => setIsScannerOpen(true)}
              >
                <QrCode className="w-4 h-4 mr-2 text-blue-600" />
                Scan to Find
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              </Button>
              <select 
                className="h-10 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scanner implementation */}
      <QRScanner 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        onScanError={(err: string) => console.log(err)}
      />

      {/* Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const totalStock = item.item_variants?.reduce((sum: number, v: any) => sum + v.total_stock, 0) ?? 0
            const availableStock = item.item_variants?.reduce((sum: number, v: any) => sum + v.available_stock, 0) ?? 0
            const sizes = item.item_variants?.map((v: any) => v.size).filter(Boolean).join(', ')

            return (
              <Link key={item.id} href={`/inventory/${item.id}`}>
                <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden border-none shadow-sm bg-white">
                  <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center relative overflow-hidden">
                    {item.cover_image_url ? (
                      <img 
                        src={item.cover_image_url} 
                        alt={item.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      />
                    ) : (
                      <Package className="w-12 h-12 text-slate-300" />
                    )}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      <Badge className={`text-[10px] uppercase font-bold px-2 py-0.5 border-none shadow-sm ${CONDITION_COLORS[item.condition] || 'bg-slate-100'}`}>
                        {item.condition}
                      </Badge>
                      {availableStock === 0 && (
                        <Badge variant="destructive" className="text-[10px] uppercase font-bold">
                          Out of Stock
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="min-w-0 mb-3">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">{item.category}</p>
                      <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{item.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">SKU: {item.sku || 'N/A'}</p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400">Daily Rate</span>
                        <span className="text-sm font-bold text-slate-900">₹{item.daily_rate}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-400">Availability</span>
                        <span className={`text-sm font-bold ${availableStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {availableStock}/{totalStock}
                        </span>
                      </div>
                    </div>

                    {sizes && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {sizes.split(', ').slice(0, 3).map((size: string) => (
                          <span key={size} className="text-[10px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded border border-slate-100">
                            {size}
                          </span>
                        ))}
                        {sizes.split(', ').length > 3 && (
                          <span className="text-[10px] text-slate-400 self-center">+{sizes.split(', ').length - 3}</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card className="border-dashed border-2 bg-slate-50/50">
          <CardContent className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No items found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
              We couldn't find any items matching your current filters. Try adjusting your search term or category.
            </p>
            {(search || selectedCategory) && (
              <Button 
                variant="link" 
                className="mt-2 text-blue-600 font-semibold"
                onClick={() => {
                  setSearch('')
                  setSelectedCategory(null)
                }}
              >
                Clear all filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
