'use client'

import { useEffect, useState } from 'react'
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Search, Package, Plus, Minus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import type { BookingItem } from '../page'

interface Props {
  items: BookingItem[]
  setItems: (items: BookingItem[]) => void
}

interface SearchResult {
  id: string
  name: string
  sku: string | null
  category: string
  price: number
  cover_image_url: string | null
  item_variants: {
    id: string
    size: string
    colour: string | null
    available_stock: number
  }[]
}

export function ItemsStep({ items, setItems }: Props) {
  const { staff } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)

  const handleSearch = async (rawQuery?: string) => {
    if (!staff?.business_id) return
    const query = (rawQuery ?? searchQuery).trim()
    setSearching(true)
    try {
      const supabase = createClient()
      let dbQuery = supabase
        .from('items')
        .select('id, name, sku, category, price, cover_image_url, item_variants(id, size, colour, available_stock)')
        .eq('business_id', staff.business_id)
        .eq('is_active', true)
        .limit(10)

      if (query.length >= 2) {
        dbQuery = dbQuery.or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
      }

      const { data, error } = await dbQuery
      if (error) throw error

      const normalized = ((data as SearchResult[]) || [])
        .map((item) => ({
          ...item,
          item_variants: (item.item_variants || []).filter((v) => Number((v as any).available_stock || 0) > 0),
        }))
        .filter((item) => item.item_variants.length > 0)

      setResults(normalized)
    } catch (error) {
      console.error('Items search failed:', error)
      toast.error('Could not load items. Please refresh and try again.')
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    if (!staff?.business_id) return
    handleSearch('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff?.business_id])

  const addItem = (item: SearchResult, variant: SearchResult['item_variants'][0]) => {
    const exists = items.find((i) => i.variant_id === variant.id)
    if (exists) {
      toast.warning('This variant is already added')
      return
    }
    setItems([
      ...items,
      {
        item_id: item.id,
        variant_id: variant.id,
        name: item.name,
        sku: item.sku || undefined,
        size: variant.size,
        colour: variant.colour || undefined,
        price: item.price,
        quantity: 1,
        cover_image_url: item.cover_image_url,
      },
    ])
  }

  const updateQuantity = (variantId: string, delta: number) => {
    setItems(
      items.map((i) =>
        i.variant_id === variantId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
      )
    )
  }

  const removeItem = (variantId: string) => {
    setItems(items.filter((i) => i.variant_id !== variantId))
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          Select Items
        </CardTitle>
        <CardDescription>Search and add items to this booking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search items by name or SKU..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => {
                const next = e.target.value
                setSearchQuery(next)
                if (next.trim().length === 0) handleSearch('')
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button variant="outline" onClick={() => handleSearch()} disabled={searching}>
            Search
          </Button>
        </div>

        {/* Search Results */}
        {!searching && results.length === 0 && (
          <div className="text-center py-4 text-sm text-slate-500 border rounded-lg">
            No available items found
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
            {results.map((item) => (
              <div key={item.id} className="border rounded-md p-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center shrink-0">
                    {item.cover_image_url ? (
                      <img src={item.cover_image_url} alt={item.name} className="w-full h-full object-cover rounded" />
                    ) : (
                      <Package className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.category} · ₹{item.price}/day</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.item_variants
                    ?.filter((v) => (v as any).available_stock > 0)
                    .map((v) => (
                      <Button
                        key={v.id}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => addItem(item, v)}
                        disabled={items.some((i) => i.variant_id === v.id)}
                      >
                        {v.size}{v.colour ? ` · ${v.colour}` : ''} ({(v as any).available_stock})
                      </Button>
                    ))}
                  {(!item.item_variants || item.item_variants.every((v) => (v as any).available_stock <= 0)) && (
                    <span className="text-xs text-red-500">Out of stock</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Items */}
        {items.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Selected Items ({items.length})</p>
            {items.map((item) => (
              <div
                key={item.variant_id}
                className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-white flex items-center justify-center shrink-0">
                    {item.cover_image_url ? (
                      <img src={item.cover_image_url} alt={item.name} className="w-full h-full object-cover rounded" />
                    ) : (
                      <Package className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.size}{item.colour ? ` · ${item.colour}` : ''} · ₹{item.price}/day
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="w-7 h-7 p-0" onClick={() => updateQuantity(item.variant_id, -1)}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                  <Button variant="outline" size="sm" className="w-7 h-7 p-0" onClick={() => updateQuantity(item.variant_id, 1)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="w-7 h-7 p-0 text-red-500" onClick={() => removeItem(item.variant_id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="text-right">
              <p className="text-sm text-slate-500">
                Subtotal: <span className="font-semibold text-slate-900">₹{items.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString('en-IN')}</span>/day
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </>
  )
}

