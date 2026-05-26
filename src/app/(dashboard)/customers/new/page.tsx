'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import { integrations } from '@/lib/integrations'
import { toast } from 'sonner'
import Link from 'next/link'

export default function NewCustomerPage() {
  const router = useRouter()
  const { staff, activeBranch } = useAppStore()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    alternate_phone: '',
    emergency_phone: '',
    email: '',
    address: '',
    id_type: '',
    id_number: '',
    notes: '',
  })

  const update = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }))

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !staff?.business_id) { 
      toast.error('Name and phone are required'); return 
    }
    
    setSaving(true)
    try {
      const integrationSettings = (activeBranch?.settings as any)?.integrations || {}
      
      // 1. Phone validation
      if (integrationSettings.phone?.enabled) {
        toast.loading('Validating phone number...', { id: 'validation' })
        const phoneResult = await integrations.validatePhone(form.phone, integrationSettings.phone.numverify_key)
        if (phoneResult.error) {
           console.warn('Phone validation error:', phoneResult.error)
        } else if (phoneResult.valid === false) {
           toast.error('Invalid mobile number. Please check and try again.', { id: 'validation' })
           setSaving(false)
           return
        }
      }

      // 2. Email validation
      if (form.email && integrationSettings.email?.enabled) {
        toast.loading('Verifying email address...', { id: 'validation' })
        const emailResult = await integrations.validateEmail(form.email, integrationSettings.email.cloudmersive_key)
        if (emailResult.error) {
           console.warn('Email validation error:', emailResult.error)
        } else if (emailResult.valid === false) {
           toast.error('The email address provided is invalid or inactive.', { id: 'validation' })
           setSaving(false)
           return
        }
      }

      toast.loading('Saving customer data...', { id: 'validation' })
      const supabase = createClient()

      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', form.phone)
        .eq('business_id', staff.business_id)
        .eq('branch_id', activeBranch?.id || staff.branch_id)
        .maybeSingle()

      let customerId;

      if (existing) {
        const { error } = await supabase.from('customers').update({
          name: form.name, email: form.email || null,
          phone: form.phone,
          alternate_phone: form.alternate_phone || null,
          emergency_phone: form.emergency_phone || null,
          address: form.address || null, id_type: form.id_type || null,
          id_number: form.id_number || null, notes: form.notes || null,
        }).eq('id', existing.id)
        if (error) throw error
        customerId = existing.id
      } else {
        const { data, error } = await supabase.from('customers').insert({
          business_id: staff.business_id,
          branch_id: activeBranch?.id || staff.branch_id,
          name: form.name, phone: form.phone, email: form.email || null,
          alternate_phone: form.alternate_phone || null,
          emergency_phone: form.emergency_phone || null,
          address: form.address || null, id_type: form.id_type || null,
          id_number: form.id_number || null, notes: form.notes || null,
        }).select('id').single()
        if (error) throw error
        customerId = data.id
      }
      
      toast.success('Customer saved successfully!', { id: 'validation' })
      router.push(`/customers/${customerId}`)
    } catch (error: any) { 
      toast.error(error.message || 'Failed to save customer', { id: 'validation' }) 
    } finally { 
      setSaving(false) 
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild><Link href="/customers"><ChevronLeft className="w-4 h-4 mr-1" />Back</Link></Button>
        <h1 className="text-xl font-semibold">Add Customer</h1>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Full name *</Label><Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Arun Kumar" /></div>
            <div className="space-y-2"><Label>Phone *</Label><Input value={form.phone} onChange={(e) => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Alternate phone</Label><Input value={form.alternate_phone} onChange={(e) => update('alternate_phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Optional" /></div>
            <div className="space-y-2"><Label>Emergency phone</Label><Input value={form.emergency_phone} onChange={(e) => update('emergency_phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Optional" /></div>
          </div>
          <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={(e) => update('email', e.target.value)} type="email" /></div>
          <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={(e) => update('address', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>ID Type</Label><Input value={form.id_type} onChange={(e) => update('id_type', e.target.value)} placeholder="Aadhaar" /></div>
            <div className="space-y-2"><Label>ID Number</Label><Input value={form.id_number} onChange={(e) => update('id_number', e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>Notes</Label><textarea className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm min-h-[60px]" value={form.notes} onChange={(e) => update('notes', e.target.value)} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" asChild><Link href="/customers">Cancel</Link></Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Customer'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
