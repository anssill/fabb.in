'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Button, 
  Card, 
  TextField,
  Label,
  Input 
} from '@heroui/react';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { LogIn, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast.success('Logged in successfully');
      
      const next = searchParams.get('next') || '/dashboard';
      router.push(next);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

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
            Welcome back to your business dashboard
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle inner top glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Login</h2>
            <p className="text-slate-400">Enter your email and password to access your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              <TextField
                type="email"
                value={email}
                onChange={setEmail}
                isRequired
                className="space-y-2"
              >
                <Label className="text-sm font-medium text-slate-300 ml-1">Email</Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                  </div>
                  <Input 
                    placeholder="name@example.com"
                    className="w-full h-12 pl-11 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 transition-all hover:border-white/20 focus:border-primary outline-none shadow-inner"
                  />
                </div>
              </TextField>

              <TextField
                type="password"
                value={password}
                onChange={setPassword}
                isRequired
                className="space-y-2"
              >
                <div className="flex items-center justify-between ml-1">
                  <Label className="text-sm font-medium text-slate-300">Password</Label>
                  <Link href="/login?modal=forgot-password" title="Forgot Password?" className="text-xs text-primary hover:text-primary-400 transition-colors">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                  </div>
                  <Input 
                    placeholder="••••••••"
                    className="w-full h-12 pl-11 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 transition-all hover:border-white/20 focus:border-primary outline-none shadow-inner"
                  />
                </div>
              </TextField>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 h-14 text-lg font-medium rounded-xl group relative overflow-hidden mt-6"
              size="lg"
              isDisabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span className="relative z-10 font-bold tracking-wide">Sign In to Dashboard</span>
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform relative z-10" />
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0" />
                </>
              )}
            </Button>

            <div className="pt-4 text-center">
              <span className="text-sm text-slate-400">Don&apos;t have an account? </span>
              <Link 
                href="/signup" 
                className="text-sm font-medium text-primary hover:text-primary-400 transition-colors"
              >
                Create Account
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
