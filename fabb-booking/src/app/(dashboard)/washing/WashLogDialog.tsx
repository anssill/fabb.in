'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { addToWashingQueue } from './washing-actions'

interface WashLogDialogProps {
  businessId: string
  branchId: string
  staffId: string
}

export function WashLogDialog({ businessId, branchId, staffId }: WashLogDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [selectedItemId, setSelectedItemId] = useState<string>('')
  const [selectedVariantId, setSelectedVariantId] = useState<string>('')
  const [priority, setPriority] = useState<'urgent' | 'normal' | 'low'>('normal')
  const [notes, setNotes] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (search.length < 2) {
      setItems([])
      return
    }

    const fetchItems = async () => {
      const { data } = await supabase
        .from('items')
        .select('id, name, sku, item_variants(id, size, colour)')
        .ilike('name', `%${search}%`)
        .eq('branch_id', branchId)
        .limit(5)
      
      setItems(data || [])
    }

    const timer = setTimeout(fetchItems, 300)
    return () => clearTimeout(timer)
  }, [search, branchId, supabase])

  const selectedItem = items.find(i => i.id === selectedItemId)

  async function handleSubmit() {
    if (!selectedItemId) {
      toast.error('Please select an item')
      return
    }

    setLoading(true)
    try {
      await addToWashingQueue({
        itemId: selectedItemId,
        variantId: selectedVariantId || undefined,
        priority,
        notes,
        businessId,
        branchId,
        staffId,
      })
      toast.success('Item added to washing queue')
      setOpen(false)
      // Reset form
      setSearch('')
      setSelectedItemId('')
      setSelectedVariantId('')
      setNotes('')
      setPriority('normal')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add item to washing queue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Send to Wash
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Item to Wash</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Search Item</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Type item name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {items.length > 0 && !selectedItemId && (
              <div className="mt-1 border border-slate-200 rounded-md bg-white shadow-sm max-h-40 overflow-auto">
                {items.map(item => (
                  <button
                    key={item.id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                    onClick={() => {
                      setSelectedItemId(item.id)
                      setSearch(item.name)
                      if (item.item_variants?.length === 1) {
                        setSelectedVariantId(item.item_variants[0].id)
                      }
                    }}
                  >
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.sku}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedItem && selectedItem.item_variants?.length > 0 && (
            <div className="space-y-2">
              <Label>Select Variant / Size</Label>
              <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Identify which unit..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedItem.item_variants.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.size} {v.colour ? `· ${v.colour}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input
              placeholder="e.g. Broken button, dry clean only"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedItemId}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
