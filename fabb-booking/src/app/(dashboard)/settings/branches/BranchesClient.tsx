'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore, type BranchData } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Pencil, MapPin, Phone, Mail, Check, ShieldCheck, Globe } from 'lucide-react'

interface StaffMember {
  id: string
  name: string | null
  email: string
}

interface BranchesClientProps {
  initialStaff: StaffMember[]
}

export function BranchesClient({ initialStaff }: BranchesClientProps) {
  const { branches, activeBranch, setBranches } = useAppStore()
  const supabase = createClient()
  const [editingBranch, setEditingBranch] = useState<BranchData | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '', 
    city: '', 
    address: '', 
    phone: '', 
    email: '', 
    prefix: '',
    is_default: false,
    manager_id: '',
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
      is_default: branch.is_default,
      manager_id: branch.settings?.manager_id || '',
    })
    setIsDialogOpen(true)
  }

  function openAdd() {
    setEditingBranch(null)
    setIsAddingNew(true)
    setFormData({ 
      name: '', 
      city: '', 
      address: '', 
      phone: '', 
      email: '', 
      prefix: '', 
      is_default: branches.length === 0, // Frist branch is default by default
      manager_id: '',
    })
    setIsDialogOpen(true)
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.error('Branch name is required')
      return
    }
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: currentStaff } = await supabase.from('staff').select('business_id').eq('id', user.id).single()
      if (!currentStaff) throw new Error('Business not found')

      const branchPayload = {
        name: formData.name,
        city: formData.city || null,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
        prefix: formData.prefix.toUpperCase() || formData.name.substring(0, 3).toUpperCase(),
        is_default: formData.is_default,
        settings: {
          ...(editingBranch?.settings || {}),
          manager_id: formData.manager_id || null,
        }
      }

      // If this is set as default, unset others first
      if (formData.is_default) {
        await supabase
          .from('branches')
          .update({ is_default: false })
          .eq('business_id', currentStaff.business_id)
          .neq('id', editingBranch?.id || '00000000-0000-0000-0000-000000000000')
      }

      let updatedBranch: Branch

      if (isAddingNew) {
        const { data, error } = await supabase
          .from('branches')
          .insert({
            ...branchPayload,
            business_id: currentStaff.business_id,
          })
          .select()
          .single()
        
        if (error) throw error
        updatedBranch = data as Branch
        setBranches([...branches, updatedBranch])
        toast.success('Branch created successfully')
      } else if (editingBranch) {
        const { data, error } = await supabase
          .from('branches')
          .update(branchPayload)
          .eq('id', editingBranch.id)
          .select()
          .single()
        
        if (error) throw error
        updatedBranch = data as Branch
        setBranches(branches.map(b => b.id === editingBranch.id ? updatedBranch : (formData.is_default ? { ...b, is_default: false } : b)))
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
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Active Locations</h3>
          <p className="text-xs text-slate-500 mt-0.5">{branches.length} branch{branches.length !== 1 ? 'es' : ''} configured</p>
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-5 shadow-sm transition-all hover:shadow-md">
          <Plus className="w-4 h-4 mr-2" /> Add New Branch
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map((branch) => {
          const managerName = initialStaff.find(s => s.id === branch.settings?.manager_id)?.name || 'Not assigned'
          
          return (
            <Card key={branch.id} className={`group relative transition-all duration-200 rounded-2xl border-slate-200 overflow-hidden ${branch.is_default ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:border-blue-300'}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${branch.is_default ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-lg font-bold text-slate-900">{branch.name}</h4>
                        <Badge variant="outline" className="text-[10px] font-mono font-bold py-0 h-5 border-slate-200">{branch.prefix}</Badge>
                        {branch.is_default && (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px] font-bold border-none uppercase tracking-tight">Default</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                        Manager: <span className="text-slate-700">{managerName}</span>
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" onClick={() => openEdit(branch as Branch)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>

                <Separator className="my-5 bg-slate-100" />

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <span>{branch.city || 'No city set'}, {branch.address || 'No address set'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{branch.phone || 'No phone set'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{branch.email || 'No email set'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {branches.length === 0 && (
          <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-slate-200" />
            <h3 className="text-xl font-bold text-slate-900">No branches configured</h3>
            <p className="text-slate-500 mt-1 max-w-xs mx-auto">Add your physical store locations to start managing inventory and bookings.</p>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-900 p-6 text-white">
            <DialogTitle className="text-2xl font-bold">{isAddingNew ? 'Register New Branch' : 'Configure Branch'}</DialogTitle>
            <DialogDescription className="text-slate-400 mt-1">
              Enter the details of your physical store location below.
            </DialogDescription>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Branch Name</Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData(p => ({...p, name: e.target.value}))} 
                  placeholder="e.g. Bandra West Boutique" 
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-none"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">City</Label>
                <Input value={formData.city} onChange={e => setFormData(p => ({...p, city: e.target.value}))} placeholder="Mumbai" className="h-12 rounded-xl bg-slate-50 border-slate-200 shadow-none" />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">ID Prefix (4 Chars)</Label>
                <Input value={formData.prefix} onChange={e => setFormData(p => ({...p, prefix: e.target.value.toUpperCase().slice(0,4)}))} placeholder="BDRA" maxLength={4} className="h-12 rounded-xl bg-slate-50 border-slate-200 font-mono shadow-none" />
              </div>

              <div className="col-span-2 space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Address</Label>
                <Input value={formData.address} onChange={e => setFormData(p => ({...p, address: e.target.value}))} placeholder="Shop No. 4, Hill Road, Bandra" className="h-12 rounded-xl bg-slate-50 border-slate-200 shadow-none" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone</Label>
                <Input value={formData.phone} onChange={e => setFormData(p => ({...p, phone: e.target.value}))} placeholder="+91 98765 43210" className="h-12 rounded-xl bg-slate-50 border-slate-200 shadow-none" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</Label>
                <Input value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))} placeholder="bandra@fabb.com" className="h-12 rounded-xl bg-slate-50 border-slate-200 shadow-none" />
              </div>

              <div className="col-span-2 space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Branch Manager</Label>
                <Select value={formData.manager_id} onValueChange={v => setFormData(p => ({...p, manager_id: v}))}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200 shadow-none">
                    <SelectValue placeholder="Assign a manager" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="">No manager assigned</SelectItem>
                    {initialStaff.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name || s.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">Set as Primary Branch</p>
                <p className="text-xs text-slate-500">New staff and bookings will default to this location.</p>
              </div>
              <Switch checked={formData.is_default} onCheckedChange={v => setFormData(p => ({...p, is_default: v}))} />
            </div>
          </div>
          
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl flex-1 h-12 border-slate-200">Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex-1 h-12 shadow-lg shadow-blue-200" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Processing...' : isAddingNew ? 'Add Branch' : 'Update Branch'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
