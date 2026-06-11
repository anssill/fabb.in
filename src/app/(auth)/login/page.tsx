'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Loader2, LockKeyhole, Mail, ShieldCheck, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { getAuthRedirectUrl } from '@/lib/auth/redirect-url'
import { ForgotPasswordModal } from './components/ForgotPasswordModal'

const proofPoints = [
  'Supabase secured workspace',
  'Branch, staff and booking data in one place',
  'Dashboard-ready after sign in',
]

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [password, setPassword] = useState('')
  const [loginMode, setLoginMode] = useState<'otp' | 'password'>('otp')
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const cleanEmail = email.trim().toLowerCase()

      if (loginMode === 'password') {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })

        if (error) throw error

        const complete = await fetch('/api/auth/complete-login', { method: 'POST' })
        const result = await complete.json().catch(() => ({}))
        if (!complete.ok) throw new Error(result.error || 'Unable to complete login')

        toast.success('Logged in successfully.')
        router.push(result.next || searchParams.get('next') || '/dashboard')
        router.refresh()
        return
      }

      if (!otpSent) {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: false,
            emailRedirectTo: getAuthRedirectUrl('/auth/callback'),
          },
        })

        if (error) throw error

        setOtpSent(true)
        toast.success('OTP sent to your email.')
        return
      }

      const { error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: otp.trim(),
        type: 'email',
      })

      if (error) throw error

      const complete = await fetch('/api/auth/complete-login', { method: 'POST' })
      const result = await complete.json().catch(() => ({}))
      if (!complete.ok) throw new Error(result.error || 'Unable to complete login')

      toast.success('Logged in successfully.')
      router.push(result.next || searchParams.get('next') || '/dashboard')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed'
      if (message.toLowerCase().includes('rate limit')) {
        toast.error('Email OTP request was blocked by the auth provider. You can use password login instead.')
      } else {
        toast.error(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#e9ebf5] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[1fr_430px]">
        <section className="hidden rounded-[1.75rem] bg-[#f7f8fd] p-5 shadow-sm ring-1 ring-white/80 lg:block">
          <div className="flex items-center gap-2">
            <BrandLogo className="h-10 w-32" priority />
            <div>
              <p className="text-sm font-bold">Fabb</p>
              <p className="text-xs text-slate-500">Rental command center</p>
            </div>
          </div>

          <div className="mt-12 rounded-[1.65rem] bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Today in your workspace</p>
            <h1 className="mt-3 max-w-md text-4xl font-semibold leading-tight tracking-normal text-slate-950">
              Pick up exactly where your rental floor left off.
            </h1>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                ['24', 'Bookings'],
                ['7', 'Returns'],
                ['Rs 48K', 'Collected'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-2xl font-bold tabular-nums">{value}</p>
                  <p className="mt-1 text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {proofPoints.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
                <ShieldCheck className="h-4 w-4 text-[#4f46e5]" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.75rem] bg-[#f7f8fd] p-4 shadow-sm ring-1 ring-white/80">
          <div className="rounded-[1.65rem] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Welcome back</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">Log in to Fabb</h2>
              </div>
              <Link href="/signup" className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-slate-500 hover:text-[#4f46e5]" aria-label="Create an account">
                <UserPlus className="h-4 w-4" />
              </Link>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="owner@boutique.com"
                    className="h-12 rounded-2xl border-slate-100 bg-slate-50 pl-11 text-sm shadow-none focus-visible:ring-[#4f46e5]"
                  />
                </div>
              </div>

              {otpSent && (
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-medium text-slate-700">Email OTP</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    autoComplete="one-time-code"
                    placeholder="Enter 6 digit code"
                    className="h-12 rounded-2xl border-slate-100 bg-slate-50 text-center text-lg font-semibold tracking-[0.3em] shadow-none focus-visible:ring-[#4f46e5]"
                  />
                </div>
              )}

              {loginMode === 'password' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                    <button
                      type="button"
                      onClick={() => setForgotOpen(true)}
                      className="text-xs font-semibold text-[#4f46e5] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="h-12 rounded-2xl border-slate-100 bg-slate-50 pl-11 text-sm shadow-none focus-visible:ring-[#4f46e5]"
                    />
                  </div>
                </div>
              )}

              <Button type="submit" disabled={loading} className="h-12 w-full rounded-full bg-[#4f46e5] text-white shadow-sm hover:bg-[#4338ca]">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{loginMode === 'password' ? 'Log in' : otpSent ? 'Verify OTP' : 'Send Email OTP'} <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => {
                setLoginMode((mode) => mode === 'otp' ? 'password' : 'otp')
                setOtpSent(false)
                setOtp('')
              }}
              className="mt-4 w-full text-center text-sm font-semibold text-[#4f46e5] hover:underline"
            >
              {loginMode === 'otp' ? 'Use password login instead' : 'Use email OTP instead'}
            </button>

            <p className="mt-6 text-center text-sm text-slate-500">
              New to Fabb?{' '}
              <Link href="/signup" className="font-semibold text-[#4f46e5] hover:underline">Create a workspace</Link>
            </p>
          </div>
        </section>
      </div>
      <ForgotPasswordModal open={forgotOpen} onOpenChange={setForgotOpen} defaultEmail={email} />
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#e9ebf5]" />}>
      <LoginForm />
    </Suspense>
  )
}
