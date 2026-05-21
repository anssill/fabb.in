'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { LogIn, Mail, Lock, Loader2, ArrowRight, Phone, KeyRound } from 'lucide-react';

function LoginForm() {
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  
  // Email states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone states
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (loginMethod === 'email') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        toast.success('Access granted. Welcome back.');
        router.push(searchParams.get('next') || '/dashboard');
        router.refresh();
      } else {
        if (!showOtp) {
          // Send OTP
          const res = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
          
          toast.success('OTP sent to your phone');
          setShowOtp(true);
        } else {
          // Verify OTP
          const res = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, code: otp }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Invalid OTP');
          
          toast.success('Access granted. Redirecting...');
          
          // Next.js will navigate to the magic link which logs the user in
          // Since the action_link has the hash, we can just assign window.location.href
          window.location.href = data.action_link;
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col relative overflow-hidden justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[160px]" />
      </div>

      <div className="w-full max-w-xl z-10 relative">
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/30"
          >
            <LogIn className="w-8 h-8 text-primary" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3"
          >
            FABB<span className="text-primary italic">.IN</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400 font-medium"
          >
            Authenticate to manage operations
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative overflow-hidden"
        >
          {/* Subtle top light bar */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          {/* Login Method Toggle */}
          {!showOtp && (
            <div className="flex bg-slate-950/50 p-1 rounded-2xl mb-8 border border-white/5">
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-xl transition-all ${loginMethod === 'email' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-xl transition-all ${loginMethod === 'phone' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Phone
              </button>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-6">
              {loginMethod === 'email' ? (
                <>
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Command Email</Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10 transition-colors">
                        <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-primary" />
                      </div>
                      <Input 
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="operator@fabb.in"
                        className="w-full h-14 pl-14 bg-slate-950/50 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:border-primary outline-none shadow-inner transition-all hover:bg-slate-950/80"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between ml-1">
                      <Label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Security Key</Label>
                      <Link href="/reset-password" title="Recover Access" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-white transition-colors">
                        Recover Key
                      </Link>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
                        <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-primary" />
                      </div>
                      <Input 
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full h-14 pl-14 bg-slate-950/50 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:border-primary outline-none shadow-inner transition-all hover:bg-slate-950/80"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {!showOtp ? (
                    <div className="space-y-3">
                      <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Phone Number</Label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10 transition-colors">
                          <Phone className="h-5 w-5 text-slate-500 group-focus-within:text-primary" />
                        </div>
                        <Input 
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          placeholder="9876543210"
                          className="w-full h-14 pl-14 bg-slate-950/50 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:border-primary outline-none shadow-inner transition-all hover:bg-slate-950/80"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center ml-1">
                        <Label htmlFor="otp" className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">One-Time Password</Label>
                        <button type="button" onClick={() => setShowOtp(false)} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-white transition-colors">
                          Change Phone
                        </button>
                      </div>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10 transition-colors">
                          <KeyRound className="h-5 w-5 text-slate-500 group-focus-within:text-primary" />
                        </div>
                        <Input 
                          id="otp"
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          required
                          maxLength={6}
                          placeholder="123456"
                          className="w-full h-14 pl-14 bg-slate-950/50 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:border-primary outline-none tracking-[0.5em] font-mono text-center shadow-inner transition-all hover:bg-slate-950/80"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/30 h-16 text-lg font-black rounded-2xl group relative overflow-hidden active:scale-[0.98] transition-transform"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <span className="flex items-center gap-3">
                  {loginMethod === 'phone' && !showOtp ? 'SEND OTP' : 'ACCESS COMMAND CENTER'} <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>

            {!showOtp && (
              <div className="pt-6 text-center">
                <span className="text-sm font-medium text-slate-500">New operator? </span>
                <Link 
                  href="/signup" 
                  className="text-sm font-bold text-primary hover:text-white transition-all underline underline-offset-4 decoration-primary/30"
                >
                  Create Business Account
                </Link>
              </div>
            )}
          </form>
        </motion.div>

        {/* Global Security Badge */}
        <div className="mt-12 flex justify-center opacity-30">
          <div className="px-4 py-2 border border-white/10 rounded-full flex items-center gap-3 bg-white/5 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">AES-256 Auth Shield Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
