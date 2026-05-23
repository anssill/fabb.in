'use client'

import { useState } from 'react'
import type { ElementType } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Building2, CalendarCheck, Loader2, LockKeyhole, LogIn, Mail, ShieldCheck, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    businessName: '',
    fullName: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { signUpAction } = await import('@/lib/auth/actions')
      const result = await signUpAction(formData)

      if (result?.error) throw new Error(result.error)

      toast.success('Workspace created. Finish your business profile next.')
      router.push('/setup')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (id: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  return (
    <main className="min-h-screen bg-[#e9ebf5] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[430px_1fr]">
        <section className="rounded-[1.75rem] bg-[#f7f8fd] p-4 shadow-sm ring-1 ring-white/80">
          <div className="rounded-[1.65rem] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">New workspace</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">Create your business account</h1>
              </div>
              <Link href="/login" className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-slate-500 hover:text-[#4f46e5]" aria-label="Log in">
                <LogIn className="h-4 w-4" />
              </Link>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <Field icon={Building2} id="businessName" label="Business name" value={formData.businessName} placeholder="Fabb Rentals" autoComplete="organization" onChange={(value) => handleChange('businessName', value)} />
              <Field icon={User} id="fullName" label="Owner name" value={formData.fullName} placeholder="Your name" autoComplete="name" onChange={(value) => handleChange('fullName', value)} />
              <Field icon={Mail} id="email" label="Email address" type="email" value={formData.email} placeholder="owner@boutique.com" autoComplete="email" onChange={(value) => handleChange('email', value)} />
              <Field icon={LockKeyhole} id="password" label="Password" type="password" value={formData.password} placeholder="Minimum 8 characters" autoComplete="new-password" minLength={8} onChange={(value) => handleChange('password', value)} />

              <Button type="submit" disabled={loading} className="h-12 w-full rounded-full bg-[#4f46e5] text-white shadow-sm hover:bg-[#4338ca]">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create workspace <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have a workspace?{' '}
              <Link href="/login" className="font-semibold text-[#4f46e5] hover:underline">Log in</Link>
            </p>
          </div>
        </section>

        <section className="hidden rounded-[1.75rem] bg-[#f7f8fd] p-5 shadow-sm ring-1 ring-white/80 lg:block">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#4f46e5] shadow-sm">
              <CalendarCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold">Fabb.booking</p>
              <p className="text-xs text-slate-500">Supabase powered setup</p>
            </div>
          </div>

          <div className="mt-12 rounded-[1.65rem] bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">What gets created</p>
            <h2 className="mt-3 max-w-lg text-4xl font-semibold leading-tight tracking-normal text-slate-950">
              One signup creates your business, owner profile and first branch.
            </h2>
            <div className="mt-8 grid gap-3">
              {['Business profile in Supabase', 'Default branch with booking prefix', 'Owner staff record for dashboard access'].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                  <ShieldCheck className="h-4 w-4 text-[#4f46e5]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function Field({
  icon: Icon,
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  minLength,
}: {
  icon: ElementType
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder: string
  autoComplete: string
  minLength?: number
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="h-12 rounded-2xl border-slate-100 bg-slate-50 pl-11 text-sm shadow-none focus-visible:ring-[#4f46e5]"
        />
      </div>
    </div>
  )
}
