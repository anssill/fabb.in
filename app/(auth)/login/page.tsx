'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Zap, Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const supabase = createClient()
  const [mode, setMode] = useState<'google' | 'email'>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGoogleLogin() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim()) { setError('Email is required'); return }
    if (!password) { setError('Password is required'); return }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)

      const { loginAction } = await import('@/lib/auth/actions')
      const result = await loginAction(formData)

      if (result?.error) {
        setError(result.error)
        setLoading(false)
      }
      // Redirect is handled by the server action or will happen automatically on re-render
    } catch (err) {
      setError('Connection error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center">
        <div className="mx-auto w-16 h-16 bg-[#CCFF00] rounded-2xl flex items-center justify-center mb-6">
          <Zap className="w-10 h-10 text-black" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Echo</h1>
        <p className="text-zinc-400 mb-8 font-medium">
          The definitive operating system for clothing rentals. Sign in to your store.
        </p>

        {/* Google Login */}
        <Button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full text-black font-semibold h-12 text-lg rounded-xl flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] disabled:opacity-50"
        >
          <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">or</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        {/* Email Login */}
        {mode === 'google' ? (
          <Button
            variant="outline"
            onClick={() => setMode('email')}
            className="w-full h-11 border-zinc-700 bg-zinc-800/50 text-zinc-300 rounded-xl font-medium hover:bg-zinc-800 hover:text-white"
          >
            Sign in with Email & Password
          </Button>
        ) : (
          <form onSubmit={handleEmailLogin} className="space-y-3 text-left">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-zinc-400 text-xs font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-zinc-400 text-xs font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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
              className="w-full h-11 text-black font-semibold rounded-xl transition-transform hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </Button>
          </form>
        )}

        {/* Signup Link */}
        <p className="text-zinc-500 text-sm mt-6">
          Don&apos;t have a store?{' '}
          <Link href="/signup" className="text-[#CCFF00] font-semibold hover:underline">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  )
}
