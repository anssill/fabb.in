'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    city: '',
  })

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      // Establish the Supabase session in the browser so middleware can read it
      const supabase = createClient()
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })

      toast.success('Account created! Setting up your workspace...')
      router.push('/setup')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-semibold">Start your free trial</CardTitle>
        <CardDescription>
          Set up your rental business in 2 minutes. No credit card required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business name</Label>
            <Input
              id="businessName"
              placeholder="e.g. Raj Bridal Collections"
              value={form.businessName}
              onChange={(e) => updateField('businessName', e.target.value)}
              required
              minLength={2}
              maxLength={100}
              disabled={loading}
            />
            <p className="text-xs text-slate-400">Will become your account name on Fabb.booking</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerName">Your name</Label>
            <Input
              id="ownerName"
              placeholder="e.g. Rajesh Kumar"
              value={form.ownerName}
              onChange={(e) => updateField('ownerName', e.target.value)}
              required
              minLength={2}
              maxLength={100}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signupEmail">Work email</Label>
            <Input
              id="signupEmail"
              type="email"
              placeholder="you@yourbusiness.com"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
              disabled={loading}
            />
            <p className="text-xs text-slate-400">This becomes your login email</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">WhatsApp number</Label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 bg-slate-100 border border-slate-200 rounded-md text-sm text-slate-600 shrink-0">
                +91
              </div>
              <Input
                id="phone"
                type="tel"
                placeholder="98765 43210"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
                pattern="[6-9]\d{9}"
                title="Enter a valid 10-digit Indian mobile number"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-slate-400">For account support and SMS</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="e.g. Thrissur"
              value={form.city}
              onChange={(e) => updateField('city', e.target.value)}
              required
              minLength={2}
              maxLength={100}
              disabled={loading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full h-10 bg-blue-600 hover:bg-blue-700" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating your account...
              </>
            ) : (
              'Create free account →'
            )}
          </Button>

          <p className="text-xs text-slate-400 text-center">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in →
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
