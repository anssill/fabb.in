'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useItem, useUpdateItem, useItemBookings } from '@/lib/queries/useItems'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Edit3, Save, Package, RefreshCcw, FileText, Image as ImageIcon, CheckCircle, Clock, Wrench, BarChart3, History as HistoryIcon, Camera } from 'lucide-react'
import { AvailabilityGantt } from '@/components/inventory/AvailabilityGantt'
import { QRCodeLabel } from '@/components/inventory/QRCodeLabel'
import { RepairStatusManager } from '@/components/inventory/RepairStatusManager'
import { useUpdateVariant, useCreateVariant, useDeleteVariant, generateVariantSKU } from '@/lib/queries/useItems'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'

export default function ItemDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { data: item, isLoading } = useItem(id)
  const { data: bookings } = useItemBookings(id)
  const { mutateAsync: updateItem } = useUpdateItem()
  const { mutateAsync: updateVariant } = useUpdateVariant()
  const { mutateAsync: createVariant } = useCreateVariant()
  const { mutateAsync: deleteVariant } = useDeleteVariant()
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<any>({})

  // Variant addition state
  const [isAddingVariant, setIsAddingVariant] = useState(false)
  const [newVariant, setNewVariant] = useState({
    size: '',
    colour: '',
    available_count: 1,
    sku: ''
  })

  if (isLoading) return <div className="p-8 text-zinc-500">Loading item details...</div>
  if (!item) return <div className="p-8 text-red-500">Item not found.</div>

  const handleEdit = () => {
    setFormData({
      name: item.name,
      category: item.category,
      condition_grade: item.condition_grade,
      price: item.price,
      status: item.status
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    await updateItem({ id, updates: formData })
    setIsEditing(false)
  }

  const handleAddVariant = async () => {
    if (!newVariant.size || !newVariant.sku) {
      toast.error('Size and SKU are required')
      return
    }
    
    try {
      await createVariant({
        item_id: id,
        ...newVariant,
        status: 'available'
      })
      toast.success('Variant added successfully')
      setIsAddingVariant(false)
      setNewVariant({ size: '', colour: '', available_count: 1, sku: '' })
    } catch (e: any) {
      toast.error(e.message || 'Failed to add variant')
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return
    try {
      await deleteVariant({ id: variantId, itemId: id })
      toast.success('Variant deleted')
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete variant')
    }
  }

  const suggestVariantSKU = (size: string, colour: string) => {
    const sku = generateVariantSKU(item, { size, colour })
    setNewVariant(prev => ({ ...prev, sku, size, colour }))
  }

  // Calculate pricing & ROI analytics
  const purchaseCost = item.purchase_cost || 0
  const itemPrice = item.price || 0
  const totalBookings = bookings?.length || 0
  const estimatedRevenue = totalBookings * itemPrice * 3 // Roughly 3 days per booking
  const roi = purchaseCost > 0 ? ((estimatedRevenue / purchaseCost) * 100).toFixed(0) : '0'

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-zinc-500 hover:text-zinc-900 border border-zinc-200">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            {item.name}
            <Badge className={
              item.status === 'available' ? 'bg-emerald-100 text-emerald-800' :
              item.status === 'maintenance' ? 'bg-amber-100 text-amber-800' :
              'bg-zinc-100 text-zinc-800'
            } variant="secondary">
              {item.status}
            </Badge>
          </h1>
          <p className="text-zinc-500 font-mono text-sm">{item.sku}</p>
        </div>
        
        <div className="ml-auto flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            Print QR
          </Button>
          {!isEditing ? (
            <Button onClick={handleEdit} className="bg-zinc-900 text-white gap-2">
              <Edit3 className="w-4 h-4" /> Edit Details
            </Button>
          ) : (
            <Button onClick={handleSave} className="bg-[#ccff00] text-black hover:bg-[#aacc00] font-bold gap-2">
              <Save className="w-4 h-4" /> Save Changes
            </Button>
          )}
        </div>
      </div>

      <QRCodeLabel sku={item.sku} name={item.name} />

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl w-full flex overflow-x-auto hide-scrollbar border border-zinc-200">
          <TabsTrigger value="details" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="variants" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">Stock & Variants</TabsTrigger>
          <TabsTrigger value="repairs" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">Maintenance</TabsTrigger>
          <TabsTrigger value="availability" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Gantt Chart</TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">ROI Stats</TabsTrigger>
          <TabsTrigger value="photos" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Media</TabsTrigger>
          <TabsTrigger value="timeline" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-[10px] uppercase font-black tracking-widest text-zinc-400">History</TabsTrigger>
        </TabsList>

        <div className="mt-8">
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border rounded-xl bg-white dark:bg-zinc-950">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-500">Name</label>
                  {isEditing ? <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /> : <p className="text-lg font-medium">{item.name}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-500">Category</label>
                  {isEditing ? <Input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} /> : <p className="text-lg">{item.category}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-500">Storage Location</label>
                  <p className="text-lg font-mono">{item.storage_rack || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-500">Price</label>
                  {isEditing ? <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} /> : <p className="text-lg font-mono font-medium">₹{item.price?.toLocaleString('en-IN')}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-500">Condition Grade</label>
                  {isEditing ? <Input value={formData.condition_grade} onChange={e => setFormData({...formData, condition_grade: e.target.value})} /> : <p className="text-lg">{item.condition_grade}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-500">Status</label>
                  {isEditing ? (
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="available">Available</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="washing">Washing</option>
                      <option value="rented">Rented</option>
                    </select>
                  ) : <p className="text-lg capitalize">{item.status}</p>}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="availability">
             {bookings && <AvailabilityGantt bookings={bookings} />}
          </TabsContent>

          <TabsContent value="repairs" className="space-y-6">
            <RepairStatusManager item={item} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div className="p-6 border rounded-xl bg-green-50/50">
                 <p className="text-xs text-green-700 font-bold uppercase">Estimated Revenue</p>
                 <p className="text-3xl font-mono font-bold text-green-800 mt-2">₹{estimatedRevenue.toLocaleString()}</p>
                 <p className="text-sm text-green-600 mt-1">Based on {totalBookings} bookings</p>
               </div>
               <div className="p-6 border rounded-xl bg-blue-50/50">
                 <p className="text-xs text-blue-700 font-bold uppercase">Purchase Cost</p>
                 <p className="text-3xl font-mono font-bold text-blue-800 mt-2">₹{purchaseCost.toLocaleString()}</p>
                 <p className="text-sm text-blue-600 mt-1">Date: {item.purchase_date || 'Unknown'}</p>
               </div>
               <div className="p-6 border rounded-xl bg-purple-50/50">
                 <p className="text-xs text-purple-700 font-bold uppercase">ROI Tracked</p>
                 <p className="text-3xl font-mono font-bold text-purple-800 mt-2">{roi}%</p>
                 <p className="text-sm text-purple-600 mt-1">Break-even at ₹{purchaseCost}</p>
               </div>
            </div>
          </TabsContent>

          <TabsContent value="variants">
            <div className="border border-zinc-100 rounded-2xl overflow-hidden bg-white shadow-sm">
              <Table>
                <TableHeader className="bg-zinc-50">
                  <TableRow>
                    <TableHead>Size</TableHead>
                    <TableHead>Colour</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.item_variants?.map((variant: any) => (
                    <TableRow key={variant.id}>
                      <TableCell className="font-bold">{variant.size}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full border border-zinc-200" style={{ backgroundColor: variant.colour?.toLowerCase() || '#eee' }} />
                          <span className="capitalize">{variant.colour || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{variant.sku}</TableCell>
                      <TableCell>
                        <Badge variant={variant.available_count > 0 ? "secondary" : "destructive"} className="font-mono">
                          {variant.available_count} IN STOCK
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => updateVariant({ id: variant.id, updates: { available_count: variant.available_count + 1 } })}>
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => handleDeleteVariant(variant.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="p-4 bg-zinc-50 border-t flex justify-between items-center">
                <p className="text-xs text-zinc-500 font-medium">Manage stock levels per size/colour combination.</p>
                <Dialog open={isAddingVariant} onOpenChange={setIsAddingVariant}>
                  <DialogTrigger render={
                    <Button variant="outline" size="sm" className="gap-2 border-zinc-200">
                      <Plus className="w-4 h-4" /> Add Variant
                    </Button>
                  }>
                  </DialogTrigger>
                  <DialogContent className="bg-white">
                    <DialogHeader>
                      <DialogTitle>Add Item Variant</DialogTitle>
                      <DialogDescription>Create a new size or colour variation for {item.name}.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase">Size</label>
                        <Input 
                          placeholder="XL, 42, etc." 
                          value={newVariant.size}
                          onChange={(e) => suggestVariantSKU(e.target.value, newVariant.colour)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase">Colour</label>
                        <Input 
                          placeholder="Red, Navy, etc." 
                          value={newVariant.colour}
                          onChange={(e) => suggestVariantSKU(newVariant.size, e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase">Initial Stock</label>
                        <Input 
                          type="number"
                          value={newVariant.available_count}
                          onChange={(e) => setNewVariant(p => ({ ...p, available_count: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase">Generated SKU</label>
                        <Input 
                          className="bg-zinc-50 font-mono text-xs" 
                          value={newVariant.sku}
                          onChange={(e) => setNewVariant(p => ({ ...p, sku: e.target.value }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setIsAddingVariant(false)}>Cancel</Button>
                      <Button className="bg-zinc-900 text-white" onClick={handleAddVariant}>Create Variant</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              {(!item.item_variants || item.item_variants.length === 0) && (
                <div className="p-12 text-center text-zinc-400">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">No variants defined for this product</p>
                  <Button variant="outline" className="mt-4 border-2 border-zinc-100 rounded-xl">Add First Variant</Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="photos">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="aspect-[3/4] border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center text-zinc-400 hover:border-zinc-300 hover:bg-zinc-50 transition-all cursor-pointer">
                <Camera className="w-6 h-6 mb-2" />
                <span className="text-[10px] font-bold uppercase">Add Photo</span>
              </div>
              {item.item_photos?.map((photo: any) => (
                <div key={photo.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden group shadow-sm">
                  <img src={photo.url} alt="Inventory" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                    <Button size="icon" variant="destructive" className="h-8 w-8 rounded-lg shadow-xl">
                      <ArrowLeft className="w-4 h-4 rotate-45" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <div className="p-6 border rounded-xl bg-white dark:bg-zinc-950">
               <div className="space-y-6">
                 <div className="flex gap-4">
                   <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500" />
                   <div>
                     <p className="font-semibold">{item.name} Created</p>
                     <p className="text-sm text-zinc-500">{new Date(item.created_at).toLocaleString()}</p>
                   </div>
                 </div>
                 {/* Insert item_timeline and washing records mappings here */}
               </div>
            </div>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  )
}
