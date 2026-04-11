'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff, Loader2, AlertCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { GoogleButton } from './components/GoogleButton'
import { ForgotPasswordModal } from './components/ForgotPasswordModal'
import { createClient } from '@/lib/supabase/client'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ message: string; code: string } | null>(null)
  const [forgotOpen, setForgotOpen] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError({ message: data.error, code: data.code })
        return
      }

      const supabase = createClient()
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })

      toast.success('Welcome back!')
      router.push(data.staff?.setup_completed === false ? '/setup' : redirect)
      router.refresh()
    } catch {
      setError({ message: 'Something went wrong. Please try again.', code: 'UNKNOWN' })
    } finally {
      setLoading(false)
    }
  }

  const ErrorIcon = error?.code === 'RATE_LIMITED' ? Clock : AlertCircle

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
        <p className="text-sm text-gray-500">Sign in to your dashboard to manage bookings</p>
      </div>

      <div className="space-y-4">
        <GoogleButton />

        <div className="relative flex items-center gap-3 py-1">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">or continue with email</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Work Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@business.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null) }}
              autoFocus
              required
              disabled={loading}
              className="h-11 rounded-lg border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-primary/20"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                tabIndex={-1}
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null) }}
                required
                disabled={loading}
                className="h-11 rounded-lg border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-primary/20 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
              className="border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Label htmlFor="remember" className="text-sm font-normal text-gray-500 cursor-pointer select-none">
              Keep me signed in for 30 days
            </Label>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              <ErrorIcon className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error.message}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm shadow-primary/20 transition-all active:scale-[0.99]"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In to Dashboard'
            )}
          </Button>
        </form>
      </div>

      <div className="text-center pt-2 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          New to Fabb.booking?{' '}
          <Link href="/signup" className="text-primary hover:text-primary/80 font-semibold transition-colors">
            Register Business →
          </Link>
        </p>
      </div>

      <ForgotPasswordModal open={forgotOpen} onOpenChange={setForgotOpen} defaultEmail={email} />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
      <LoginContent />
    </Suspense>
  )
}
