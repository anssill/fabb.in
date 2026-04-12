'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { safeJsonParse } from '@/lib/api-utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultEmail: string
}

export function ForgotPasswordModal({ open, onOpenChange, defaultEmail }: Props) {
  const [email, setEmail] = useState(defaultEmail)
  const [state, setState] = useState<'input' | 'sent' | 'not_found'>('input')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (open) {
      setEmail(defaultEmail)
      setState('input')
    }
  }, [open, defaultEmail])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleSend = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await safeJsonParse(res)
      if (data.code === 'NOT_FOUND') {
        setState('not_found')
      } else {
        setState('sent')
        setCooldown(60)
      }
    } catch {
      setState('not_found')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        {state === 'input' && (
          <>
            <DialogHeader>
              <DialogTitle>Reset your password</DialogTitle>
              <DialogDescription>Enter your email. We&apos;ll send a reset link.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                />
              </div>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleSend}
                disabled={loading || !email}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Send reset link
              </Button>
              <button
                onClick={() => onOpenChange(false)}
                className="w-full text-sm text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {state === 'sent' && (
          <div className="flex flex-col items-center text-center py-4 space-y-3">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <DialogHeader>
              <DialogTitle>Check your email</DialogTitle>
              <DialogDescription>We sent a reset link to {email}</DialogDescription>
            </DialogHeader>
            <p className="text-xs text-slate-400">Check your spam folder if not received.</p>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSend}
              disabled={cooldown > 0}
            >
              {cooldown > 0 ? `Resend link (${cooldown}s)` : 'Resend link'}
            </Button>
            <button
              onClick={() => onOpenChange(false)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Back to login
            </button>
          </div>
        )}

        {state === 'not_found' && (
          <div className="flex flex-col items-center text-center py-4 space-y-3">
            <XCircle className="w-12 h-12 text-red-500" />
            <DialogHeader>
              <DialogTitle>Email not found</DialogTitle>
              <DialogDescription>
                No account found for {email}. Contact your business admin to create your account.
              </DialogDescription>
            </DialogHeader>
            <button
              onClick={() => setState('input')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Try a different email
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
