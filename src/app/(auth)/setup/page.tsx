'use client'

import { useEffect, useState } from 'react'
import type { ElementType } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Package,
  Phone,
  Rocket,
  Store,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

const STEPS = [
  { label: 'Business', icon: Building2, description: 'Business profile', sub: 'Saved to your Supabase business record' },
  { label: 'Branch', icon: Store, description: 'Main branch', sub: 'Set the counter details used by bookings' },
  { label: 'Staff', icon: Users, description: 'Team setup', sub: 'Invite your staff later from Settings' },
  { label: 'Inventory', icon: Package, description: 'Catalog setup', sub: 'Add your first products from the dashboard' },
  { label: 'Launch', icon: Rocket, description: 'Workspace ready', sub: 'Open the dashboard and start operating', final: true },
]

export default function SetupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  const [business, setBusiness] = useState({
    name: '', phone: '', email: '', address: '',
    city: '', state: '', pincode: '', gst_number: '',
    password: '', confirmPassword: '',
  })

  const [branch, setBranch] = useState({
    name: '', address: '', city: '', phone: '', prefix: '',
  })

  const progress = ((currentStep + 1) / STEPS.length) * 100

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.replace('/login')
          return
        }

        const { data: staffRecord } = await supabase
          .from('staff')
          .select('business_id, branch_id, setup_completed')
          .eq('id', user.id)
          .single()

        if (!staffRecord) {
          router.replace('/login')
          return
        }
        if (staffRecord.setup_completed) {
          router.replace('/dashboard')
          return
        }

        const [{ data: bizData }, { data: branchData }] = await Promise.all([
          supabase.from('businesses').select('*').eq('id', staffRecord.business_id).single(),
          supabase.from('branches').select('*').eq('id', staffRecord.branch_id).single(),
        ])

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

        if (branchData) {
          setBranch({
            name: branchData.name || '',
            address: branchData.address || '',
            city: branchData.city || '',
            phone: branchData.phone || '',
            prefix: branchData.prefix || '',
          })
        }
      } catch (error) {
        console.error('Initialization error:', error)
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

        if (bizError) throw new Error('Business update failed: ' + bizError.message)

        if (business.password) {
          const { error: authError } = await supabase.auth.updateUser({ password: business.password })
          if (authError) throw new Error('Password update failed: ' + authError.message)
        }

        toast.success('Business profile saved')
        setCurrentStep(1)
      } else if (currentStep === 1) {
        const { error: branchError } = await supabase.from('branches').update({
          name: branch.name || undefined,
          address: branch.address || null,
          city: branch.city || null,
          phone: branch.phone || null,
          prefix: branch.prefix?.toUpperCase() || undefined,
        }).eq('id', staffRecord.branch_id)

        if (branchError) throw new Error('Branch update failed: ' + branchError.message)

        toast.success('Main branch saved')
        setCurrentStep(2)
      } else if (currentStep === 2) {
        setCurrentStep(3)
      } else if (currentStep === 3) {
        setCurrentStep(4)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Operation failed')
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

      toast.success('Workspace initialized successfully')
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Finalization failed')
    } finally {
      setLoading(false)
    }
  }

  if (initializing) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#e9ebf5] text-slate-500">
        <div className="flex flex-col items-center gap-4 rounded-[1.65rem] bg-white p-8 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-[#4f46e5]" />
          <p className="text-sm font-medium">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  const ActiveIcon = STEPS[currentStep].icon

  return (
    <main className="min-h-screen bg-[#e9ebf5] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-[1.75rem] bg-[#f7f8fd] p-4 shadow-sm ring-1 ring-white/80">
          <div className="flex h-full flex-col rounded-[1.65rem] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#4f46e5] text-white">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold">Fabb.booking</p>
                <p className="text-xs text-slate-500">Workspace setup</p>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Overall progress</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[#4f46e5] transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="mt-8 space-y-2">
              {STEPS.map((step, index) => {
                const Icon = step.icon
                const active = index === currentStep
                const done = index < currentStep
                return (
                  <div key={step.label} className={active ? 'flex items-center gap-3 rounded-2xl bg-[#4f46e5] px-3 py-3 text-white' : 'flex items-center gap-3 rounded-2xl px-3 py-3 text-slate-500'}>
                    <span className={active ? 'grid h-9 w-9 place-items-center rounded-xl bg-white/15' : done ? 'grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600' : 'grid h-9 w-9 place-items-center rounded-xl bg-slate-50'}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{step.label}</p>
                      <p className={active ? 'text-xs text-white/70' : 'text-xs text-slate-400'}>{step.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>

        <section className="rounded-[1.75rem] bg-[#f7f8fd] p-4 shadow-sm ring-1 ring-white/80">
          <Card className="min-h-full rounded-[1.65rem] border-0 bg-white shadow-sm">
            <CardContent className="flex min-h-full flex-col p-5 sm:p-8">
              <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-slate-100 text-[#4f46e5]">
                    <ActiveIcon className="h-7 w-7" />
                  </span>
                  <div>
                    <Badge className="rounded-full border-0 bg-indigo-50 text-[#4f46e5]">Step {currentStep + 1} of {STEPS.length}</Badge>
                    <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">{STEPS[currentStep].description}</h1>
                    <p className="mt-2 text-sm text-slate-500">{STEPS[currentStep].sub}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                {currentStep === 0 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <SetupField icon={Building2} label="Business name" value={business.name} placeholder="Acme Luxury Collections" onChange={(value) => setBusiness({ ...business, name: value })} className="md:col-span-2" />
                    <SetupField icon={Mail} label="Support email" type="email" value={business.email} placeholder="hello@acme.com" onChange={(value) => setBusiness({ ...business, email: value })} />
                    <SetupField icon={Phone} label="Primary phone" value={business.phone} placeholder="+91 00000 00000" onChange={(value) => setBusiness({ ...business, phone: value })} />
                    <SetupField icon={MapPin} label="Address" value={business.address} placeholder="Main St, Floor 4" onChange={(value) => setBusiness({ ...business, address: value })} className="md:col-span-2" />
                    <SetupField icon={MapPin} label="City" value={business.city} placeholder="Ahmedabad" onChange={(value) => setBusiness({ ...business, city: value })} />
                    <SetupField icon={MapPin} label="State" value={business.state} placeholder="Gujarat" onChange={(value) => setBusiness({ ...business, state: value })} />
                    <SetupField icon={MapPin} label="Pincode" value={business.pincode} placeholder="380001" onChange={(value) => setBusiness({ ...business, pincode: value })} />
                    <SetupField icon={BadgeCheck} label="GST number" value={business.gst_number} placeholder="Optional" onChange={(value) => setBusiness({ ...business, gst_number: value })} />
                    <SetupField icon={LockKeyhole} label="New password" type="password" value={business.password} placeholder="Optional" onChange={(value) => setBusiness({ ...business, password: value })} />
                    <SetupField icon={LockKeyhole} label="Confirm password" type="password" value={business.confirmPassword} placeholder="Repeat password" onChange={(value) => setBusiness({ ...business, confirmPassword: value })} />
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <SetupField icon={Store} label="Branch name" value={branch.name} placeholder="Main Flagship" onChange={(value) => setBranch({ ...branch, name: value })} className="md:col-span-2" />
                    <SetupField icon={MapPin} label="Branch address" value={branch.address} placeholder="Counter address" onChange={(value) => setBranch({ ...branch, address: value })} className="md:col-span-2" />
                    <SetupField icon={MapPin} label="City" value={branch.city} placeholder="Ahmedabad" onChange={(value) => setBranch({ ...branch, city: value })} />
                    <SetupField icon={Phone} label="Phone" value={branch.phone} placeholder="+91 00000 00000" onChange={(value) => setBranch({ ...branch, phone: value })} />
                    <SetupField icon={BadgeCheck} label="Invoice prefix" value={branch.prefix} placeholder="ABC" maxLength={3} onChange={(value) => setBranch({ ...branch, prefix: value.toUpperCase() })} />
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                      Example booking number: <span className="font-semibold text-slate-950">{branch.prefix || 'ABC'}-001</span>
                    </div>
                  </div>
                )}

                {currentStep === 2 && <SkipPanel icon={Users} title="Invite your team later" detail="Staff permissions, attendance and role setup live in Settings once the dashboard is open." />}
                {currentStep === 3 && <SkipPanel icon={Package} title="Add inventory from the dashboard" detail="The full inventory form has image upload, pricing, sizes and availability tools." />}
                {currentStep === 4 && (
                  <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                    <span className="grid h-24 w-24 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                      <BadgeCheck className="h-12 w-12" />
                    </span>
                    <h2 className="mt-6 text-3xl font-semibold tracking-normal">Command center ready</h2>
                    <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                      Your Supabase records are connected. Finish setup to unlock the dashboard.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
                <Button variant="ghost" className="rounded-full text-slate-500" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0 || loading}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                {STEPS[currentStep].final ? (
                  <Button className="h-11 rounded-full bg-[#4f46e5] px-5 text-white hover:bg-[#4338ca]" onClick={handleFinish} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Enter dashboard <ArrowRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                ) : (
                  <Button className="h-11 rounded-full bg-[#4f46e5] px-5 text-white hover:bg-[#4338ca]" onClick={handleNext} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}

function SetupField({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  maxLength,
  className = '',
}: {
  icon: ElementType
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
  maxLength?: number
  className?: string
}) {
  const id = label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          id={id}
          type={type}
          value={value}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-12 rounded-2xl border-slate-100 bg-slate-50 pl-11 text-sm shadow-none focus-visible:ring-[#4f46e5]"
        />
      </div>
    </div>
  )
}

function SkipPanel({ icon: Icon, title, detail }: { icon: ElementType; title: string; detail: string }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[1.65rem] bg-slate-50 p-8 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-3xl bg-white text-[#4f46e5] shadow-sm">
        <Icon className="h-9 w-9" />
      </span>
      <h2 className="mt-6 text-2xl font-semibold tracking-normal">{title}</h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">{detail}</p>
    </div>
  )
}
