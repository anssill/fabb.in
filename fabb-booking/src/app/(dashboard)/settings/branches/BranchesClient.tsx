'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Pencil, MapPin, Phone, Mail, Check } from 'lucide-react'

interface Branch {
  id: string
  name: string
  city: string | null
  prefix: string
  address: string | null
  phone: string | null
  email: string | null
  is_default: boolean
  status: string
  settings: Record<string, unknown>
}

export function BranchesClient() {
  const { branches, activeBranch, setBranches } = useAppStore()
  const supabase = createClient()
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [formData, setFormData] = useState({
    name: '', city: '', address: '', phone: '', email: '', prefix: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  function openEdit(branch: Branch) {
    setEditingBranch(branch)
    setIsAddingNew(false)
    setFormData({
      name: branch.name,
      city: branch.city || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      prefix: branch.prefix,
    })
    setIsDialogOpen(true)
  }

  function openAdd() {
    setEditingBranch(null)
    setIsAddingNew(true)
    setFormData({ name: '', city: '', address: '', phone: '', email: '', prefix: '' })
    setIsDialogOpen(true)
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.error('Branch name is required')
      return
    }
    setIsSaving(true)
    try {
      if (isAddingNew) {
        const { data, error } = await supabase
          .from('branches')
          .insert({
            name: formData.name,
            city: formData.city || null,
            address: formData.address || null,
            phone: formData.phone || null,
            email: formData.email || null,
            prefix: formData.prefix.toUpperCase() || formData.name.substring(0, 3).toUpperCase(),
          })
          .select()
          .single()
        if (error) throw error
        setBranches([...branches, data as Branch])
        toast.success('Branch created successfully')
      } else if (editingBranch) {
        const { error } = await supabase
          .from('branches')
          .update({
            name: formData.name,
            city: formData.city || null,
            address: formData.address || null,
            phone: formData.phone || null,
            email: formData.email || null,
            prefix: formData.prefix.toUpperCase(),
          })
          .eq('id', editingBranch.id)
        if (error) throw error
        setBranches(branches.map(b => b.id === editingBranch.id ? { ...b, ...formData, prefix: formData.prefix.toUpperCase() } : b))
        toast.success('Branch updated successfully')
      }
      setIsDialogOpen(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to save branch')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{branches.length} branch{branches.length !== 1 ? 'es' : ''}</p>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white h-9">
          <Plus className="w-4 h-4 mr-2" /> Add Branch
        </Button>
      </div>

      <div className="space-y-3">
        {branches.map((branch) => (
          <Card key={branch.id} className="shadow-sm border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-slate-900">{branch.name}</p>
                      <Badge variant="outline" className="text-xs font-mono">{branch.prefix}</Badge>
                      {activeBranch?.id === branch.id && (
                        <Badge className="text-xs bg-green-100 text-green-700 border-green-200">Active</Badge>
                      )}
                    </div>
                    {branch.city && <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{branch.city}</p>}
                    {branch.phone && <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{branch.phone}</p>}
                    {branch.email && <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" />{branch.email}</p>}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="shrink-0 h-8 text-xs" onClick={() => openEdit(branch as Branch)}>
                  <Pencil className="w-3 h-3 mr-1" /> Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {branches.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm border border-dashed border-slate-200 rounded-lg">
            No branches found. Add your first branch.
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isAddingNew ? 'Add New Branch' : 'Edit Branch'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Branch Name *</Label>
                <Input value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} placeholder="e.g. Thrissur Main" />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input value={formData.city} onChange={e => setFormData(p => ({...p, city: e.target.value}))} placeholder="Thrissur" />
              </div>
              <div className="space-y-1.5">
                <Label>Booking ID Prefix</Label>
                <Input value={formData.prefix} onChange={e => setFormData(p => ({...p, prefix: e.target.value.toUpperCase().slice(0,4)}))} placeholder="THR" maxLength={4} className="font-mono uppercase" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Address</Label>
                <Input value={formData.address} onChange={e => setFormData(p => ({...p, address: e.target.value}))} placeholder="123 Market Street" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={e => setFormData(p => ({...p, phone: e.target.value}))} placeholder="+91 98765 43210" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))} placeholder="branch@example.com" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : isAddingNew ? 'Create Branch' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
