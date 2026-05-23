'use client'

import { useEffect, useState } from 'react'
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Search, Package, Plus, Minus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import type { BookingItem, BookingDates } from '../page'

interface Props {
  items: BookingItem[]
  setItems: (items: BookingItem[]) => void
  dates: BookingDates
  bufferDays?: number
  enforceStockLimit?: boolean
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
    total_stock: number
    available_stock: number
  }[]
}

export function ItemsStep({ items, setItems, dates, bufferDays = 1, enforceStockLimit = false }: Props) {
  const { staff } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)

  // Real-time stock states
  const [overlappingQuantities, setOverlappingQuantities] = useState<Record<string, number>>({})
  const [variantTotalStocks, setVariantTotalStocks] = useState<Record<string, number>>({})
  const [checkingAvailability, setCheckingAvailability] = useState(false)

  // Fetch overlapping booking quantities for selected dates
  const fetchAvailability = async () => {
    if (!staff?.business_id || !dates.pickup_date || !dates.return_date) return
    setCheckingAvailability(true)
    try {
      const supabase = createClient()
      
      // Calculate pickup_date minus configured turnover buffer
      const pickupDateObj = new Date(dates.pickup_date)
      pickupDateObj.setDate(pickupDateObj.getDate() - bufferDays)
      const pickupMinus1 = pickupDateObj.toISOString().slice(0, 10)

      const { data, error } = await supabase
        .from('booking_items')
        .select('item_variant_id, quantity, booking:bookings!inner(status, pickup_date, return_date)')
        .eq('booking.business_id', staff.business_id)
        .not('booking.status', 'in', '("cancelled","closed")')
        .lte('booking.pickup_date', dates.return_date)
        .gte('booking.return_date', pickupMinus1)

      if (error) throw error

      const reserved: Record<string, number> = {}
      data?.forEach((row: any) => {
        const bk = Array.isArray(row.booking) ? row.booking[0] : row.booking
        if (!bk) return

        const activePickup = bk.pickup_date
        const activeReturn = bk.return_date
        
        // Parse return date and add configured buffer
        const retDate = new Date(activeReturn)
        retDate.setDate(retDate.getDate() + bufferDays)
        const activeReturnWithBuffer = retDate.toISOString().slice(0, 10)

        // Check if [activePickup, activeReturnWithBuffer] overlaps with [dates.pickup_date, dates.return_date]
        const overlaps = activePickup <= dates.return_date && dates.pickup_date <= activeReturnWithBuffer
        
        if (overlaps) {
          reserved[row.item_variant_id] = (reserved[row.item_variant_id] || 0) + (row.quantity || 1)
        }
      })

      setOverlappingQuantities(reserved)
    } catch (err) {
      console.error('Failed to fetch calendar availability:', err)
      toast.error('Could not verify item availability. Using default stock levels.')
    } finally {
      setCheckingAvailability(false)
    }
  }

  useEffect(() => {
    fetchAvailability()
    }, [dates.pickup_date, dates.return_date, staff?.business_id, bufferDays])

  // Synchronize variantTotalStocks when results change
  useEffect(() => {
    setVariantTotalStocks(prev => {
      const next = { ...prev }
      let changed = false
      results.forEach(item => {
        item.item_variants.forEach(v => {
          if (next[v.id] !== v.total_stock) {
            next[v.id] = v.total_stock
            changed = true
          }
        })
      })
      return changed ? next : prev
    })
  }, [results])

  // Synchronize missing stocks for items restored from drafts
  useEffect(() => {
    const missingIds = items
      .map(i => i.variant_id)
      .filter(id => variantTotalStocks[id] === undefined)

    if (missingIds.length === 0) return

    const fetchMissingTotalStocks = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('item_variants')
          .select('id, total_stock')
          .in('id', missingIds)
        
        if (error) throw error
        
        setVariantTotalStocks(prev => {
          const next = { ...prev }
          data?.forEach(v => {
            next[v.id] = v.total_stock
          })
          return next
        })
      } catch (err) {
        console.error('Failed to fetch missing total stocks:', err)
      }
    }

    fetchMissingTotalStocks()
  }, [items, variantTotalStocks])

  const handleSearch = async (rawQuery?: string) => {
    if (!staff?.business_id) return
    const query = (rawQuery ?? searchQuery).trim()
    setSearching(true)
    try {
      const supabase = createClient()
      let dbQuery = supabase
        .from('items')
        .select('id, name, sku, category, price, cover_image_url, item_variants(id, size, colour, total_stock, available_stock)')
        .eq('business_id', staff.business_id)
        .eq('is_active', true)
        .limit(10)

      if (query.length >= 1) {
        dbQuery = dbQuery.or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
      }

      const { data, error } = await dbQuery.order('name', { ascending: true })
      if (error) throw error

      const normalized = ((data as SearchResult[]) || [])
        .map((item) => ({
          ...item,
          item_variants: (item.item_variants || []).filter((v) => Number((v as any).total_stock || 0) > 0),
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

  useEffect(() => {
    if (!staff?.business_id) return
    if (searchQuery.trim().length === 0) return

    const delayDebounce = setTimeout(() => {
      handleSearch(searchQuery)
    }, 250)

    return () => clearTimeout(delayDebounce)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, staff?.business_id])

  const addItem = (item: SearchResult, variant: SearchResult['item_variants'][0]) => {
    const exists = items.find((i) => i.variant_id === variant.id)
    if (exists) {
      toast.warning('This variant is already added')
      return
    }

    const dynamicAvailable = variant.total_stock - (overlappingQuantities[variant.id] || 0)
    if (dynamicAvailable <= 0) {
      if (enforceStockLimit) {
        toast.error('This variant is already booked for the selected dates.')
        return
      }
      toast.warning('Booking Conflict: This variant is already booked for the selected dates!', {
        description: 'Allowed as override. Please verify availability manually.',
      })
    }

    setVariantTotalStocks(prev => ({ ...prev, [variant.id]: variant.total_stock }))

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
    const selectedItem = items.find((i) => i.variant_id === variantId)
    if (!selectedItem) return

    if (delta > 0) {
      const totalStockVal = variantTotalStocks[variantId] ?? 999
      const reservedVal = overlappingQuantities[variantId] || 0
      const dynamicAvailable = totalStockVal - reservedVal

      if (selectedItem.quantity + delta > dynamicAvailable) {
        if (enforceStockLimit) {
          toast.error(`Only ${Math.max(0, dynamicAvailable)} unit${dynamicAvailable === 1 ? '' : 's'} available for these dates.`)
          return
        }
        toast.warning(`Conflict: Quantity exceeds available stock (${dynamicAvailable} available) for these dates.`, {
          description: 'Override allowed. Please verify manually.',
        })
      }
    }

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
          <Package className="w-5 h-5 text-primary" />
          Select Items
        </CardTitle>
        <CardDescription>Search and add items to this booking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
          <div className="text-center py-4 text-sm text-muted-foreground border border-border rounded-lg bg-muted/20">
            No available items found
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3 max-h-[380px] overflow-y-auto border border-border rounded-xl p-3 bg-muted/10">
            {results.map((item) => (
              <div key={item.id} className="border border-border rounded-xl p-3.5 bg-background shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                    {item.cover_image_url ? (
                      <img src={item.cover_image_url} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Package className="w-6 h-6 text-muted-foreground/60" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category} · ₹{item.price}/day</p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-border/60 pt-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Available Sizes & Stock</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {item.item_variants
                      ?.map((v) => {
                        const isAdded = items.some((i) => i.variant_id === v.id)
                        const dynamicAvailable = v.total_stock - (overlappingQuantities[v.id] || 0)
                        const isLowStock = dynamicAvailable <= 2 && dynamicAvailable > 0
                        const isOut = dynamicAvailable <= 0
                        return (
                          <div 
                            key={v.id} 
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                              isAdded 
                                ? 'bg-muted/50 border-muted text-muted-foreground' 
                                : isOut
                                  ? 'bg-amber-500/10 border-amber-500/30 text-foreground'
                                  : 'bg-card border-border hover:border-primary/50 text-foreground shadow-sm'
                            }`}
                          >
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded text-[10px]">
                                  {v.size}
                                </span>
                                {v.colour && (
                                  <span className="text-[11px] text-muted-foreground truncate max-w-[80px]" title={v.colour}>
                                    {v.colour}
                                  </span>
                                )}
                              </div>
                              <span className={`text-[10px] font-medium ${
                                isOut 
                                  ? 'text-amber-600 dark:text-amber-400 font-semibold' 
                                  : isLowStock 
                                    ? 'text-amber-600 dark:text-amber-400' 
                                    : 'text-emerald-600 dark:text-emerald-400'
                              }`}>
                                {isOut ? '⚠️ Already booked (Conflict alert)' : `${dynamicAvailable} ${dynamicAvailable === 1 ? 'unit' : 'units'} left`}
                              </span>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant={isAdded ? "secondary" : isOut ? "outline" : "default"}
                              className={`h-7 px-2.5 text-[10px] font-semibold ${
                                isOut && !isAdded ? 'border-amber-500/50 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400' : ''
                              }`}
                              onClick={() => addItem(item, v)}
                              disabled={isAdded}
                            >
                              {isAdded ? 'Selected' : isOut ? 'Select Anyway' : 'Select'}
                            </Button>
                          </div>
                        )
                      })}
                    {(!item.item_variants || item.item_variants.length === 0) && (
                      <span className="text-xs text-destructive font-medium col-span-full">No variants found</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Items */}
        {items.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-sm font-semibold text-foreground">Selected Items ({items.length})</p>
            {items.map((item) => (
              <div
                key={item.variant_id}
                className="flex items-center justify-between p-3 bg-muted/40 border border-border text-foreground rounded-xl transition-all hover:bg-muted/60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-muted border border-border flex items-center justify-center shrink-0">
                    {item.cover_image_url ? (
                      <img src={item.cover_image_url} alt={item.name} className="w-full h-full object-cover rounded" />
                    ) : (
                      <Package className="w-5 h-5 text-muted-foreground/60" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.size}{item.colour ? ` · ${item.colour}` : ''} · ₹{item.price}/day
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="w-7 h-7 p-0 border-border" onClick={() => updateQuantity(item.variant_id, -1)}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="text-sm font-medium w-6 text-center text-foreground">{item.quantity}</span>
                  <Button variant="outline" size="sm" className="w-7 h-7 p-0 border-border" onClick={() => updateQuantity(item.variant_id, 1)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="w-7 h-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => removeItem(item.variant_id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="text-right pt-1">
              <p className="text-sm text-muted-foreground">
                Subtotal: <span className="font-bold text-foreground">₹{items.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString('en-IN')}</span>/day
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </>
  )
}

