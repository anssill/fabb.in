'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Play, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:flex lg:items-center lg:gap-16">
          {/* Left: Content */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6 border border-blue-100 shadow-sm">
              <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
              Made for Indian clothing rental businesses
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
              Manage your clothing <br className="hidden lg:block" />
              rental business <span className="text-blue-600">effortlessly</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              Bookings, inventory, payments and washing — all in one place. 
              The digital operating system that transforms your rental shop. 
              Built for India, inspired by global standards.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Button asChild size="lg" className="h-14 px-8 text-base bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200">
                <Link href="/signup">Start 14-day free trial</Link>
              </Button>
              <Button variant="outline" size="lg" className="h-14 px-8 text-base border-slate-200 hover:bg-slate-50">
                <Play className="mr-2 h-4 w-4 fill-current" />
                See how it works
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-500" />
                Cancel anytime
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-500" />
                Free setup
              </div>
            </div>
          </motion.div>

          {/* Right: Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 mt-16 lg:mt-0 relative"
          >
            <div className="relative z-10 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl skew-y-1 hover:skew-y-0 transition-transform duration-500 shadow-blue-900/5">
              <div className="rounded-xl overflow-hidden border border-slate-100">
                <Image 
                  src="/images/hero-mockup.png" 
                  alt="Fabb.booking Dashboard Mockup" 
                  width={1200} 
                  height={800} 
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-50 -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
