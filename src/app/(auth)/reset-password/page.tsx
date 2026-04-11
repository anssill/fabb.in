'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

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

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setTokenValid(false)
      return
    }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => setTokenValid(d.valid))
      .catch(() => setTokenValid(false))
  }, [token])

  const strength = getPasswordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (strength < 4) {
      setError('Password must be at least 8 characters with 1 uppercase letter and 1 number')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to reset password')
        return
      }
      toast.success('Password updated successfully')
      setTimeout(() => router.push('/login'), 3000)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (tokenValid === null) {
    return (
      <Card className="shadow-sm border-slate-200">
        <CardContent className="flex justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    )
  }

  if (tokenValid === false) {
    return (
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <CardTitle>Link expired or invalid</CardTitle>
          <CardDescription>
            This reset link has expired or has already been used.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Request new reset link
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-semibold">Set new password</CardTitle>
        <CardDescription>Choose a strong password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPass ? 'text' : 'password'}
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= strength ? STRENGTH_COLORS[strength] : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${strength === 4 ? 'text-green-600' : 'text-slate-500'}`}>
                  {STRENGTH_LABELS[strength]} — Min 8 characters, 1 uppercase, 1 number
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="pr-10"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirm.length > 0 && password !== confirm && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
            {confirm.length > 0 && password === confirm && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Passwords match
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading || strength < 4 || password !== confirm}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Set new password'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
