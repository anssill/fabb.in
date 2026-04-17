'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, 
  Building2, 
  MapPin, 
  Users, 
  Package, 
  Rocket, 
  Loader2, 
  Eye, 
  EyeOff,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Plus,
  Trash2,
  Lock,
  BadgeCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { safeJsonParse } from '@/lib/api-utils'

const STEPS = [
  { label: 'Business', icon: Building2, description: 'Core profile' },
  { label: 'Branch', icon: MapPin, description: 'Main location' },
  { label: 'Staff', icon: Users, description: 'Team setup', skippable: true },
  { label: 'Inventory', icon: Package, description: 'First items', skippable: true },
  { label: 'Go Live', icon: Rocket, description: 'Launch' },
]

const CATEGORIES = ['Kurtha', 'Suits', 'Loafers', 'Shoes', 'Cap', 'Accessories']

function getPasswordStrength(password: string): number {
  if (password.length === 0) return 0
  if (password.length < 6) return 1
  if (password.length >= 6 && !/[0-9]/.test(password)) return 2
  if (password.length >= 8 && /[0-9]/.test(password) && !/[A-Z]/.test(password)) return 3
  if (password.length >= 8 && /[0-9]/.test(password) && /[A-Z]/.test(password)) return 4
  return 2
}

const STRENGTH_COLORS = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']
const STRENGTH_LABELS = ['', 'Too short', 'Weak', 'Almost there', 'Strong']

