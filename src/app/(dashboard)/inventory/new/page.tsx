'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, Plus, Trash2, Loader2, Upload, Layers } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import Link from 'next/link'
import { createItem } from '../inventory-actions'
import { ImageUpload } from '../components/ImageUpload'
import { StorageService } from '@/lib/storage-service'

const CATEGORIES = ['Kurtha', 'Suits', 'Loafers', 'Shoes', 'Cap', 'Accessories', 'Sherwani', 'Lehenga', 'Saree', 'Jewellery']
const CONDITIONS = ['excellent', 'good', 'fair', 'poor']

const SIZE_PRESETS = {
  'Clothing': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'],
  'Numeric': ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46'],
  'Shoes': ['5', '6', '7', '8', '9', '10', '11', '12'],
}

interface Variant {
  size: string
  colour: string
  total_stock: number
  price_override: number | null
}

function SizePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">Size *</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="e.g. M / 40 / Free Size" />
      <div className="space-y-1">
        {Object.entries(SIZE_PRESETS).map(([group, sizes]) => (
          <div key={group} className="flex flex-wrap gap-1">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange(s)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                  value === s
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function NewItemPage() {
  const router = useRouter()
  const { staff } = useAppStore()
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [bulkSizes, setBulkSizes] = useState<string[]>([])
  const [showBulk, setShowBulk] = useState(false)

  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: 'Kurtha',
    description: '',
    storage_location: '',
    price: 0,
    deposit_amount: 0,
    condition: 'excellent',
    purchase_price: 0,
  })

  const [variants, setVariants] = useState<Variant[]>([
    { size: 'M', colour: '', total_stock: 1, price_override: null },
  ])

  const updateForm = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const addVariant = () =>
    setVariants([...variants, { size: '', colour: '', total_stock: 1, price_override: null }])

  const removeVariant = (index: number) => {
    if (variants.length <= 1) return
    setVariants(variants.filter((_, i) => i !== index))
  }

  const updateVariant = (index: number, field: string, value: string | number | null) => {
    const updated = [...variants]
    updated[index] = { ...updated[index], [field]: value }
    setVariants(updated)
  }

  const toggleBulkSize = (size: string) =>
    setBulkSizes((prev) => prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size])

  const applyBulkSizes = () => {
    if (bulkSizes.length === 0) return
    const existing = variants.filter((v) => v.size.trim())
    const existingSizes = new Set(existing.map((v) => v.size))
    const newVariants = bulkSizes
      .filter((s) => !existingSizes.has(s))
      .map((s) => ({ size: s, colour: '', total_stock: 1, price_override: null }))
    const base = variants.filter((v) => v.size.trim() || variants.length === 1)
    setVariants([...base.filter((v) => v.size.trim()), ...newVariants])
    setBulkSizes([])
    setShowBulk(false)
    toast.success(`Added ${newVariants.length} size variant${newVariants.length !== 1 ? 's' : ''}`)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Item name is required'); return }
    if (!form.price) { toast.error('Price is required'); return }
    if (variants.some((v) => !v.size.trim())) { toast.error('All variants need a size'); return }
    if (variants.some((v) => !Number.isFinite(v.total_stock) || v.total_stock < 1)) {
      toast.error('Each variant must have stock of at least 1')
      return
    }
    if (!staff?.business_id) return

    setSaving(true)
    try {
      let coverImageUrl = null
      if (imageFile) {
        coverImageUrl = await StorageService.uploadItemImage(staff.business_id, imageFile)
      }

      const formSubmitData = { ...form, cover_image_url: coverImageUrl }
      const result = await createItem(formSubmitData, variants)
      toast.success('Item added successfully!')
      router.push(`/inventory/${result.id}`)
      router.refresh()
    } catch (err) {
      console.error('Item creation error:', err)
      toast.error('Failed to add item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/inventory"><ChevronLeft className="w-4 h-4 mr-1" />Back</Link>
        </Button>
        <h1 className="text-xl font-semibold text-slate-900">Add New Item</h1>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-1 sm:col-span-2 space-y-2">
              <Label>Item name *</Label>
              <Input value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="e.g. Red Silk Kurtha Set" />
            </div>
            <div className="space-y-2">
              <Label>SKU <span className="text-slate-400">(auto-generated if empty)</span></Label>
              <Input value={form.sku} onChange={(e) => updateForm('sku', e.target.value.toUpperCase())} placeholder="KUR-001" />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={(v) => updateForm('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description <span className="text-slate-400">(optional)</span></Label>
            <textarea
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value)}
              placeholder="Fabric type, design details, care instructions..."
            />
          </div>

          <div className="space-y-2">
            <Label>Storage Location <span className="text-slate-400">(optional)</span></Label>
            <Input
              value={form.storage_location}
              onChange={(e) => updateForm('storage_location', e.target.value)}
              placeholder="e.g. Rack A, Shelf 3"
            />
          </div>

          <div className="space-y-2">
            <Label>Cover Image</Label>
            <ImageUpload 
              value={imagePreview}
              onChange={(file, previewUrl) => {
                setImageFile(file)
                setImagePreview(previewUrl || null)
              }}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rental Pricing</CardTitle>
          <CardDescription>Set how much this item costs to rent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rental rate (₹) *</Label>
              <Input type="number" value={form.price || ''} onChange={(e) => updateForm('price', Number(e.target.value))} placeholder="500" min={0} />
              <p className="text-xs text-slate-400">Amount charged per booking</p>
            </div>
            <div className="space-y-2">
              <Label>Security deposit (₹) <span className="text-slate-400">(optional)</span></Label>
              <Input type="number" value={form.deposit_amount || ''} onChange={(e) => updateForm('deposit_amount', Number(e.target.value))} placeholder="1000" min={0} />
              <p className="text-xs text-slate-400">Refundable deposit collected at pickup</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="space-y-2">
              <Label className="text-slate-500">Purchase / cost price (₹) <span className="text-slate-400">(internal, optional)</span></Label>
              <Input type="number" value={form.purchase_price || ''} onChange={(e) => updateForm('purchase_price', Number(e.target.value))} placeholder="5000" min={0} className="max-w-xs" />
              <p className="text-xs text-slate-400">For your internal records only — not shown to customers</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Condition */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Condition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <button
                key={c}
                onClick={() => updateForm('condition', c)}
                className={`px-4 py-2 rounded-lg text-sm capitalize border transition-colors ${
                  form.condition === c
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Variants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Size & Stock Variants</CardTitle>
              <CardDescription>Add sizes, colours, and stock for this item</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowBulk(!showBulk)}>
                <Layers className="w-4 h-4 mr-1" /> Bulk Add Sizes
              </Button>
              <Button variant="outline" size="sm" onClick={addVariant}>
                <Plus className="w-4 h-4 mr-1" /> Add Row
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bulk size picker */}
          {showBulk && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select sizes to add</p>
              {Object.entries(SIZE_PRESETS).map(([group, sizes]) => (
                <div key={group}>
                  <p className="text-[11px] text-slate-400 mb-1.5 font-medium">{group}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sizes.map((s) => {
                      const isSelected = bulkSizes.includes(s)
                      const alreadyExists = variants.some((v) => v.size === s)
                      return (
                        <button
                          key={s}
                          type="button"
                          disabled={alreadyExists}
                          onClick={() => toggleBulkSize(s)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            alreadyExists
                              ? 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed'
                              : isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                          }`}
                        >
                          {s}{alreadyExists && ' ✓'}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={applyBulkSizes}
                  disabled={bulkSizes.length === 0}
                >
                  Add {bulkSizes.length > 0 ? bulkSizes.length : ''} size{bulkSizes.length !== 1 ? 's' : ''} →
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setBulkSizes([]); setShowBulk(false) }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Variant rows */}
          {variants.map((v, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <SizePicker value={v.size} onChange={(val) => updateVariant(i, 'size', val)} />
                </div>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 p-1 h-8 w-8 mt-5" onClick={() => removeVariant(i)} disabled={variants.length <= 1}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Colour</Label>
                  <Input value={v.colour} onChange={(e) => updateVariant(i, 'colour', e.target.value)} placeholder="Red" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Stock</Label>
                  <Input type="number" value={v.total_stock} onChange={(e) => updateVariant(i, 'total_stock', Number(e.target.value))} min={1} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Price override (₹)</Label>
                  <Input type="number" value={v.price_override ?? ''} onChange={(e) => updateVariant(i, 'price_override', e.target.value ? Number(e.target.value) : null)} placeholder="—" />
                </div>
              </div>
            </div>
          ))}

          <p className="text-xs text-slate-400">
            Total stock: <span className="font-semibold text-slate-600">{variants.reduce((s, v) => s + v.total_stock, 0)}</span> units across <span className="font-semibold text-slate-600">{variants.length}</span> variant{variants.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" asChild><Link href="/inventory">Cancel</Link></Button>
        <Button className="bg-blue-600 hover:bg-blue-700 min-w-[140px]" onClick={handleSubmit} disabled={saving}>
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Add Item →'}
        </Button>
      </div>
    </div>
  )
}
