'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Mail, RotateCcw, ArrowLeft, Loader2 } from 'lucide-react'
import { safeJsonParse } from '@/lib/api-utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultEmail: string
}

export function ForgotPasswordModal({ open, onOpenChange }: Props) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'input' | 'sent' | 'not_found'>('input')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setEmail('')
      setState('input')
    }
  }, [open])

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
      }
    } catch {
      setState('not_found')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        showCloseButton={false}
        className="max-w-[440px] bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[2rem] overflow-hidden outline-none p-0 text-white"
      >
        {state === 'input' && (
          <>
            <DialogHeader className="flex flex-col gap-1 p-8 pb-2">
              <DialogTitle className="text-2xl font-bold text-white">Reset Password</DialogTitle>
              <DialogDescription className="text-sm font-normal text-slate-400">
                Enter your email and we&apos;ll send a recovery link.
              </DialogDescription>
            </DialogHeader>
            <div className="p-8 pt-2 pb-6 flex flex-col gap-6">
              <div className="space-y-2">
                <Label htmlFor="modalEmail" className="text-sm font-medium text-slate-300 ml-1 block">Work Email</Label>
                <div className="relative group transition-all">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <Input
                    id="modalEmail"
                    placeholder="name@company.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 pl-11 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 transition-all hover:border-white/20 focus:border-emerald-500/50 outline-none shadow-inner"
                  />
                </div>
              </div>
              <Button
                className="h-14 font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 mt-2 rounded-xl group relative overflow-hidden"
                onClick={handleSend}
                disabled={!email || loading}
              >
                {loading ? (
                  <RotateCcw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span className="relative z-10">Send Recovery Link</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0" />
                  </>
                )}
              </Button>
            </div>
            <DialogFooter className="p-8 pt-0 flex flex-col sm:flex-col sm:justify-center">
              <Button
                variant="ghost"
                className="text-slate-400 font-medium hover:text-white transition-colors"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}

        {state === 'sent' && (
          <div className="p-10 text-center flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Check your email</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                We sent a recovery link to <span className="font-bold text-white">{email}</span>
              </p>
            </div>
            
            <Alert
              className="text-xs py-3 bg-amber-500/10 border-amber-500/20 text-amber-500 rounded-xl text-left"
            >
              <AlertTitle className="font-bold">Check your spam folder</AlertTitle>
              <AlertDescription>If you haven&apos;t received it yet, checking your spam folder is a good idea.</AlertDescription>
            </Alert>

            <Button
              className="w-full bg-primary text-white font-bold h-14 rounded-xl mt-2 flex items-center justify-center gap-2 group relative overflow-hidden"
              onClick={handleSend}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                  <span className="relative z-10">
                    Resend link
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0" />
                </>
              )}
            </Button>
            
            <Button
              variant="ghost"
              className="w-full text-slate-400 font-medium flex items-center justify-center gap-2 hover:text-white transition-all"
              onClick={() => onOpenChange(false)}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Button>
          </div>
        )}

        {state === 'not_found' && (
          <div className="p-10 text-center flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Email not found</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                No account found for <span className="text-white font-bold">{email}</span>. Please double-check or contact support.
              </p>
            </div>
            
            <Button
              className="w-full h-14 bg-primary text-white mt-2 font-bold shadow-lg shadow-primary/20 rounded-xl group relative overflow-hidden"
              onClick={() => setState('input')}
            >
              <span className="relative z-10">Try a different email</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0" />
            </Button>

            <Button
              variant="ghost"
              className="text-slate-400 font-medium hover:text-white transition-colors"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
