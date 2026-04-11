'use client'

import * as React from 'react'
import Link from 'next/link'
import { CalendarCheck, Phone } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-slate-100 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6 group">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                <CalendarCheck size={18} />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Fabb.booking
              </span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              The digital operating system for clothing rental businesses in India. 
              Transforming chaos into clarity.
            </p>
            <div className="flex items-center gap-4">
              {/* Social icons removed for build stability */}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Product</h4>
            <ul className="space-y-4">
              <li><Link href="#features" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Features</Link></li>
              <li><Link href="#how-it-works" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">How it Works</Link></li>
              <li><Link href="#pricing" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Pricing</Link></li>
              <li><Link href="/signup" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Start Free Trial</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Legal</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Support</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Documentation</Link></li>
              <li><Link href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Help Center</Link></li>
              <li>
                <a href="https://wa.me/91XXXXXXXXXX" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  <Phone size={16} />
                  Contact on WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-slate-400">
            &copy; {currentYear} Fabb.booking. Made for Indian clothing rental businesses.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 italic">Built for India</span>
            <span className="w-5 h-3.5 bg-[#FF9933] block border-[0.5px] border-slate-100" />
            <span className="w-5 h-3.5 bg-white block border-[0.5px] border-slate-100" />
            <span className="w-5 h-3.5 bg-[#138808] block border-[0.5px] border-slate-100" />
          </div>
        </div>
      </div>
    </footer>
  )
}
