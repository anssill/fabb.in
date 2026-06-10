'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Search, Package, Plus, Minus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import type { BookingItem, BookingDates } from '../page'
import { resolveRentalDays } from '@/lib/booking-utils'

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
    price_override: number | null
  }[]
}

interface VariantOption {
  id: string
  item_id: string
  size: string
  colour?: string
  total_stock: number
  available_stock: number
  price: number
}

export function ItemsStep({ items, setItems, dates, bufferDays = 1, enforceStockLimit = false }: Props) {
  const { staff, activeBranch } = useAppStore()
  const branchId = activeBranch?.id || staff?.branch_id
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)

  // Real-time stock states
  const [variantTotalStockOverrides, setVariantTotalStockOverrides] = useState<Record<string, number>>({})
  const [variantOptionOverrides, setVariantOptionOverrides] = useState<Record<string, VariantOption[]>>({})

  const availabilityQuery = useQuery({
    queryKey: ['booking-item-availability', staff?.business_id, branchId, dates.pickup_date, dates.return_date, bufferDays],
    enabled: Boolean(staff?.business_id && branchId && dates.pickup_date && dates.return_date),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const supabase = createClient()
      const pickupDateObj = new Date(dates.pickup_date)
      pickupDateObj.setDate(pickupDateObj.getDate() - bufferDays)
      const pickupMinus1 = pickupDateObj.toISOString().slice(0, 10)

      const { data, error } = await supabase
        .from('booking_items')
        .select('item_variant_id, quantity, booking:bookings!inner(status, pickup_date, return_date)')
        .eq('booking.business_id', staff!.business_id)
        .eq('booking.branch_id', branchId!)
        .not('booking.status', 'in', '("cancelled","closed")')
        .lte('booking.pickup_date', dates.return_date)
        .gte('booking.return_date', pickupMinus1)

      if (error) throw error

      const reserved: Record<string, number> = {}
      data?.forEach((row: any) => {
        const bk = Array.isArray(row.booking) ? row.booking[0] : row.booking
        if (!bk) return

        const retDate = new Date(bk.return_date)
        retDate.setDate(retDate.getDate() + bufferDays)
        const activeReturnWithBuffer = retDate.toISOString().slice(0, 10)
        const overlaps = bk.pickup_date <= dates.return_date && dates.pickup_date <= activeReturnWithBuffer

        if (overlaps) {
          reserved[row.item_variant_id] = (reserved[row.item_variant_id] || 0) + (row.quantity || 1)
        }
      })

      return reserved
    },
  })

  const overlappingQuantities = availabilityQuery.data || {}

  useEffect(() => {
    if (availabilityQuery.error) {
      console.error('Failed to fetch calendar availability:', availabilityQuery.error)
      toast.error('Could not verify item availability. Using default stock levels.')
    }
  }, [availabilityQuery.error])

  const searchQueryTrimmed = searchQuery.trim()
  const itemsQuery = useQuery({
    queryKey: ['booking-item-search', staff?.business_id, branchId, searchQueryTrimmed],
    enabled: Boolean(staff?.business_id && branchId),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const supabase = createClient()
      let dbQuery = supabase
        .from('items')
        .select('id, name, sku, category, price, cover_image_url, item_variants(id, size, colour, total_stock, available_stock, price_override)')
        .eq('business_id', staff!.business_id)
        .eq('branch_id', branchId!)
        .eq('is_active', true)
        .limit(10)

      if (searchQueryTrimmed.length >= 1) {
        dbQuery = dbQuery.or(`name.ilike.%${searchQueryTrimmed}%,sku.ilike.%${searchQueryTrimmed}%`)
      }

      const { data, error } = await dbQuery.order('name', { ascending: true })
      if (error) throw error

      return (((data as SearchResult[]) || [])
        .map((item) => ({
          ...item,
          item_variants: (item.item_variants || []).filter((v) => Number(v.available_stock || 0) > 0),
        }))
        .filter((item) => item.item_variants.length > 0))
    },
  })

  useEffect(() => {
    if (itemsQuery.error) {
      console.error('Items search failed:', itemsQuery.error)
      toast.error('Could not load items. Please refresh and try again.')
    }
  }, [itemsQuery.error])

  const results = itemsQuery.data || []
  const searching = itemsQuery.isFetching
  const checkingAvailability = availabilityQuery.isFetching
  const rentalDays = dates.pickup_date && dates.return_date
    ? resolveRentalDays(dates.pickup_date, dates.return_date, dates.rental_days_override)
    : 1
  const selectedQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const selectedDaySubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const selectedBookingSubtotal = selectedDaySubtotal * rentalDays

  const resultVariantTotalStocks = useMemo(() => {
    const next: Record<string, number> = {}
    results.forEach(item => {
      item.item_variants.forEach(v => {
        next[v.id] = v.total_stock
      })
    })
    return next
  }, [results])

  const resultVariantOptions = useMemo(() => {
    const next: Record<string, VariantOption[]> = {}
    results.forEach(item => {
      next[item.id] = item.item_variants.map(v => ({
        id: v.id,
        item_id: item.id,
        size: v.size,
        colour: v.colour || undefined,
        total_stock: v.total_stock,
        available_stock: v.available_stock,
        price: Number(v.price_override ?? item.price),
      }))
    })
    return next
  }, [results])

  const baseVariantTotalStocks = useMemo(() => ({ ...resultVariantTotalStocks, ...variantTotalStockOverrides }), [resultVariantTotalStocks, variantTotalStockOverrides])
  const baseVariantOptions = useMemo(() => ({ ...resultVariantOptions, ...variantOptionOverrides }), [resultVariantOptions, variantOptionOverrides])

  const missingIds = useMemo(() => items
    .map(i => i.variant_id)
    .filter(id => baseVariantTotalStocks[id] === undefined), [items, baseVariantTotalStocks])
  const missingItemIds = useMemo(() => Array.from(new Set(
    items
      .map(i => i.item_id)
      .filter(itemId => !baseVariantOptions[itemId])
  )), [items, baseVariantOptions])

  const missingVariantDetailsQuery = useQuery({
    queryKey: ['booking-missing-variant-details', missingIds, missingItemIds],
    enabled: missingIds.length > 0 || missingItemIds.length > 0,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const supabase = createClient()
      const [stocksResult, optionsResult] = await Promise.all([
        missingIds.length > 0
          ? supabase.from('item_variants').select('id, total_stock').in('id', missingIds)
          : Promise.resolve({ data: [], error: null }),
        missingItemIds.length > 0
          ? supabase
              .from('item_variants')
              .select('id, item_id, size, colour, total_stock, available_stock, price_override')
              .in('item_id', missingItemIds)
              .gt('total_stock', 0)
          : Promise.resolve({ data: [], error: null }),
      ])

      if (stocksResult.error) throw stocksResult.error
      if (optionsResult.error) throw optionsResult.error

      return { stocks: stocksResult.data || [], options: optionsResult.data || [] }
    },
  })

  const missingVariantTotalStocks = useMemo(() => {
    const next: Record<string, number> = {}
    missingVariantDetailsQuery.data?.stocks.forEach((v: any) => {
      next[v.id] = v.total_stock
    })
    return next
  }, [missingVariantDetailsQuery.data])

  const missingVariantOptions = useMemo(() => {
    const next: Record<string, VariantOption[]> = {}
    const options = missingVariantDetailsQuery.data?.options || []
    missingItemIds.forEach(itemId => {
      const currentItem = items.find(item => item.item_id === itemId)
      next[itemId] = options
        .filter((v: any) => v.item_id === itemId)
        .map((v: any) => ({
          id: v.id,
          item_id: v.item_id,
          size: v.size,
          colour: v.colour || undefined,
          total_stock: v.total_stock,
          available_stock: v.available_stock,
          price: Number(v.price_override ?? currentItem?.price ?? 0),
        }))
    })
    return next
  }, [missingVariantDetailsQuery.data, missingItemIds, items])


  const variantTotalStocks = useMemo(() => ({ ...baseVariantTotalStocks, ...missingVariantTotalStocks }), [baseVariantTotalStocks, missingVariantTotalStocks])
  const variantOptions = useMemo(() => ({ ...baseVariantOptions, ...missingVariantOptions }), [baseVariantOptions, missingVariantOptions])

  useEffect(() => {
    if (missingVariantDetailsQuery.error) {
      console.error('Failed to fetch missing variant details:', missingVariantDetailsQuery.error)
    }
  }, [missingVariantDetailsQuery.error])

  const handleSearch = () => {
    void itemsQuery.refetch()
  }

  const addItem = (item: SearchResult, variant: SearchResult['item_variants'][0]) => {
    const exists = items.find((i) => i.variant_id === variant.id)
    if (exists) {
      toast.warning('This variant is already added')
      return
    }

    const calendarAvailable = variant.total_stock - (overlappingQuantities[variant.id] || 0)
    const dynamicAvailable = Math.min(variant.available_stock, calendarAvailable)
    if (dynamicAvailable <= 0) {
      toast.error('This size has no stock available right now.')
      return
    }

    setVariantTotalStockOverrides(prev => ({ ...prev, [variant.id]: variant.total_stock }))

    setItems([
      ...items,
      {
        item_id: item.id,
        variant_id: variant.id,
        name: item.name,
        sku: item.sku || undefined,
        size: variant.size,
        colour: variant.colour || undefined,
        price: Number(variant.price_override ?? item.price),
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
      const availableStockVal = Object.values(variantOptions)
        .flat()
        .find((variant) => variant.id === variantId)?.available_stock ?? 999
      const dynamicAvailable = Math.min(availableStockVal, totalStockVal - reservedVal)

      if (selectedItem.quantity + delta > dynamicAvailable) {
        toast.error(`Only ${Math.max(0, dynamicAvailable)} unit${dynamicAvailable === 1 ? '' : 's'} available for this size.`)
        return
      }
    }

    setItems(
      items.map((i) =>
        i.variant_id === variantId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
      )
    )
  }

  const updateItemVariant = (item: BookingItem, nextVariantId: string) => {
    if (nextVariantId === item.variant_id) return

    const nextVariant = variantOptions[item.item_id]?.find((variant) => variant.id === nextVariantId)
    if (!nextVariant) return

    if (items.some((selected) => selected.variant_id === nextVariantId)) {
      toast.warning('This size is already selected for this booking')
      return
    }

    const dynamicAvailable = Math.min(
      nextVariant.available_stock,
      nextVariant.total_stock - (overlappingQuantities[nextVariantId] || 0)
    )
    if (item.quantity > dynamicAvailable) {
      toast.error(`Only ${Math.max(0, dynamicAvailable)} unit${dynamicAvailable === 1 ? '' : 's'} available for this size.`)
      return
    }

    setVariantTotalStockOverrides(prev => ({ ...prev, [nextVariant.id]: nextVariant.total_stock }))
    setItems(
      items.map((selected) =>
        selected.variant_id === item.variant_id
          ? {
              ...selected,
              variant_id: nextVariant.id,
              size: nextVariant.size,
              colour: nextVariant.colour,
              price: nextVariant.price,
            }
          : selected
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
                if (next.trim().length === 0) void itemsQuery.refetch()
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
                  <Button
                    type="button"
                    size="sm"
                    variant={expandedItemId === item.id ? 'secondary' : 'default'}
                    className="h-8 shrink-0 px-3 text-xs font-semibold"
                    onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                  >
                    {expandedItemId === item.id ? 'Hide sizes' : 'Select'}
                  </Button>
                </div>

                {expandedItemId === item.id && (
                <div className="space-y-2 border-t border-border/60 pt-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Available Sizes & Stock</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {item.item_variants
                      ?.map((v) => {
                        const isAdded = items.some((i) => i.variant_id === v.id)
                        const calendarAvailable = v.total_stock - (overlappingQuantities[v.id] || 0)
                        const dynamicAvailable = Math.min(v.available_stock, calendarAvailable)
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
                                {isOut ? 'No stock available' : `${dynamicAvailable} ${dynamicAvailable === 1 ? 'unit' : 'units'} left`}
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
                              disabled={isAdded || isOut}
                            >
                              {isAdded ? 'Selected' : isOut ? 'No stock' : 'Select'}
                            </Button>
                          </div>
                        )
                      })}
                    {(!item.item_variants || item.item_variants.length === 0) && (
                      <span className="text-xs text-destructive font-medium col-span-full">No variants found</span>
                    )}
                  </div>
                </div>
                )}
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
                className="grid grid-cols-[1fr_auto] gap-3 rounded-xl border border-border bg-muted/40 p-3 text-foreground transition-all hover:bg-muted/60 sm:grid-cols-[1fr_150px_112px_36px] sm:items-center"
              >
                <div className="min-w-0">
                  <div>
                    <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="sr-only">
                      {item.size}{item.colour ? ` · ${item.colour}` : ''} · ₹{item.price}/day
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">₹{item.price}/day</p>
                </div>
                <Select
                  value={item.variant_id}
                  onValueChange={(variantId) => updateItemVariant(item, variantId)}
                >
                  <SelectTrigger className="h-8 w-full bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(variantOptions[item.item_id] || [{
                      id: item.variant_id,
                      item_id: item.item_id,
                      size: item.size,
                      colour: item.colour,
                      total_stock: variantTotalStocks[item.variant_id] ?? item.quantity,
                      available_stock: item.quantity,
                      price: item.price,
                    }]).map((variant) => (
                      <SelectItem key={variant.id} value={variant.id}>
                        {variant.size}{variant.colour ? ` · ${variant.colour}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex h-8 items-center rounded-full border border-border bg-background">
                  <Button variant="outline" size="sm" className="w-7 h-7 p-0 border-border" onClick={() => updateQuantity(item.variant_id, -1)}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="text-sm font-medium w-6 text-center text-foreground">{item.quantity}</span>
                  <Button variant="outline" size="sm" className="w-7 h-7 p-0 border-border" onClick={() => updateQuantity(item.variant_id, 1)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="col-start-2 row-start-1 h-8 w-8 justify-self-end p-0 text-red-500 hover:bg-red-500/10 hover:text-red-600 sm:col-start-auto sm:row-start-auto"
                  onClick={() => removeItem(item.variant_id)}
                  aria-label={`Remove ${item.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <div className="sticky bottom-0 rounded-xl border border-border bg-background/95 p-3 shadow-sm backdrop-blur">
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Items</p>
                  <p className="font-bold text-foreground">{items.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total qty</p>
                  <p className="font-bold text-foreground">{selectedQuantity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Subtotal/day</p>
                  <p className="font-bold text-foreground">₹{selectedDaySubtotal.toLocaleString('en-IN')}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Booking subtotal ({rentalDays} day{rentalDays !== 1 ? 's' : ''})</span>
                <span className="text-base font-bold text-foreground">₹{selectedBookingSubtotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="hidden text-right pt-1">
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
