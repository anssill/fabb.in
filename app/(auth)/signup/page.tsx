'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Zap, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'

type RentalType = 'bridal' | 'general' | 'both'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [businessName, setBusinessName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [rentalType, setRentalType] = useState<RentalType>('both')

  const validatePhone = (p: string): boolean => /^[6-9]\d{9}$/.test(p.replace(/[\s\-+91]/g, ''))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!businessName.trim()) { setError('Business name is required'); return }
    if (!ownerName.trim()) { setError('Your name is required'); return }
    if (!validatePhone(phone)) { setError('Enter a valid 10-digit Indian phone number'); return }
    if (!email.trim() || !email.includes('@')) { setError('Enter a valid email'); return }
    if (!city.trim()) { setError('City is required'); return }

    setLoading(true)

    try {
      const supabase = createClient()
      const cleanPhone = phone.replace(/[\s\-+91]/g, '').slice(-10)
      const subdomain = businessName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)

      // 1. Create business
      const { data: business, error: bizErr } = await supabase.from('businesses').insert({
        name: businessName.trim(),
        subdomain,
        plan: 'basic',
        status: 'active',
      }).select().single()

      if (bizErr) {
        if (bizErr.message.includes('duplicate') || bizErr.message.includes('unique')) {
          setError('A business with this name already exists. Try a different name.')
        } else {
          setError('Failed to create business. Please try again.')
        }
        setLoading(false)
        return
      }

      // 2. Create branch
      const { data: branch, error: branchErr } = await supabase.from('branches').insert({
        business_id: business.id,
        name: `${businessName.trim()} — Main`,
        prefix: businessName.trim().slice(0, 3).toUpperCase(),
        subdomain_prefix: subdomain,
        contact: `+91${cleanPhone}`,
        settings: {
          min_advance_pct: 30,
          max_advance_days: 180,
          buffer_days: 1,
          monthly_revenue_target: 100000,
          low_stock_threshold: 1,
          tier_thresholds: { silver: 5000, gold: 15000, platinum: 30000 },
          watermark_enabled: false,
        },
      }).select().single()

      if (branchErr) {
        setError('Failed to create branch. Please try again.')
        setLoading(false)
        return
      }

      // 3. Store signup request (for admin visibility)
      await supabase.from('signup_requests').insert({
        business_name: businessName.trim(),
        owner_name: ownerName.trim(),
        phone: cleanPhone,
        email: email.trim().toLowerCase(),
        city: city.trim(),
        rental_type: rentalType,
        status: 'approved',
        business_id: business.id,
      })

      // 4. Now sign up with Google OAuth — the callback will handle staff record creation
      // For now, show success and redirect to login
      setStep('success')

      // 5. Fire process-signup edge function (fire and forget)
      supabase.functions.invoke('process-signup', {
        body: {
          business_name: businessName.trim(),
          owner_name: ownerName.trim(),
          phone: cleanPhone,
          email: email.trim().toLowerCase(),
          city: city.trim(),
          business_id: business.id,
          subdomain,
        },
      }).catch(() => {})

    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
            Your store is ready! 🎉
          </h1>
          <p className="text-zinc-400 mb-2 font-medium">
            <span className="text-[#CCFF00] font-bold">{businessName}</span> has been created.
          </p>
          <p className="text-zinc-500 text-sm mb-8">
            Sign in with Google to access your dashboard and start setting up your inventory.
          </p>
          <Button
            onClick={() => router.push('/login')}
            className="w-full text-black font-semibold h-12 text-lg rounded-xl transition-transform hover:scale-[1.02]"
          >
            Go to Login <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 bg-[#CCFF00] rounded-2xl flex items-center justify-center mb-5">
            <Zap className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
            Create your Echo store
          </h1>
          <p className="text-zinc-400 text-sm font-medium">
            Set up your clothing rental business in under 2 minutes
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName" className="text-zinc-300 text-sm font-medium">
              Business Name *
            </Label>
            <Input
              id="businessName"
              placeholder="e.g. Royal Bridal Collection"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="h-11 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-xl focus:ring-[#CCFF00] focus:border-[#CCFF00]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ownerName" className="text-zinc-300 text-sm font-medium">
                Your Name *
              </Label>
              <Input
                id="ownerName"
                placeholder="Full name"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="h-11 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city" className="text-zinc-300 text-sm font-medium">
                City *
              </Label>
              <Input
                id="city"
                placeholder="e.g. Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-11 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-zinc-300 text-sm font-medium">
              Phone Number *
            </Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 h-11 text-sm text-zinc-400 bg-zinc-800 border border-r-0 border-zinc-700 rounded-l-xl font-medium">
                +91
              </span>
              <Input
                id="phone"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="h-11 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-l-none rounded-r-xl"
                maxLength={10}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300 text-sm font-medium">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300 text-sm font-medium">Rental Type *</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'bridal', label: 'Bridal' },
                { value: 'general', label: 'General' },
                { value: 'both', label: 'Both' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRentalType(opt.value)}
                  className={`h-10 rounded-xl text-sm font-semibold transition-all border ${
                    rentalType === opt.value
                      ? 'bg-[#CCFF00] text-black border-[#CCFF00]'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-black font-bold text-base rounded-xl mt-2 transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating your store...
              </>
            ) : (
              <>
                Create Store <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-zinc-500 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[#CCFF00] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
