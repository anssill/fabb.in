'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const testimonials = [
  {
    name: 'Rajesh Kumar',
    role: 'Owner, Raj Bridal Collections',
    location: 'Thrissur',
    quote: 'Fabb.booking has completely transformed how we manage our bridal rentals. We no longer worry about double-bookings, and our inventory tracking is finally accurate.',
    stars: 5,
    avatar: 'RK'
  },
  {
    name: 'Priya Sharma',
    role: 'Manager, Elegant Ethnic Wear',
    location: 'Chennai',
    quote: 'The washing queue management is a lifesaver. We know exactly when items are ready for the next customer. Professional invoicing is just a bonus!',
    stars: 5,
    avatar: 'PS'
  },
  {
    name: 'Ahmed Khan',
    role: 'Owner, Mens Formal Rentals',
    location: 'Bangalore',
    quote: 'The best rental software built for India. Supporting UPI payments and GST invoicing made our daily operations switch so smooth. Highly recommend.',
    stars: 5,
    avatar: 'AK'
  }
]

export function Testimonials() {
  return (
    <section className="py-24 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4"
          >
            Trusted by rental businesses across India
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-500"
          >
            Don&apos;t just take our word for it. Here&apos;s what our customers have to say.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.stars)].map((_, i) => (
                  <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-600 mb-8 italic">&quot;{testimonial.quote}&quot;</p>
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10 border border-slate-100">
                  <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
                    {testimonial.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="text-sm font-bold text-slate-900">{testimonial.name}</div>
                  <div className="text-xs text-slate-500">{testimonial.role}, {testimonial.location}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
