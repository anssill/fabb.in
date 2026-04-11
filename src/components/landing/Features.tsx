'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { 
  CalendarCheck, 
  Package, 
  CreditCard, 
  Droplets, 
  Users, 
  BarChart3 
} from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'

const features = [
  {
    icon: CalendarCheck,
    title: 'Smart Bookings',
    description: 'Create bookings in seconds with our 6-step wizard. Track pickup, return and payments automatically.',
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  {
    icon: Package,
    title: 'Inventory Management',
    description: 'Track every item with size variants, photos, and real-time availability. Never double-book again.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  },
  {
    icon: CreditCard,
    title: 'Payment Tracking',
    description: 'Collect advance, deposit, and balance at the right time. Generate GST invoices instantly.',
    color: 'text-amber-600',
    bg: 'bg-amber-50'
  },
  {
    icon: Droplets,
    title: 'Washing Queue',
    description: 'Track items in washing and know exactly when they\'ll be ready for the next rental.',
    color: 'text-violet-600',
    bg: 'bg-violet-50'
  },
  {
    icon: Users,
    title: 'Customer Profiles',
    description: 'Keep a complete history of every customer\'s bookings and payments in one place.',
    color: 'text-rose-600',
    bg: 'bg-rose-50'
  },
  {
    icon: BarChart3,
    title: 'Business Analytics',
    description: 'Understand your revenue, popular items, and business trends with clear, actionable reports.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50'
  }
]

export function Features() {
  return (
    <section id="features" className="py-24 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4"
          >
            Everything your rental business needs
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-500"
          >
            Built specifically for Indian clothing rental shops — the precision of 
            Booqable meets local business workflows.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full border-none shadow-sm hover:shadow-md transition-shadow group">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
