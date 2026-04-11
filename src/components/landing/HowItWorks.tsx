'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { UserPlus, Package, CalendarCheck, TrendingUp, ArrowRight } from 'lucide-react'

const steps = [
  {
    icon: UserPlus,
    title: 'Create your account',
    description: 'Sign up with your business details. No setup fees or hidden costs.',
    color: 'bg-blue-600'
  },
  {
    icon: Package,
    title: 'Add your inventory',
    description: 'Add your kurtha, suits, and accessories with photos and sizes.',
    color: 'bg-indigo-600'
  },
  {
    icon: CalendarCheck,
    title: 'Start taking bookings',
    description: 'Create bookings, collect payments, and track everything in real-time.',
    color: 'bg-emerald-600'
  },
  {
    icon: TrendingUp,
    title: 'Grow your business',
    description: 'Use clear analytics to understand performance and scale faster.',
    color: 'bg-rose-600'
  }
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold text-slate-900 mb-16"
        >
          Up and running in minutes
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-[52px] left-[15%] right-[15%] h-0.5 bg-slate-100 -z-10" />
          
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center group"
            >
              <div className={`w-14 h-14 rounded-full ${step.color} text-white flex items-center justify-center mb-6 shadow-lg shadow-blue-900/10 group-hover:scale-110 transition-transform duration-300 relative`}>
                <step.icon size={28} />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-100 shadow-sm">
                  {index + 1}
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed max-w-[200px]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
