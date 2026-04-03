import { useState } from 'react'
import { useCreateItem } from '@/lib/queries/useItems'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Plus, Check, Search, Barcode } from 'lucide-react'
import { QRCodeLabel } from './QRCodeLabel'

export function QuickAddModal() {
  const [isOpen, setIsOpen] = useState(false)
  const { mutateAsync: createItem } = useCreateItem()

  const [step, setStep] = useState<'form' | 'checklist'>('form')
  const [formData, setFormData] = useState({ name: '', category: '', price: '' })
  const [createdItemId, setCreatedItemId] = useState<string | null>(null)
  const [createdItemSku, setCreatedItemSku] = useState<string | null>(null)

  // Checklist state
  const [checks, setChecks] = useState({ photos: false, variants: false, tags: false })

  const handleCreate = async () => {
    if (!formData.name || !formData.category || !formData.price) return
    try {
      const generatedSku = `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      const newItem = await createItem({
        name: formData.name,
        category: formData.category,
        price: Number(formData.price),
        sku: generatedSku,
        status: 'available',
        condition_grade: 'A'
      })
      
      setCreatedItemId(newItem.id)
      setCreatedItemSku(newItem.sku)
      setStep('checklist')

      // Auto print trigger is placed in the checklist view via empty useEffect
      setTimeout(() => {
        window.print()
      }, 500)
    } catch (e) {
      console.error(e)
    }
  }

  const reset = () => {
    setIsOpen(false)
    setTimeout(() => {
      setStep('form')
      setFormData({ name: '', category: '', price: '' })
      setCreatedItemId(null)
      setCreatedItemSku(null)
      setChecks({ photos: false, variants: false, tags: false })
    }, 200)
  }

  return (
    <Sheet open={isOpen} onOpenChange={(val) => {
      if (!val) reset()
      else setIsOpen(true)
    }}>
      <SheetTrigger render={<Button className="bg-[#ccff00] text-black hover:bg-[#bce600] font-semibold h-10 px-5 rounded-lg shadow-sm" />}>
        <Plus className="w-4 h-4 mr-2" />
        Quick Add
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-white border-zinc-200">
        <SheetHeader>
          <SheetTitle>{step === 'form' ? 'Quick Add Item' : 'Item Created!'}</SheetTitle>
          <SheetDescription>
            {step === 'form' 
              ? 'Enter basic details to generate an SKU and print the label.' 
              : 'Complete the checklist to fully configure this asset.'}
          </SheetDescription>
        </SheetHeader>

        {step === 'form' ? (
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Item Name</label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData(p => ({...p, name: e.target.value}))} 
                placeholder="Bridal Lehenga Red" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Input 
                value={formData.category} 
                onChange={e => setFormData(p => ({...p, category: e.target.value}))} 
                placeholder="Bridal" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Daily Rental Price (₹)</label>
              <Input 
                type="number"
                value={formData.price} 
                onChange={e => setFormData(p => ({...p, price: e.target.value}))} 
                placeholder="15000" 
              />
            </div>
            <Button className="w-full mt-4 bg-zinc-900 text-white" onClick={handleCreate}>
              Generate SKU & Auto-Print Label
            </Button>
          </div>
        ) : (
          <div className="py-6 flex flex-col h-[calc(100vh-150px)]">
            <div className="p-4 bg-zinc-50 border rounded-xl mb-6 text-center isolate">
              <Badge className="bg-emerald-100 text-emerald-800 border-0 mb-2">Success</Badge>
              <h3 className="text-xl font-bold">{formData.name}</h3>
              <p className="font-mono text-zinc-500">{createdItemSku}</p>
              
              {/* Hidden Print Wrapper */}
              <QRCodeLabel sku={createdItemSku!} name={formData.name} />
              
              <Button variant="outline" size="sm" className="mt-4 gap-2 border-zinc-300" onClick={() => window.print()}>
                <Barcode className="w-4 h-4" /> Print Label Again
              </Button>
            </div>

            <h4 className="font-semibold mb-3">Completion Checklist</h4>
            <div className="space-y-3 flex-1">
              <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-zinc-50 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 accent-zinc-900" 
                  checked={checks.photos} onChange={e => setChecks(p => ({...p, photos: e.target.checked}))} />
                <span className="text-sm font-medium">Upload Cover Photos</span>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-zinc-50 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 accent-zinc-900" 
                  checked={checks.variants} onChange={e => setChecks(p => ({...p, variants: e.target.checked}))} />
                <span className="text-sm font-medium">Add Sizes & Variants</span>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-zinc-50 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 accent-zinc-900" 
                  checked={checks.tags} onChange={e => setChecks(p => ({...p, tags: e.target.checked}))} />
                <span className="text-sm font-medium">Assign Collections</span>
              </label>
            </div>

            <Button className="w-full bg-[#ccff00] text-black hover:bg-[#bce600] font-bold" onClick={reset}>
              Finish
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
