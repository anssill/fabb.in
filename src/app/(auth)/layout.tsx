'use client'

import { motion } from 'framer-motion'
import { Plus, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

const FEATURES = [
  'Manage bookings end-to-end in seconds',
  'Real-time inventory & washing queue',
  'Multi-branch with role-based access',
  'Automated customer receipts & SMS',
  'Analytics, P&L and audit logs built-in',
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#020617] flex-col justify-between p-12 relative overflow-hidden">
        {/* Orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
              <Plus className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tighter text-white">
              FABB<span className="text-primary">.BOOKING</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              The complete platform<br />for Indian rental boutiques
            </h2>
            <p className="mt-4 text-slate-400 text-lg">
              Trusted by boutiques across Kerala, Tamil Nadu & beyond.
            </p>
          </div>

          <ul className="space-y-4">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-slate-300 text-sm">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10">
          <blockquote className="border-l-2 border-primary/40 pl-4">
            <p className="text-slate-400 text-sm italic">&quot;Switched from paper registers to Fabb.booking — best decision for our boutique.&quot;</p>
            <footer className="mt-2 text-xs text-slate-500 font-semibold">— Priya Nair, Thrissur Bridal Studio</footer>
          </blockquote>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 px-6 py-5 border-b border-gray-100">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
            <Plus className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-gray-900">
            FABB<span className="text-primary">.BOOKING</span>
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            {children}
          </motion.div>
        </div>

        <p className="text-center text-xs text-gray-400 pb-6">
          © 2026 Fabb.booking · Built for Luxury Rental Retail
        </p>
      </div>
    </div>
  )
}
