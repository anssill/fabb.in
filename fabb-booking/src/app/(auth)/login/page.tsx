'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Loader2, AlertCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { GoogleButton } from './components/GoogleButton'
import { ForgotPasswordModal } from './components/ForgotPasswordModal'

import { Suspense } from 'react'

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

      toast.success('Welcome back!')
      router.push(data.staff?.setup_completed === false ? '/setup' : redirect)
      router.refresh()
    } catch {
      setError({ message: 'Something went wrong. Please try again.', code: 'UNKNOWN' })
    } finally {
      setLoading(false)
    }
  }

  const errorIcon = error?.code === 'RATE_LIMITED' ? Clock : AlertCircle

  return (
    <>
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
          <CardDescription>Sign in to your Fabb.booking account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GoogleButton />

          <div className="relative flex items-center gap-4 py-2">
            <div className="flex-1 border-t border-slate-200" />
            <span className="text-xs text-slate-400 uppercase">or continue with email</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label htmlFor="remember" className="text-sm font-normal text-slate-600 cursor-pointer">
                  Remember me for 30 days
                </Label>
              </div>
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <Alert variant="destructive">
                {errorIcon === Clock ? <Clock className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              Register your business →
            </Link>
          </p>
        </CardFooter>
      </Card>

      <ForgotPasswordModal open={forgotOpen} onOpenChange={setForgotOpen} defaultEmail={email} />
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>}>
      <LoginContent />
    </Suspense>
  )
}
