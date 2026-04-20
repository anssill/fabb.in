'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Button, 
  TextField,
  Label,
  Input 
} from '@heroui/react';
import { toast } from 'sonner';
import { Mail, Lock, Building, User, ArrowRight, Loader2 } from 'lucide-react';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    businessName: '',
    fullName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { signUpAction } = await import('@/lib/auth/actions');
      const result = await signUpAction(formData);

      if (result?.error) {
        throw new Error(result.error);
      }

      toast.success('Account created! Please login.');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (id: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
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
            Start growing your business operations today
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
            <h2 className="text-2xl font-bold text-white mb-2">Create an account</h2>
            <p className="text-slate-400">Enter your details to register your business</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-5">
              
              {/* Business Name */}
              <TextField
                value={formData.businessName}
                onChange={(val) => handleChange('businessName', val)}
                isRequired
                className="space-y-2"
              >
                <Label className="text-sm font-medium text-slate-300 ml-1">Business Name</Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <Building className="h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                  </div>
                  <Input 
                    placeholder="Acme Inc."
                    className="w-full h-12 pl-11 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 transition-all hover:border-white/20 focus:border-primary outline-none shadow-inner"
                  />
                </div>
              </TextField>

              {/* Full Name */}
              <TextField
                value={formData.fullName}
                onChange={(val) => handleChange('fullName', val)}
                isRequired
                className="space-y-2"
              >
                <Label className="text-sm font-medium text-slate-300 ml-1">Full Name</Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <User className="h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                  </div>
                  <Input 
                    placeholder="John Doe"
                    className="w-full h-12 pl-11 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 transition-all hover:border-white/20 focus:border-primary outline-none shadow-inner"
                  />
                </div>
              </TextField>

              {/* Email */}
              <TextField
                type="email"
                value={formData.email}
                onChange={(val) => handleChange('email', val)}
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

              {/* Password */}
              <TextField
                type="password"
                value={formData.password}
                onChange={(val) => handleChange('password', val)}
                isRequired
                className="space-y-2"
              >
                <Label className="text-sm font-medium text-slate-300 ml-1">Password</Label>
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
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-white" />
              ) : (
                <>
                  <span className="relative z-10 font-bold tracking-wide">Create Business Account</span>
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform relative z-10" />
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0" />
                </>
              )}
            </Button>

            <div className="pt-4 text-center">
              <span className="text-sm text-slate-400">Already have an account? </span>
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
  );
}
