'use client'

import { motion } from 'framer-motion'
import { Plus, CheckCircle2, Star, ShieldCheck, Zap, Globe, BarChart3 } from 'lucide-react'
import Link from 'next/link'

const FEATURES = [
  { text: 'Manage bookings end-to-end in seconds', icon: Zap },
  { text: 'Real-time inventory & washing queue', icon: ShieldCheck },
  { text: 'Multi-branch with role-based access', icon: Globe },
  { text: 'Automated customer receipts & SMS', icon: Star },
  { text: 'Analytics, P&L and audit logs built-in', icon: BarChart3 },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Brand Panel - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#050a14] flex-col justify-between p-12 relative overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-15%] left-[-10%] w-[80%] h-[80%] bg-primary/30 rounded-full blur-[120px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-blue-500/20 rounded-full blur-[120px]" 
          />
        </div>

        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/40 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
              <Plus className="text-white w-7 h-7" />
            </div>
            <span className="text-3xl font-extrabold tracking-tighter text-white">
              FABB<span className="text-primary font-black">.BOOKING</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl font-black text-white leading-tight tracking-tight">
              Scale Your Rental <br />
              <span className="text-primary italic">Boutique</span> Like Magic.
            </h2>
            <p className="mt-6 text-slate-400 text-xl font-medium max-w-md">
              The only SaaS platform built specifically for the unique needs of Indian bridal and luxury rental businesses.
            </p>
          </motion.div>

          <ul className="space-y-6">
            {FEATURES.map((f, i) => (
              <motion.li 
                key={f.text} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + (i * 0.1) }}
                className="flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/30 transition-all">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-slate-300 text-md font-semibold">{f.text}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="relative z-10"
        >
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              ))}
            </div>
            <p className="text-slate-300 text-sm italic font-medium leading-relaxed">
              &quot;Fabb.booking transformed our messy registers into a sleek digital experience. Our customers love the automated WhatsApp receipts!&quot;
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">PN</div>
              <div>
                <p className="text-white text-xs font-bold tracking-wide">Priya Nair</p>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Founder, Thrissur Bridal Studio</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col bg-slate-50/50 relative overflow-hidden">
        {/* Subtle Background Elements for Light Mode */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] -ml-64 -mb-64" />

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between px-6 py-6 border-b border-default-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Plus className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tighter text-foreground">
              FABB<span className="text-primary font-black">.BOOKING</span>
            </span>
          </Link>
        </div>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[420px]"
          >
            {children}
          </motion.div>
        </main>

        <footer className="text-center py-6 px-4 relative z-10">
          <p className="text-[10px] text-default-400 font-bold uppercase tracking-[0.2em]">
            © 2026 Fabb.booking · Built with <span className="text-red-500">♥</span> for Luxury Rental Retail
          </p>
        </footer>
      </div>
    </div>
  )
}
