'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { createClient } from '@/lib/supabase/client'
import { safeJsonParse } from '@/lib/api-utils'
import { Check, Loader2, Minus, Package, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

interface BookingItemRow {
  id: string
  item_id: string
  item_variant_id: string
  item_name: string
  size: string
  quantity: number
  price: number
  rental_days: number
  subtotal: number
  cover_image_url?: string | null
}

interface ProductResult {
  id: string
  name: string
  sku: string | null
  category: string
  price: number
  cover_image_url: string | null
  item_variants: Array<{
    id: string
    size: string
    colour: string | null
    total_stock: number
    available_stock: number
    price_override: number | null
  }>
}

interface Props {
  bookingId: string
  status: string
  businessId: string
  branchId: string
  items: BookingItemRow[]
}

const ADD_ITEM_ID = '__add_item__'

export function BookingItemsEditor({ bookingId, status, businessId, branchId, items }: Props) {
  const router = useRouter()
  const canEdit = status === 'booked'
  const [editingId, setEditingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProductResult[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [draftVariantId, setDraftVariantId] = useState('')
  const [draftQuantity, setDraftQuantity] = useState(1)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const editingItem = useMemo(
    () => items.find((item) => item.id === editingId) || null,
    [editingId, items]
  )
  const isAddingItem = editingId === ADD_ITEM_ID

  const loadProducts = async (rawQuery = query) => {
    setLoading(true)
    try {
      const supabase = createClient()
      const cleaned = rawQuery.trim()
      let request = supabase
        .from('items')
        .select('id, name, sku, category, price, cover_image_url, item_variants(id, size, colour, total_stock, available_stock, price_override)')
        .eq('business_id', businessId)
        .eq('branch_id', branchId)
        .eq('is_active', true)
        .limit(8)

      if (editingItem && !isAddingItem) {
        request = request.eq('id', editingItem.item_id)
      } else if (cleaned.length > 0) {
        request = request.or(`name.ilike.%${cleaned}%,sku.ilike.%${cleaned}%`)
      }

      const { data, error } = await request.order('name', { ascending: true })
      if (error) throw error

      const normalized = ((data as ProductResult[]) || [])
        .map((product) => ({
          ...product,
          item_variants: (product.item_variants || []).filter((variant) =>
            variant.id === editingItem?.item_variant_id || Number(variant.available_stock || 0) > 0
          ),
        }))
        .filter((product) => product.item_variants.length > 0)

      if (editingItem && !normalized.some((product) => product.id === editingItem.item_id)) {
        const { data: currentProduct, error: currentErr } = await supabase
          .from('items')
          .select('id, name, sku, category, price, cover_image_url, item_variants(id, size, colour, total_stock, available_stock, price_override)')
          .eq('id', editingItem.item_id)
          .single()

        if (!currentErr && currentProduct) {
          const product = currentProduct as ProductResult
          normalized.unshift({
            ...product,
            item_variants: (product.item_variants || []).filter((variant) =>
              variant.id === editingItem.item_variant_id || Number(variant.available_stock || 0) > 0
            ),
          })
        }
      }

      setResults(normalized)
    } catch (error) {
      console.error('Booking item product search failed:', error)
      toast.error('Could not load products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!editingItem) return
    setQuery('')
    setSelectedProductId(editingItem.item_id)
    setDraftVariantId(editingItem.item_variant_id)
    setDraftQuantity(editingItem.quantity)
    loadProducts('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingItem?.id])

  useEffect(() => {
    if (!isAddingItem) return
    const timeout = setTimeout(() => loadProducts(query), 250)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, isAddingItem])

  useEffect(() => {
    if (!isAddingItem) return
    setQuery('')
    setSelectedProductId(null)
    setDraftVariantId('')
    setDraftQuantity(1)
    loadProducts('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddingItem])

  const selectedProduct = results.find((product) => product.id === selectedProductId)

  const saveEdit = async () => {
    if (!editingItem || !selectedProductId || !draftVariantId) return

    setSaving(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/items/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: selectedProductId,
          variant_id: draftVariantId,
          quantity: draftQuantity,
        }),
      })
      const data = await safeJsonParse(res)
      if (!res.ok) throw new Error(data.error || 'Could not update item')

      toast.success('Booking item updated')
      setEditingId(null)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Could not update item')
    } finally {
      setSaving(false)
    }
  }

  const saveAdd = async () => {
    if (!selectedProductId || !draftVariantId) return

    setSaving(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: selectedProductId,
          variant_id: draftVariantId,
          quantity: draftQuantity,
        }),
      })
      const data = await safeJsonParse(res)
      if (!res.ok) throw new Error(data.error || 'Could not add item')

      toast.success('Product added to booking')
      setEditingId(null)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Could not add item')
    } finally {
      setSaving(false)
    }
  }

  const cancelItem = async (itemId: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/items/${itemId}`, { method: 'DELETE' })
      const data = await safeJsonParse(res)
      if (!res.ok) throw new Error(data.error || 'Could not cancel item')

      toast.success('Item cancelled from booking')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Could not cancel item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {canEdit && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant={isAddingItem ? 'outline' : 'default'}
            size="sm"
            onClick={() => setEditingId(isAddingItem ? null : ADD_ITEM_ID)}
          >
            {isAddingItem ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {isAddingItem ? 'Close add product' : 'Add product'}
          </Button>
        </div>
      )}

      {isAddingItem && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product to add..."
              className="pl-9"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {results.map((product) => (
              <button
                key={product.id}
                type="button"
                className={`flex items-center justify-between rounded-lg border p-2 text-left text-sm transition-colors ${
                  selectedProductId === product.id ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white hover:border-blue-200'
                }`}
                onClick={() => {
                  setSelectedProductId(product.id)
                  setDraftVariantId(product.item_variants[0]?.id || '')
                }}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{product.name}</span>
                  <span className="block text-xs text-slate-500">{product.category} · ₹{product.price}/day</span>
                </span>
                {selectedProductId === product.id && <Check className="h-4 w-4 shrink-0" />}
              </button>
            ))}
            {loading && <p className="text-sm text-slate-400">Loading products...</p>}
          </div>

          {selectedProduct && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Choose size</p>
              <div className="flex flex-wrap gap-2">
                {selectedProduct.item_variants.map((variant) => (
                  <Button
                    key={variant.id}
                    type="button"
                    size="sm"
                    variant={draftVariantId === variant.id ? 'default' : 'outline'}
                    onClick={() => setDraftVariantId(variant.id)}
                  >
                    {variant.size}{variant.colour ? ` Â· ${variant.colour}` : ''}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="flex h-9 items-center rounded-full border border-slate-200 bg-white">
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => setDraftQuantity((qty) => Math.max(1, qty - 1))}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-9 text-center text-sm font-semibold">{draftQuantity}</span>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => setDraftQuantity((qty) => qty + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={saveAdd} disabled={saving || !draftVariantId}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add to booking
            </Button>
          </div>
        </div>
      )}

      {items.map((item) => (
        <div key={item.id} className="rounded-lg bg-slate-50 p-3">
          <div className="flex items-center gap-4">
            {item.cover_image_url ? (
              <img src={item.cover_image_url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-slate-300" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">{item.item_name}</p>
              <p className="text-xs text-slate-500">
                Size: {item.size} · Qty: {item.quantity} · ₹{item.price}/day × {item.rental_days} days
              </p>
            </div>
            <p className="text-sm font-bold text-slate-900 flex-shrink-0">₹{Number(item.subtotal).toLocaleString('en-IN')}</p>
            {canEdit && (
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setEditingId(editingId === item.id ? null : item.id)}>
                  {editingId === item.id ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                  {editingId === item.id ? 'Close' : 'Edit'}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                      Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel this item?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes only {item.item_name} ({item.size}) from the booking and releases its reserved stock.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={() => cancelItem(item.id)}>
                        Cancel item
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>

          {editingId === item.id && (
            <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-white p-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.item_name}</p>
                <p className="text-xs text-slate-500">Edit only this item&apos;s size and quantity. Use Add product for another product.</p>
              </div>


              {selectedProduct && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Choose size</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.item_variants.map((variant) => (
                      <Button
                        key={variant.id}
                        type="button"
                        size="sm"
                        variant={draftVariantId === variant.id ? 'default' : 'outline'}
                        onClick={() => setDraftVariantId(variant.id)}
                      >
                        {variant.size}{variant.colour ? ` · ${variant.colour}` : ''}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <div className="flex h-9 items-center rounded-full border border-slate-200 bg-white">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDraftQuantity((qty) => Math.max(1, qty - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-9 text-center text-sm font-semibold">{draftQuantity}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDraftQuantity((qty) => qty + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={saveEdit} disabled={saving || !draftVariantId}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}

      {!canEdit && (
        <p className="text-xs text-slate-500">Items can be changed only before pickup.</p>
      )}
    </div>
  )
}
