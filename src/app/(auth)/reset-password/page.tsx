'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Button, 
  TextField,
  Label,
  Input
} from '@heroui/react'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle, Lock, ArrowRight, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { safeJsonParse } from '@/lib/api-utils'

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
  const [supabase] = useState(() => createClient())

  const [sessionSet, setSessionSet] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // onAuthStateChange fires immediately with the current auth state,
    // including PASSWORD_RECOVERY when the session was set by /auth/callback.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setSessionSet(true)
      } else if (event === 'SIGNED_OUT') {
        setSessionSet(false)
      }
    })

    // Fallback: if no event fires within 3s, treat the link as invalid
    const timer = setTimeout(() => {
      setSessionSet((prev) => (prev === null ? false : prev))
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [supabase])

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
      // Get the session access token to authorize the backend request
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) throw new Error('Not authenticated')

      // Use the built-in route so we can update BOTH Auth AND the 'staff' table password_hash simultaneously.
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({ password }),
      })
      const data = await safeJsonParse(res)
      if (!res.ok) {
        setError(data.error || 'Failed to reset password')
        return
      }
      
      // If the backend updated it successfully, sign them out so they can log in normally
      await supabase.auth.signOut()
      toast.success('Password updated successfully. Please log in.')
      setTimeout(() => router.push('/login'), 3000)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Loading state — verifying reset link
  if (sessionSet === null) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col relative overflow-hidden justify-center items-center py-12 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
        </div>
        <div className="z-10 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-slate-400 text-sm">Verifying your reset link...</p>
        </div>
      </div>
    )
  }

  // Invalid / expired link state
  if (sessionSet === false) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col relative overflow-hidden justify-center items-center py-12 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-red-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
        </div>
        <div className="w-full max-w-md z-10 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden text-center"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Link expired or invalid</h2>
            <p className="text-slate-400 mb-6">This reset link has expired or has already been used.</p>
            <Link href="/login">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 h-12 font-bold rounded-xl">
                Request new reset link
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  // Main reset form
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col relative overflow-hidden justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-xl z-10 relative">
        <div className="text-center mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3"
          >
            Fabb.booking
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400"
          >
            Set a new password for your account
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden"
        >
          {/* Inner top glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-white">Set new password</h2>
            </div>
            <p className="text-slate-400">Choose a strong password for your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              {/* New Password */}
              <div className="space-y-2">
                <TextField
                  value={password}
                  onChange={setPassword}
                  className="space-y-2"
                  isRequired
                  isDisabled={loading}
                >
                  <Label className="text-sm font-medium text-slate-300 ml-1">New Password</Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                    </div>
                    <Input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Min 8 characters"
                      className="w-full h-12 pl-11 pr-11 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 transition-all hover:border-white/20 focus:border-primary outline-none shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors z-10"
                      tabIndex={-1}
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </TextField>
                {password.length > 0 && (
                  <div className="space-y-1 px-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            i <= strength ? STRENGTH_COLORS[strength] : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-[10px] ${strength >= 4 ? 'text-green-400' : strength >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {STRENGTH_LABELS[strength]} — Min 8 characters, 1 uppercase, 1 number
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <TextField
                  value={confirm}
                  onChange={setConfirm}
                  className="space-y-2"
                  isRequired
                  isDisabled={loading}
                >
                  <Label className="text-sm font-medium text-slate-300 ml-1">Confirm Password</Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                    </div>
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repeat your password"
                      className="w-full h-12 pl-11 pr-11 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 transition-all hover:border-white/20 focus:border-primary outline-none shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors z-10"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </TextField>
                {confirm.length > 0 && password !== confirm && (
                  <p className="text-xs text-red-400 ml-1">Passwords do not match</p>
                )}
                {confirm.length > 0 && password === confirm && (
                  <p className="text-xs text-green-400 flex items-center gap-1 ml-1">
                    <CheckCircle className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 h-14 text-lg font-medium rounded-xl group relative overflow-hidden mt-2"
              size="lg"
              isDisabled={loading || strength < 4 || password !== confirm}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span className="relative z-10 font-bold tracking-wide">Set New Password</span>
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform relative z-10" />
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0" />
                </>
              )}
            </Button>

            <div className="pt-4 text-center">
              <span className="text-sm text-slate-400">Remember your password? </span>
              <Link 
                href="/login" 
                className="text-sm font-medium text-primary hover:text-primary-400 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
