'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Phone, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

const features = [
  'Unlimited Bookings',
  'Real-time Inventory Tracking',
  'GST Compliant Invoices',
  'Washing Queue Management',
  'Customer History',
  'Detailed Analytics',
  'Multi-branch Support',
  'Staff Role Management'
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4"
          >
            Simple, transparent pricing
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-500"
          >
            One platform, everything you need. No hidden fees.
          </motion.p>
        </div>

        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white p-8 sm:p-12 shadow-2xl shadow-blue-900/5 lg:flex lg:items-center lg:gap-16"
          >
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
            
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-6">
                All-Inclusive Plan
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Everything for Your Business</h3>
              <p className="text-slate-500 mb-8">
                We believe in simple pricing that scales with you. No complex tiers, 
                just one comprehensive operating system.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 mb-8">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                      <Check size={12} className="text-blue-600" />
                    </div>
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-shrink-0 text-center lg:text-left bg-slate-50 p-8 rounded-2xl border border-slate-100">
              <div className="mb-6">
                <span className="text-sm font-medium text-slate-500">Contact us for</span>
                <div className="text-4xl font-extrabold text-slate-900 mt-1">Custom Pricing</div>
                <p className="text-xs text-slate-400 mt-2">Personalized setup & support included</p>
              </div>
              
              <Button asChild className="w-full h-12 bg-[#25D366] hover:bg-[#128C7E] shadow-lg shadow-green-900/10">
                <a href="https://wa.me/91XXXXXXXXXX?text=Hi, I am interested in Fabb.booking for my rental business." target="_blank" rel="noopener noreferrer">
                  <Phone className="mr-2 h-5 w-5 fill-current" />
                  Talk to us about pricing
                </a>
              </Button>
              <p className="text-[10px] text-slate-400 mt-4 text-center">
                Average setup time: 24-48 hours
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
