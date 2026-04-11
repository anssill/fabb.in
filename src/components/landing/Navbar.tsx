'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, CalendarCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navLinks = [
  { name: 'Features', href: '#features' },
  { name: 'How it Works', href: '#how-it-works' },
  { name: 'Pricing', href: '#pricing' },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/80 backdrop-blur-md border-b border-slate-200 py-3 shadow-sm'
          : 'bg-transparent py-5'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform">
            <CalendarCheck size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Fabb<span className="text-blue-600">.</span>booking
          </span>
        </Link>

        {/* Center: Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" asChild size="sm" className="font-medium text-slate-600">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 font-medium px-5">
            <Link href="/signup">Start free trial</Link>
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-slate-600"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block text-base font-medium text-slate-900"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 flex flex-col gap-3">
                <Button variant="outline" asChild className="w-full justify-center">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild className="w-full justify-center bg-blue-600 hover:bg-blue-700">
                  <Link href="/signup">Start free trial</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
