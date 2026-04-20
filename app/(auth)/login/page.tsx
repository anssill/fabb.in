'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Zap, ArrowRight, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err) {
      console.error('Login error:', err)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Neon Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#CCFF00] opacity-[0.03] blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#CCFF00] opacity-[0.03] blur-[120px] rounded-full" />
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#CCFF00] rounded-3xl rotate-6 shadow-[0_0_50px_rgba(204,255,0,0.2)] mb-2">
            <Zap className="w-10 h-10 text-black" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
              Echo <span className="text-zinc-700">OS</span>
            </h1>
            <p className="text-zinc-400 font-medium">The Operating System for Rental Networks</p>
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-[2rem] shadow-2xl">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-bold text-white">Welcome Back</h2>
              <p className="text-sm text-zinc-500">Sign in to your account to continue</p>
            </div>

            <Button 
              size="lg"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-14 bg-white hover:bg-zinc-100 text-black font-bold rounded-2xl transition-all active:scale-[0.98] group flex items-center justify-center gap-3"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.11 0 5.72-1.01 7.64-2.74l-3.57-2.77c-1.01.69-2.26 1.1-3.64 1.1-2.97 0-5.48-2.01-6.38-4.7H2.35v2.9C4.25 20.48 7.85 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.62 13.93c-.23-.69-.36-1.44-.36-2.21s.13-1.52.36-2.21V6.6H2.35C1.53 8.23 1.07 10.06 1.07 12s.46 3.77 1.28 5.4l3.27-2.47z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.69 0 3.21.58 4.41 1.72l3.31-3.31C17.71 1.95 15.11 .75 12 .75c-4.15 0-7.75 2.52-9.65 6.13l3.27 2.47c.9-2.69 3.41-4.7 6.38-4.7z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>
          </div>
        </div>

        <p className="text-center text-zinc-600 text-xs px-8">
          By continuing, you agree to our <span className="text-zinc-500">Terms of Service</span> and <span className="text-zinc-500">Privacy Policy</span>.
        </p>
      </div>
    </div>
  )
}
