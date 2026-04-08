'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Save, Plus, Pencil, Trash2, Package } from 'lucide-react'

const DEFAULT_CATEGORIES = [
  { name: 'Kurtha', prefix: 'KUR' },
  { name: 'Suits', prefix: 'SUT' },
  { name: 'Loafers', prefix: 'LOA' },
  { name: 'Shoes', prefix: 'SHO' },
  { name: 'Cap', prefix: 'CAP' },
  { name: 'Accessories', prefix: 'ACC' },
]

export function InventorySettingsClient() {
  const { business } = useAppStore()
  const supabase = createClient()
  const [isSaving, setIsSaving] = useState(false)

  const bizSettings = (business?.settings as any) || {}
  const [categories, setCategories] = useState<{ name: string; prefix: string }[]>(
    bizSettings.categories ?? DEFAULT_CATEGORIES
  )
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(bizSettings.low_stock_threshold ?? 1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [catForm, setCatForm] = useState({ name: '', prefix: '' })

  function openAdd() {
    setEditingIndex(null)
    setCatForm({ name: '', prefix: '' })
    setIsDialogOpen(true)
  }

  function openEdit(idx: number) {
    setEditingIndex(idx)
    setCatForm(categories[idx])
    setIsDialogOpen(true)
  }

  function saveCategory() {
    if (!catForm.name.trim()) { toast.error('Category name required'); return }
    if (editingIndex !== null) {
      setCategories(prev => prev.map((c, i) => i === editingIndex ? catForm : c))
    } else {
      setCategories(prev => [...prev, { name: catForm.name, prefix: catForm.prefix.toUpperCase().slice(0, 4) || catForm.name.slice(0, 3).toUpperCase() }])
    }
    setIsDialogOpen(false)
  }

  function deleteCategory(idx: number) {
    setCategories(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    if (!business) return
    setIsSaving(true)
    try {
      const newSettings = { ...bizSettings, categories, low_stock_threshold: lowStockThreshold }
      const { error } = await supabase
        .from('businesses')
        .update({ settings: newSettings })
        .eq('id', business.id)
      if (error) throw error
      toast.success('Inventory settings saved')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save inventory settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Categories */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-500" /> Item Categories
            </CardTitle>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={openAdd}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {categories.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono text-xs w-12 justify-center">{cat.prefix}</Badge>
                  <span className="text-sm text-slate-800">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(idx)}>
                    <Pencil className="w-3.5 h-3.5 text-slate-400" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete category?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Removing &quot;{cat.name}&quot; will not affect existing items but they will lose their category.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => deleteCategory(idx)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Low Stock Alert</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-1.5">
              <Label>Alert when available stock falls below</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={lowStockThreshold}
                  onChange={e => setLowStockThreshold(Number(e.target.value))}
                  min={1}
                  max={10}
                  className="w-24"
                />
                <span className="text-sm text-slate-500">unit(s)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" />Save inventory settings</>}
        </Button>
      </div>

      {/* Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Category Name *</Label>
              <Input value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Bridal Lehenga" />
            </div>
            <div className="space-y-1.5">
              <Label>SKU Prefix</Label>
              <Input value={catForm.prefix} onChange={e => setCatForm(p => ({ ...p, prefix: e.target.value.toUpperCase().slice(0, 4) }))} placeholder="e.g. BRL" className="font-mono uppercase" maxLength={4} />
              <p className="text-xs text-slate-400">Short code for SKU generation (e.g. KUR-001)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={saveCategory}>
              {editingIndex !== null ? 'Save Changes' : 'Add Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