export default function SetupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Step 1 — Business Details
  const [business, setBusiness] = useState({
    name: '', phone: '', email: '', address: '',
    city: '', state: '', pincode: '', gst_number: '',
    password: '', confirmPassword: '',
  })

  // Step 2 — Branch
  const [branch, setBranch] = useState({
    name: '', address: '', city: '', phone: '', prefix: '',
  })

  // Step 3 — Staff
  const [staffList, setStaffList] = useState<{ name: string; email: string; role: string }[]>([])

  // Step 4 — Inventory
  const [items, setItems] = useState<{
    name: string; category: string; sizes: string; stock: number; price: number
  }[]>([])

  const progress = ((currentStep + 1) / STEPS.length) * 100
  const passwordStrength = getPasswordStrength(business.password)

  // On mount: guard if already setup, pre-populate existing data
  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.replace('/login'); return }

        const { data: staffRecord } = await supabase
          .from('staff')
          .select('business_id, branch_id, setup_completed')
          .eq('id', user.id)
          .single()

        if (!staffRecord) { router.replace('/login'); return }

        if (staffRecord.setup_completed) {
          router.replace('/dashboard')
          return
        }

        // Pre-populate business data
        const { data: bizData } = await supabase
          .from('businesses')
          .select('name, phone, email, address, city, state, pincode, gst_number')
          .eq('id', staffRecord.business_id)
          .single()

        if (bizData) {
          setBusiness((prev) => ({
            ...prev,
            name: bizData.name || '',
            phone: bizData.phone || '',
            email: bizData.email || '',
            address: bizData.address || '',
            city: bizData.city || '',
            state: bizData.state || '',
            pincode: bizData.pincode || '',
            gst_number: bizData.gst_number || '',
          }))
        }

        // Pre-populate branch data
        const { data: branchData } = await supabase
          .from('branches')
          .select('name, address, city, phone, prefix')
          .eq('id', staffRecord.branch_id)
          .single()

        if (branchData) {
          setBranch({
            name: branchData.name || '',
            address: branchData.address || '',
            city: branchData.city || '',
            phone: branchData.phone || '',
            prefix: branchData.prefix || '',
          })
        }
      } catch {
        // Non-fatal, proceed with empty state
      } finally {
        setInitializing(false)
      }
    }
    init()
  }, [router])

  const getStaffInfo = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data: staffRecord } = await supabase
      .from('staff')
      .select('business_id, branch_id')
      .eq('id', user.id)
      .single()
    if (!staffRecord) throw new Error('Staff record not found')
    return { user, staffRecord, supabase }
  }

  const handleNext = async () => {
    setLoading(true)
    try {
      if (currentStep === 0) {
        if (!business.password || business.password.length < 8) {
          toast.error('Password must be at least 8 characters')
          return
        }
        if (!/[A-Z]/.test(business.password) || !/[0-9]/.test(business.password)) {
          toast.error('Password must contain at least 1 uppercase letter and 1 number')
          return
        }
        if (business.password !== business.confirmPassword) {
          toast.error('Passwords do not match')
          return
        }

        const { staffRecord, supabase } = await getStaffInfo()

        const { error: bizError } = await supabase.from('businesses').update({
          name: business.name || undefined,
          phone: business.phone || null,
          email: business.email || null,
          address: business.address || null,
          city: business.city || null,
          state: business.state || null,
          pincode: business.pincode || null,
          gst_number: business.gst_number || null,
        }).eq('id', staffRecord.business_id)

        if (bizError) throw new Error('Failed to update business details')

        // Step 1 - Update Business + Password
        const res = await fetch('/api/setup/update-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: business.password }),
        })
        
        if (!res.ok) {
          const d = await safeJsonParse(res)
          throw new Error(d.error || 'Failed to update password')
        }

        // Update local state and current staff record for step 0
        const { staffRecord, supabase } = await getStaffInfo()
        const { error: bizError } = await supabase.from('businesses').update({
          name: business.name || undefined,
          phone: business.phone || null,
          email: business.email || null,
          address: business.address || null,
          city: business.city || null,
          state: business.state || null,
          pincode: business.pincode || null,
          gst_number: business.gst_number || null,
        }).eq('id', staffRecord.business_id)

        if (bizError) throw new Error('Failed to update business details')

        setCurrentStep(1)
      } else if (currentStep === 1) {
        const { staffRecord, supabase } = await getStaffInfo()

        const { error: branchError } = await supabase.from('branches').update({
          name: branch.name || undefined,
          address: branch.address || null,
          city: branch.city || null,
          phone: branch.phone || null,
          prefix: branch.prefix ? branch.prefix.toUpperCase() : undefined,
        }).eq('id', staffRecord.branch_id)

        if (branchError) throw new Error('Failed to update branch details')

        setCurrentStep(2)
      } else if (currentStep === 2) {
        const { staffRecord } = await getStaffInfo()
        const validStaff = staffList.filter((s) => s.name && s.email)

        for (const s of validStaff) {
          try {
            await fetch('/api/staff/invite', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-business-id': staffRecord.business_id,
              },
              body: JSON.stringify({
                email: s.email,
                name: s.name,
                role: s.role,
                branchId: staffRecord.branch_id,
              }),
            })
          } catch {
            // Non-fatal
          }
        }
        setCurrentStep(3)
      } else if (currentStep === 3) {
        const { staffRecord, supabase } = await getStaffInfo()
        const validItems = items.filter((i) => i.name)

        for (const item of validItems) {
          try {
            const sku = `${item.category.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
            const { data: itemData } = await supabase
              .from('items')
              .insert({
                business_id: staffRecord.business_id,
                branch_id: staffRecord.branch_id,
                name: item.name,
                sku,
                category: item.category,
                price: item.price || 0,
                is_active: true,
              })
              .select('id')
              .single()

            if (itemData && item.sizes) {
              const sizes = item.sizes.split(',').map((s) => s.trim()).filter(Boolean)
              await supabase.from('item_variants').insert(
                sizes.map((size) => ({
                  item_id: itemData.id,
                  size,
                  total_stock: item.stock || 1,
                  available_stock: item.stock || 1,
                  reserved_stock: 0,
                }))
              )
            }
          } catch {
            // Non-fatal
          }
        }
        setCurrentStep(4)
      }
    } catch (e: any) {
      toast.error(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  const handleSkip = () => {
    setCurrentStep(currentStep + 1)
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Finalize setup in DB
      const { error } = await supabase
        .from('staff')
        .update({ setup_completed: true })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Your workspace is ready!')
      
      // Delay slightly to ensure DB propagation before layout reload
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 500)
    } catch (err: any) {
      console.error('Setup finish error:', err)
      toast.error('Failed to finalize setup: ' + (err.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const addStaff = () => {
    if (staffList.length >= 10) return
    setStaffList([...staffList, { name: '', email: '', role: 'staff' }])
  }

  const addItem = () => {
    setItems([...items, { name: '', category: 'Kurtha', sizes: 'S, M, L, XL', stock: 1, price: 0 }])
  }

  const inputClass = "bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-primary/50 focus:ring-primary/20 h-11 rounded-xl"

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="px-6 py-6 border-b border-white/5 relative z-10 bg-[#020617]/50 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Plus className="text-white w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tighter text-white">FABB<span className="text-primary">.BOOKING</span></span>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Onboarding Workspace</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-medium text-slate-400">Step {currentStep + 1} of {STEPS.length}</span>
            <div className="w-32 h-1.5 bg-white/5 rounded-full mt-1.5 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-primary"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col py-12 relative z-10">
        <div className="max-w-3xl mx-auto w-full px-6">
          
          {/* Step Navigation Bar */}
          <div className="flex justify-between mb-12 relative">
            <div className="absolute top-4 left-0 w-full h-0.5 bg-white/5 z-0" />
            {STEPS.map((step, i) => {
              const Icon = step.icon
              const isActive = i === currentStep
              const isDone = i < currentStep
              return (
                <div key={i} className="relative z-10 flex flex-col items-center gap-3">
                  <motion.div
                    animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 ${
                      isDone ? 'bg-primary text-white shadow-lg shadow-primary/20' : 
                      isActive ? 'bg-primary text-white ring-4 ring-primary/20 shadow-xl shadow-primary/30' : 
                      'bg-slate-900 border border-white/10 text-slate-500'
                    }`}
                  >
                    {isDone ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </motion.div>
                  <div className="flex flex-col items-center">
                    <span className={`text-xs font-bold leading-none ${isActive ? 'text-white' : 'text-slate-500'}`}>{step.label}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden min-h-[400px]"
            >
              {/* Step Heading */}
              <div className="mb-10 text-center md:text-left">
                <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">{STEPS[currentStep].label}</Badge>
                <h2 className="text-3xl font-bold text-white mb-2">{STEPS[currentStep].description}</h2>
                <p className="text-slate-400">Configure your parameters to start managing operations.</p>
              </div>

              {/* Step Forms */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2 space-y-2">
                      <Label className="text-slate-300">Business Name</Label>
                      <Input
                        value={business.name}
                        onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                        placeholder="Raj Bridal Collections"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Working Phone</Label>
                      <Input
                        value={business.phone}
                        onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Business Email</Label>
                      <Input
                        value={business.email}
                        onChange={(e) => setBusiness({ ...business, email: e.target.value })}
                        placeholder="hello@rajbridal.com"
                        className={inputClass}
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-2">
                      <Label className="text-slate-300">Full Address</Label>
                      <Input
                         value={business.address}
                         onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                         placeholder="Store street, block, etc."
                         className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">City</Label>
                      <Input
                        value={business.city}
                        onChange={(e) => setBusiness({ ...business, city: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">GST Number (Optional)</Label>
                      <Input
                        value={business.gst_number}
                        onChange={(e) => setBusiness({ ...business, gst_number: e.target.value })}
                        placeholder="22AAABB1234A1Z5"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2 mb-4 text-primary">
                      <Lock className="w-4 h-4" />
                      <span className="text-sm font-bold uppercase tracking-wider">Security Access</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Global Password</Label>
                        <div className="relative">
                          <Input
                            type={showPass ? 'text' : 'password'}
                            value={business.password}
                            onChange={(e) => setBusiness({ ...business, password: e.target.value })}
                            placeholder="Min 8 chars"
                            className={inputClass + " pr-12"}
                          />
                          <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {business.password && (
                          <div className="space-y-1">
                            <div className="flex gap-1">
                              {[1,2,3,4].map((i) => (
                                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= passwordStrength ? STRENGTH_COLORS[passwordStrength] : 'bg-white/10'}`} />
                              ))}
                            </div>
                            <p className={`text-xs ${passwordStrength >= 4 ? 'text-green-400' : passwordStrength >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {STRENGTH_LABELS[passwordStrength]}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Confirm Password</Label>
                        <div className="relative">
                          <Input
                            type={showConfirm ? 'text' : 'password'}
                            value={business.confirmPassword}
                            onChange={(e) => setBusiness({ ...business, confirmPassword: e.target.value })}
                            placeholder="Repeat password"
                            className={inputClass + " pr-12"}
                          />
                          <button onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Branch Name</Label>
                    <Input
                      value={branch.name}
                      onChange={(e) => setBranch({ ...branch, name: e.target.value })}
                      placeholder="Main Store - Thrissur"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Branch Address</Label>
                    <Input
                      value={branch.address}
                      onChange={(e) => setBranch({ ...branch, address: e.target.value })}
                      placeholder="Specific branch location"
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">City</Label>
                      <Input
                        value={branch.city}
                        onChange={(e) => setBranch({ ...branch, city: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Phone</Label>
                      <Input
                        value={branch.phone}
                        onChange={(e) => setBranch({ ...branch, phone: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
                    <Label className="text-primary text-xs font-bold uppercase tracking-widest">Booking Prefix</Label>
                    <Input
                      value={branch.prefix}
                      onChange={(e) => setBranch({ ...branch, prefix: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) })}
                      placeholder="TRT"
                      className="bg-transparent border-primary/20 text-white font-mono text-2xl h-14"
                    />
                    <p className="text-xs text-slate-500">
                      Sample Booking ID: <span className="text-primary font-mono">{branch.prefix || 'TRT'}-260521-001</span>
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {staffList.map((s, i) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={i} 
                        className="p-5 bg-white/5 border border-white/5 rounded-2xl flex flex-wrap gap-4 items-end group"
                      >
                        <div className="flex-1 min-w-[150px] space-y-1.5">
                          <Label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Name</Label>
                          <Input
                            value={s.name}
                            onChange={(e) => {
                              const updated = [...staffList]
                              updated[i] = { ...updated[i], name: e.target.value }
                              setStaffList(updated)
                            }}
                            className="bg-transparent border-white/10 h-10"
                            placeholder="Full Name"
                          />
                        </div>
                        <div className="flex-1 min-w-[200px] space-y-1.5">
                          <Label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Email</Label>
                          <Input
                            value={s.email}
                            onChange={(e) => {
                              const updated = [...staffList]
                              updated[i] = { ...updated[i], email: e.target.value }
                              setStaffList(updated)
                            }}
                            className="bg-transparent border-white/10 h-10"
                            placeholder="email@example.com"
                          />
                        </div>
                        <div className="w-28 space-y-1.5">
                          <Label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Role</Label>
                          <Select
                            value={s.role}
                            onValueChange={(v) => {
                              const updated = [...staffList]
                              updated[i] = { ...updated[i], role: v }
                              setStaffList(updated)
                            }}
                          >
                            <SelectTrigger className="bg-transparent border-white/10 h-10 px-3"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="staff">Staff</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-colors h-10"
                          onClick={() => setStaffList(staffList.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                  
                  <Button variant="outline" className="w-full border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 text-slate-400 hover:text-primary py-8 rounded-2xl group transition-all" onClick={addStaff}>
                    <div className="flex flex-col items-center gap-2">
                       <Plus size={20} className="group-hover:scale-110 transition-transform" />
                       <span className="text-sm font-semibold">Add Team Member</span>
                    </div>
                  </Button>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                   <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                    {items.map((item, i) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={i} 
                        className="p-6 bg-white/5 border border-white/5 rounded-[2rem] space-y-5"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="col-span-1 md:col-span-2 space-y-1.5">
                            <Label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Item Name</Label>
                            <Input
                              value={item.name}
                              onChange={(e) => {
                                const updated = [...items]
                                updated[i] = { ...updated[i], name: e.target.value }
                                setItems(updated)
                              }}
                              className="bg-black/20 border-white/5 h-10"
                              placeholder="Red Silk Kurtha"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">₹ / Day</Label>
                            <Input
                              type="number"
                              value={item.price || ''}
                              onChange={(e) => {
                                const updated = [...items]
                                updated[i] = { ...updated[i], price: Number(e.target.value) }
                                setItems(updated)
                              }}
                              className="bg-black/20 border-white/5 h-10 text-primary font-bold"
                              placeholder="500"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Category</Label>
                             <Select
                                value={item.category}
                                onValueChange={(v) => {
                                  const updated = [...items]
                                  updated[i] = { ...updated[i], category: v }
                                  setItems(updated)
                                }}
                              >
                                <SelectTrigger className="bg-black/20 border-white/5 h-10"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-slate-900 border-white/10 text-white">
                                  {CATEGORIES.map((c) => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Base Stock</Label>
                            <Input
                              type="number"
                              value={item.stock}
                              onChange={(e) => {
                                const updated = [...items]
                                updated[i] = { ...updated[i], stock: Number(e.target.value) }
                                setItems(updated)
                              }}
                              className="bg-black/20 border-white/5 h-10"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                           <p className="text-[10px] text-slate-600 italic">Variants will be auto-generated for sizes: {item.sizes}</p>
                           <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500/50 hover:text-red-500 hover:bg-red-500/10 h-8 text-xs"
                              onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                            >
                              <Trash2 size={14} className="mr-1" /> Remove
                            </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                   <Button variant="outline" className="w-full border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 text-slate-400 hover:text-primary py-8 rounded-2xl transition-all" onClick={addItem}>
                    <Plus size={20} className="mr-2" /> Add Inventory Item
                  </Button>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-10 text-center flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary"
                  >
                    <BadgeCheck size={64} />
                  </motion.div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Congratulations!</h2>
                    <p className="text-slate-400 max-w-sm mx-auto">Your premium workspace is now partially configured and ready for full operations.</p>
                  </div>
                  
                  <div className="w-full grid grid-cols-2 gap-4">
                     <div className="p-4 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center gap-1">
                        <span className="text-2xl font-bold text-white">{staffList.length + 1}</span>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Team Growth</span>
                     </div>
                     <div className="p-4 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center gap-1">
                        <span className="text-2xl font-bold text-white">{items.length}</span>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Inventory Load</span>
                     </div>
                  </div>

                  <div className="p-6 rounded-[2rem] bg-gradient-to-br from-primary/20 to-blue-500/10 border border-primary/20 w-full">
                    <p className="text-sm font-semibold text-white">Advanced Cloud Sync Enabled</p>
                    <p className="text-xs text-slate-400 mt-1">Multi-branch data isolation and real-time inventory updates are now active.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-10">
            <Button 
              variant="ghost" 
              onClick={handleBack} 
              disabled={currentStep === 0 || loading}
              className="text-slate-500 hover:text-white hover:bg-white/5 rounded-xl px-6"
            >
              <ChevronLeft className="mr-2 w-4 h-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-4">
              {STEPS[currentStep].skippable && (
                <button 
                  onClick={handleSkip}
                  className="text-slate-500 hover:text-white text-sm font-medium transition-colors"
                >
                  Skip for now
                </button>
              )}
              
              {currentStep < STEPS.length - 1 ? (
                <Button 
                  onClick={handleNext} 
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 text-white rounded-xl px-10 h-12 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] group"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                    <span className="flex items-center">
                      Continue <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  }
                </Button>
              ) : (
                <Button 
                  onClick={handleFinish}
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-12 h-14 text-lg font-bold shadow-xl shadow-primary/30 transition-all active:scale-[0.98]"
                >
                   {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                    <span className="flex items-center gap-2">
                       Launch Dashboard <Rocket className="w-6 h-6" />
                    </span>
                   }
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-[10px] text-slate-600 uppercase tracking-widest font-bold">
        Secure Environment · Tier-3 Data Redundancy · Fabb Cloud v2.1
      </footer>
    </div>
  )
}
