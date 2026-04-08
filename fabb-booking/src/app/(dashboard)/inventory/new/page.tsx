'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, Plus, Trash2, Loader2, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import Link from 'next/link'
import { createItem } from '../inventory-actions'

const CATEGORIES = ['Kurtha', 'Suits', 'Loafers', 'Shoes', 'Cap', 'Accessories', 'Sherwani', 'Lehenga', 'Saree', 'Jewellery']
const CONDITIONS = ['excellent', 'good', 'fair', 'poor']

interface Variant {
  size: string
  colour: string
  total_stock: number
  price_override: number | null
}

export default function NewItemPage() {
  const router = useRouter()
  const { staff } = useAppStore()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: 'Kurtha',
    description: '',
    daily_rate: 0,
    deposit_amount: 0,
    condition: 'excellent',
    purchase_price: 0,
  })

  const [variants, setVariants] = useState<Variant[]>([
    { size: 'M', colour: '', total_stock: 1, price_override: null },
  ])

  const updateForm = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const addVariant = () => {
    setVariants([...variants, { size: '', colour: '', total_stock: 1, price_override: null }])
  }

  const removeVariant = (index: number) => {
    if (variants.length <= 1) return
    setVariants(variants.filter((_, i) => i !== index))
  }

  const updateVariant = (index: number, field: string, value: string | number | null) => {
    const updated = [...variants]
    updated[index] = { ...updated[index], [field]: value }
    setVariants(updated)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Item name is required'); return }
    if (!form.daily_rate) { toast.error('Daily rate is required'); return }
    if (variants.some((v) => !v.size.trim())) { toast.error('All variants need a size'); return }
    if (!staff?.business_id) return

    setSaving(true)
    try {
      const result = await createItem(form, variants)
      toast.success('Item added and synced to Notion!')
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
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
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

          {/* Image upload placeholder */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-blue-300 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-400">PNG, JPG up to 5MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Daily rental rate (₹) *</Label>
              <Input type="number" value={form.daily_rate || ''} onChange={(e) => updateForm('daily_rate', Number(e.target.value))} placeholder="500" min={0} />
            </div>
            <div className="space-y-2">
              <Label>Security deposit (₹)</Label>
              <Input type="number" value={form.deposit_amount || ''} onChange={(e) => updateForm('deposit_amount', Number(e.target.value))} placeholder="1000" min={0} />
            </div>
            <div className="space-y-2">
              <Label>Purchase price (₹)</Label>
              <Input type="number" value={form.purchase_price || ''} onChange={(e) => updateForm('purchase_price', Number(e.target.value))} placeholder="5000" min={0} />
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
          <div className="flex gap-2">
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
            <Button variant="outline" size="sm" onClick={addVariant}>
              <Plus className="w-4 h-4 mr-1" /> Add Variant
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {variants.map((v, i) => (
            <div key={i} className="flex gap-3 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Size *</Label>
                <Input value={v.size} onChange={(e) => updateVariant(i, 'size', e.target.value)} placeholder="M / 40 / Free" />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Colour</Label>
                <Input value={v.colour} onChange={(e) => updateVariant(i, 'colour', e.target.value)} placeholder="Red" />
              </div>
              <div className="w-20 space-y-1">
                <Label className="text-xs">Stock</Label>
                <Input type="number" value={v.total_stock} onChange={(e) => updateVariant(i, 'total_stock', Number(e.target.value))} min={1} />
              </div>
              <div className="w-28 space-y-1">
                <Label className="text-xs">Price override</Label>
                <Input type="number" value={v.price_override ?? ''} onChange={(e) => updateVariant(i, 'price_override', e.target.value ? Number(e.target.value) : null)} placeholder="—" />
              </div>
              <Button variant="ghost" size="sm" className="text-red-500 shrink-0" onClick={() => removeVariant(i)} disabled={variants.length <= 1}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <p className="text-xs text-slate-400">Total stock: {variants.reduce((s, v) => s + v.total_stock, 0)} units across {variants.length} variant{variants.length !== 1 ? 's' : ''}</p>
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
