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
  BadgeCheck,
  Briefcase,
  Star,
  Mail,
  Phone
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'


const STEPS = [
  { label: 'Business', icon: Building2, description: 'Core Profile', sub: 'Define your identity' },
  { label: 'Branch', icon: MapPin, description: 'Main Store', sub: 'Where magic happens' },
  { label: 'Staff', icon: Users, description: 'Team Setup', sub: 'Add your co-pilots', skippable: true },
  { label: 'Inventory', icon: Package, description: 'Catalog', sub: 'What are we selling?', skippable: true },
  { label: 'Launch', icon: Rocket, description: 'Go Live', sub: 'Everything is ready', final: true },
]

const CATEGORIES = ['Kurtha', 'Suits', 'Loafers', 'Shoes', 'Cap', 'Accessories']

export default function SetupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Form States
  const [business, setBusiness] = useState({
    name: '', phone: '', email: '', address: '',
    city: '', state: '', pincode: '', gst_number: '',
    password: '', confirmPassword: '',
  })

  const [branch, setBranch] = useState({
    name: '', address: '', city: '', phone: '', prefix: '',
  })

  const [staffList, setStaffList] = useState<{ name: string; email: string; role: string }[]>([])
  const [items, setItems] = useState<{
    name: string; category: string; sizes: string; stock: number; price: number
  }[]>([])

  const progress = ((currentStep + 1) / STEPS.length) * 100

  // Initialization logic
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
        if (staffRecord.setup_completed) { router.replace('/dashboard'); return }

        const { data: bizData } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', staffRecord.business_id)
          .single()

        if (bizData) {
          setBusiness(prev => ({
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

        const { data: branchData } = await supabase
          .from('branches')
          .select('*')
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
      } catch (err) {
        console.error('Initialization error:', err)
      } finally {
        setInitializing(false)
      }
    }
    init()
  }, [router])

  const handleNext = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Session lost')

      const { data: staffRecord } = await supabase
        .from('staff')
        .select('business_id, branch_id')
        .eq('id', user.id)
        .single()

      if (!staffRecord) throw new Error('Profile missing')

      if (currentStep === 0) {
        // Validation for step 0
        if (business.password && business.password !== business.confirmPassword) {
          toast.error('Passwords do not match')
          return
        }

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

        if (bizError) throw new Error('Update failed: ' + bizError.message)

        if (business.password) {
          const { error: authError } = await supabase.auth.updateUser({ password: business.password })
          if (authError) throw new Error('Security update failed: ' + authError.message)
        }
        setCurrentStep(1)
      } else if (currentStep === 1) {
        const { error: branchError } = await supabase.from('branches').update({
          name: branch.name || undefined,
          address: branch.address || null,
          city: branch.city || null,
          phone: branch.phone || null,
          prefix: branch.prefix?.toUpperCase() || undefined,
        }).eq('id', staffRecord.branch_id)

        if (branchError) throw new Error('Branch update failed')
        setCurrentStep(2)
      } else if (currentStep === 2) {
        setCurrentStep(3)
      } else if (currentStep === 3) {
        setCurrentStep(4)
      }
    } catch (e: any) {
      toast.error(e.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Session expired')

      const { error } = await supabase
        .from('staff')
        .update({ setup_completed: true })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Workspace initialized successfully!')
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      toast.error('Finalization failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-4">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full"
        />
        <p className="text-slate-500 font-medium tracking-wide">Assembling your workspace...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[160px]" />
        <div className="absolute top-[20%] left-[10%] w-1 h-1 bg-white opacity-20 rounded-full shadow-[0_0_10px_2px_rgba(255,255,255,0.4)]" />
      </div>

      {/* Header */}
      <header className="px-8 py-8 border-b border-white/5 relative z-20 bg-[#020617]/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30 group cursor-default">
              <Plus className="text-white w-7 h-7 group-hover:rotate-90 transition-transform duration-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-white">FABB<span className="text-primary italic">.IN</span></h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">Workspace Setup</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            {STEPS.map((step, i) => (
              <div key={i} className={`flex items-center gap-2 ${i <= currentStep ? 'text-primary' : 'text-slate-600'}`}>
                <div className={`w-2 h-2 rounded-full ${i <= currentStep ? 'bg-primary' : 'bg-slate-800'}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{step.label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Overall Progress</span>
            <div className="w-40 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col py-16 relative z-10 px-4">
        <div className="max-w-4xl mx-auto w-full">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 md:p-20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative overflow-hidden"
            >
              {/* Glass background highlights */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10">
                {/* Step Icon & Header */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16">
                  <div className="w-20 h-20 bg-slate-950 border border-white/10 rounded-[2rem] flex items-center justify-center text-primary shadow-inner">
                    {(() => {
                      const Icon = STEPS[currentStep].icon
                      return <Icon className="w-10 h-10" />
                    })()}
                  </div>
                  <div className="text-center md:text-left">
                    <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px]">
                      Step 0{currentStep + 1} &mdash; {STEPS[currentStep].label}
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
                      {STEPS[currentStep].description}
                    </h2>
                    <p className="text-slate-400 text-lg font-medium">{STEPS[currentStep].sub}</p>
                  </div>
                </div>

                {/* Forms Rendering */}
                <div className="min-h-[300px]">
                  {currentStep === 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Business Identity */}
                      {/* Business Identity */}
                      <div className="col-span-full space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Business Identity</Label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10 transition-colors">
                            <Building2 className="h-5 w-5 text-slate-500 group-focus-within:text-primary" />
                          </div>
                          <Input 
                            value={business.name}
                            onChange={(e) => setBusiness({...business, name: e.target.value})}
                            placeholder="Acme Luxury Collections" 
                            className="w-full h-14 pl-14 bg-slate-950/50 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:border-primary outline-none shadow-inner transition-all hover:bg-slate-950/80" 
                          />
                        </div>
                      </div>

                      {/* Support Email */}
                      <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Support Email</Label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10 transition-colors">
                            <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-primary" />
                          </div>
                          <Input 
                            type="email"
                            value={business.email}
                            onChange={(e) => setBusiness({...business, email: e.target.value})}
                            placeholder="hello@acme.com" 
                            className="w-full h-14 pl-14 bg-slate-950/50 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:border-primary outline-none shadow-inner transition-all hover:bg-slate-950/80" 
                          />
                        </div>
                      </div>

                      {/* Primary Phone */}
                      <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Primary Phone</Label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10 transition-colors">
                            <Phone className="h-5 w-5 text-slate-500 group-focus-within:text-primary" />
                          </div>
                          <Input 
                            type="tel"
                            value={business.phone}
                            onChange={(e) => setBusiness({...business, phone: e.target.value})}
                            placeholder="+91 00000 00000" 
                            className="w-full h-14 pl-14 bg-slate-950/50 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:border-primary outline-none shadow-inner transition-all hover:bg-slate-950/80" 
                          />
                        </div>
                      </div>

                      {/* HQ Address */}
                      <div className="col-span-full space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">HQ Address</Label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10 transition-colors">
                            <MapPin className="h-5 w-5 text-slate-500 group-focus-within:text-primary" />
                          </div>
                          <Input 
                            value={business.address}
                            onChange={(e) => setBusiness({...business, address: e.target.value})}
                            placeholder="Main St, Floor 4, Suite 2" 
                            className="w-full h-14 pl-14 bg-slate-950/50 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:border-primary outline-none shadow-inner transition-all hover:bg-slate-950/80" 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Branch Name */}
                      {/* Branch Name */}
                      <div className="col-span-full space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Branch Name</Label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10 transition-colors">
                            <MapPin className="h-5 w-5 text-slate-500 group-focus-within:text-primary" />
                          </div>
                          <Input 
                            value={branch.name}
                            onChange={(e) => setBranch({...branch, name: e.target.value})}
                            placeholder="Main Flagship" 
                            className="w-full h-14 pl-14 bg-slate-950/50 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:border-primary outline-none shadow-inner transition-all hover:bg-slate-950/80" 
                          />
                        </div>
                      </div>

                      {/* Invoice Prefix */}
                      <div className="col-span-full space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Invoice Prefix</Label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10 transition-colors">
                            <Briefcase className="h-5 w-5 text-slate-500 group-focus-within:text-primary" />
                          </div>
                          <Input 
                            value={branch.prefix}
                            onChange={(e) => setBranch({...branch, prefix: e.target.value})}
                            placeholder="ABC" 
                            maxLength={3} 
                            className="w-full h-14 pl-14 bg-slate-950/50 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:border-primary outline-none shadow-inner transition-all hover:bg-slate-950/80" 
                          />
                        </div>
                        <p className="mt-2 text-[10px] font-bold text-slate-500 tracking-wider uppercase ml-1">Example ID: {branch.prefix || 'ABC'}-001</p>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <Users className="w-16 h-16 text-slate-700 mb-6" />
                      <p className="text-slate-400 max-w-sm mb-8">You can invite team members later from the Settings dashboard. Ready to skip?</p>
                      <Button variant="outline" className="h-14 px-10 rounded-2xl border-white/10" onClick={() => setCurrentStep(3)}>Skip Team Setup</Button>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <Package className="w-16 h-16 text-slate-700 mb-6" />
                      <p className="text-slate-400 max-w-sm mb-8">Let's populate your inventory once we're in the dashboard for a better experience.</p>
                      <Button variant="outline" className="h-14 px-10 rounded-2xl border-white/10" onClick={() => setCurrentStep(4)}>Skip Inventory</Button>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-10 shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)]">
                        <BadgeCheck size={80} />
                      </div>
                      <h3 className="text-4xl font-black text-white mb-4">Command Center Ready</h3>
                      <p className="text-slate-400 max-w-md text-lg leading-relaxed mb-12">
                        Your workspace is initialized. Click the button below to launch into your performance dashboard.
                      </p>
                      <Button 
                        size="lg"
                        className="h-20 px-16 bg-primary text-white text-xl font-black rounded-[2rem] shadow-2xl shadow-primary/40 group hover:scale-105 transition-all"
                        onClick={handleFinish}
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="animate-spin" /> : "ENTER DASHBOARD"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                {!STEPS[currentStep].final && (
                  <div className="mt-20 flex items-center justify-between border-t border-white/5 pt-10">
                    <Button 
                      variant="ghost" 
                      className="h-14 px-8 rounded-2xl hover:bg-white/5 text-slate-400 font-bold"
                      onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                      disabled={currentStep === 0 || loading}
                    >
                      <ChevronLeft className="mr-2 h-5 w-5" /> Back
                    </Button>
                    
                    <Button 
                      className="h-16 px-12 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all flex items-center gap-3"
                      onClick={handleNext}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : (
                        <>
                          NEXT PHASE <ChevronRight className="w-5 h-5" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Sidebar visual aid (Optional) */}
          <div className="mt-12 flex flex-col md:flex-row gap-6 items-center justify-center opacity-40">
             <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
               <Lock size={12} /> SSL SECURED
             </div>
             <div className="w-1 h-1 rounded-full bg-slate-800" />
             <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
               <BadgeCheck size={12} /> SUPABASE AUTH
             </div>
             <div className="w-1 h-1 rounded-full bg-slate-800" />
             <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
               <Star size={12} /> PREMIUM PLATFORM
             </div>
          </div>
        </div>
      </main>

      {/* Dynamic Design Decoration */}
      <div className="fixed top-1/2 left-0 -translate-y-1/2 pointer-events-none opacity-20">
         <div className="h-[400px] w-[1px] bg-gradient-to-b from-transparent via-primary to-transparent" />
      </div>
      <div className="fixed top-1/2 right-0 -translate-y-1/2 pointer-events-none opacity-20">
         <div className="h-[400px] w-[1px] bg-gradient-to-b from-transparent via-primary to-transparent" />
      </div>
    </div>
  )
}
