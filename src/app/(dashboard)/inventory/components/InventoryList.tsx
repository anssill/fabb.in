'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Package, QrCode, X, Calendar as CalendarIcon, Filter, Layers } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { QRScanner } from '@/components/shared/QRScanner'
import { createClient } from '@/lib/supabase/client'
import { format, addDays, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from '@/lib/utils'

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
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(),
    to: addDays(new Date(), 3)
  })
  const [bookings, setBookings] = useState<any[]>([])
  const [loadingBookings, setLoadingBookings] = useState(true)
  const router = useRouter()

  const categories = useMemo(() => {
    const cats = new Set(initialItems.map(item => item.category))
    return Array.from(cats).sort()
  }, [initialItems])

  // Fetch bookings for the selected range to calculate availability
  useEffect(() => {
    async function fetchRelevantBookings() {
      setLoadingBookings(true)
      const supabase = createClient()
      
      // We fetch bookings that overlap with the selected range
      // Include 1-day turnover buffer: return_date + 1
      const fromStr = format(dateRange.from, 'yyyy-MM-dd')
      const toStr = format(dateRange.to, 'yyyy-MM-dd')

      const { data } = await supabase
        .from('booking_items')
        .select(`
          quantity,
          variant_id,
          item_id,
          bookings!inner(pickup_date, return_date, status)
        `)
        .neq('bookings.status', 'cancelled')
        .lte('bookings.pickup_date', toStr)
        // Note: we use return_date < fromStr for overlap if no buffer
        // But with 1-day buffer, an item is busy until return_date + 1
        // So it overlaps if (return_date + 1) >= fromStr
      
      // More accurate overlap filtering in-memory for simplicity with buffer
      const filtered = (data || []).filter((bi: any) => {
        const pickup = bi.bookings.pickup_date
        const retDate = parseISO(bi.bookings.return_date)
        const returnWithBuffer = format(addDays(retDate, 1), 'yyyy-MM-dd')
        
        return pickup <= toStr && returnWithBuffer >= fromStr
      })

      setBookings(filtered)
      setLoadingBookings(false)
    }

    fetchRelevantBookings()
  }, [dateRange])

  // Dynamic Item Stats Calculation
  const itemsWithAvailability = useMemo(() => {
    return initialItems.map(item => {
      // For each variant, calculate min availability in range
      const variantsWithStock = (item.item_variants || []).map((v: any) => {
        let maxReserved = 0
        
        // Find max reserved on any single day in the selected range
        for (let d = new Date(dateRange.from); d <= dateRange.to; d = addDays(d, 1)) {
          const dayStr = format(d, 'yyyy-MM-dd')
          const reservedOnDay = bookings
            .filter(bk => bk.variant_id === v.id)
            .reduce((sum, bk) => {
              const pickup = bk.bookings.pickup_date
              const retDate = parseISO(bk.bookings.return_date)
              const returnWithBuffer = format(addDays(retDate, 1), 'yyyy-MM-dd')
              if (dayStr >= pickup && dayStr <= returnWithBuffer) return sum + (bk.quantity || 1)
              return sum
            }, 0)
          maxReserved = Math.max(maxReserved, reservedOnDay)
        }

        return {
          ...v,
          dynamic_available: Math.max(0, (v.total_stock || 0) - maxReserved)
        }
      })

      const totalStock = variantsWithStock.reduce((sum: number, v: any) => sum + (v.total_stock || 0), 0)
      const dynamicAvailable = variantsWithStock.reduce((sum: number, v: any) => sum + (v.dynamic_available || 0), 0)

      return {
        ...item,
        item_variants: variantsWithStock,
        total_stock: totalStock,
        dynamic_available: dynamicAvailable
      }
    })
  }, [initialItems, bookings, dateRange])

  const filteredItems = useMemo(() => {
    return itemsWithAvailability.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(search.toLowerCase()))
      
      const matchesCategory = !selectedCategory || item.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [search, selectedCategory, itemsWithAvailability])

  const handleScanSuccess = (decodedText: string) => {
    setIsScannerOpen(false)
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
          <div className="flex flex-col xl:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search items by name, SKU..." 
                className="pl-10 h-10 border-slate-200 focus:ring-blue-500 rounded-lg"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* Date Range Picker */}
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-10 justify-start text-left font-normal border-slate-200 min-w-[240px]",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange as any}
                      onSelect={(range: any) => {
                        if (range?.from && range?.to) {
                          setDateRange(range)
                        } else if (range?.from) {
                          setDateRange({ from: range.from, to: range.from })
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <select 
                className="h-10 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <Button 
                variant="outline" 
                className="h-10 border-slate-200 hover:bg-slate-50 relative group"
                onClick={() => setIsScannerOpen(true)}
              >
                <QrCode className="w-4 h-4 mr-2 text-blue-600" />
                Scan
              </Button>
            </div>
          </div>
          
          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" /> Available
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" /> Fully Booked
              </span>
              <span className="italic">* Showing availability for selected dates (inc. 1-day washing buffer)</span>
            </div>
            {loadingBookings && <span className="animate-pulse flex items-center gap-2"><Layers className="w-3 h-3 animate-spin" /> Updating availability...</span>}
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
            const totalStock = item.total_stock
            const availableStock = item.dynamic_available
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
                          Fully Booked
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
                        <span className="text-xs text-slate-400">Rental Price</span>
                        <span className="text-sm font-bold text-slate-900">₹{item.price}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-400">Availability</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-bold ${availableStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {availableStock} available
                          </span>
                          <span className="text-xs text-slate-300">of {totalStock}</span>
                        </div>
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
              We could not find any items matching your current filters for the selected dates.
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
