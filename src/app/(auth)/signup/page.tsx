'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    city: '',
  })

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n })
    if (error) setError('')
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setFieldErrors({})

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.fieldErrors && typeof data.fieldErrors === 'object') {
          const fe: Record<string, string> = {}
          for (const [k, v] of Object.entries(data.fieldErrors)) {
            fe[k] = Array.isArray(v) ? (v[0] as string) : String(v)
          }
          setFieldErrors(fe)
        }
        setError(typeof data.error === 'string' ? data.error : 'Please fix the errors below.')
        return
      }

      const supabase = createClient()
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })

      toast.success('Account created! Setting up your workspace...')
      router.push('/setup')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Register your business</h1>
        <p className="text-sm text-gray-500">Start your 14-day free trial — no credit card required</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="businessName" className="text-sm font-medium text-gray-700">Business Name</Label>
          <Input
            id="businessName"
            placeholder="e.g. Raj Bridal Collections"
            value={form.businessName}
            onChange={(e) => updateField('businessName', e.target.value)}
            required
            minLength={2}
            maxLength={100}
            disabled={loading}
            className={`h-11 rounded-lg border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-primary/20 ${fieldErrors.businessName ? 'border-red-400 focus:border-red-400' : ''}`}
          />
          {fieldErrors.businessName && <p className="text-xs text-red-500">{fieldErrors.businessName}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ownerName" className="text-sm font-medium text-gray-700">Your Name</Label>
            <Input
              id="ownerName"
              placeholder="Full Name"
              value={form.ownerName}
              onChange={(e) => updateField('ownerName', e.target.value)}
              required
              minLength={2}
              maxLength={100}
              disabled={loading}
              className={`h-11 rounded-lg border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-primary/20 ${fieldErrors.ownerName ? 'border-red-400' : ''}`}
            />
            {fieldErrors.ownerName && <p className="text-xs text-red-500">{fieldErrors.ownerName}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-sm font-medium text-gray-700">City</Label>
            <Input
              id="city"
              placeholder="Thrissur"
              value={form.city}
              onChange={(e) => updateField('city', e.target.value)}
              required
              minLength={2}
              maxLength={100}
              disabled={loading}
              className={`h-11 rounded-lg border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-primary/20 ${fieldErrors.city ? 'border-red-400' : ''}`}
            />
            {fieldErrors.city && <p className="text-xs text-red-500">{fieldErrors.city}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signupEmail" className="text-sm font-medium text-gray-700">Work Email</Label>
          <Input
            id="signupEmail"
            type="email"
            placeholder="you@yourbusiness.com"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            required
            disabled={loading}
            className={`h-11 rounded-lg border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-primary/20 ${fieldErrors.email ? 'border-red-400' : ''}`}
          />
          {fieldErrors.email && <p className="text-xs text-red-500">{fieldErrors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">WhatsApp Number</Label>
          <div className="flex gap-2">
            <div className="flex items-center px-3.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 shrink-0 font-semibold">
              +91
            </div>
            <Input
              id="phone"
              type="tel"
              placeholder="98765 43210"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              required
              pattern="[6-9][0-9]{9}"
              title="Enter a valid 10-digit Indian mobile number"
              disabled={loading}
              className={`h-11 rounded-lg border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-primary/20 ${fieldErrors.phone ? 'border-red-400' : ''}`}
            />
          </div>
          {fieldErrors.phone && <p className="text-xs text-red-500">{fieldErrors.phone}</p>}
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm shadow-primary/20 transition-all active:scale-[0.99] group"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Account...
            </>
          ) : (
            <span className="flex items-center gap-2">
              Start Free Trial
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </Button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>14-day free trial · No credit card · Cancel anytime</span>
        </div>
      </form>

      <div className="text-center pt-2 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">
            Sign in →
          </Link>
        </p>
      </div>

      <p className="text-[11px] text-gray-400 text-center leading-relaxed">
        By continuing, you agree to our{' '}
        <Link href="#" className="underline underline-offset-2 hover:text-gray-600">Terms of Service</Link>
        {' '}and{' '}
        <Link href="#" className="underline underline-offset-2 hover:text-gray-600">Privacy Policy</Link>.
      </p>
    </div>
  )
}
