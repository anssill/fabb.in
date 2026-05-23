'use client'

import * as React from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrandLogo } from '@/components/brand/BrandLogo'

const navLinks = [
  { name: 'About', href: '#about' },
  { name: 'Workflow', href: '#how-it-works' },
  { name: 'Features', href: '#features' },
  { name: 'Pricing', href: '#pricing' },
]

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-5">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between rounded-[1.75rem] bg-[#f7f8fd]/95 px-5 shadow-sm ring-1 ring-white/80 backdrop-blur">
        <Link href="/" className="flex items-center text-slate-950">
          <BrandLogo className="h-9 w-28" priority />
        </Link>

        <div className="hidden items-center gap-9 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-xs font-medium uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-950"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-950"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="flex h-10 items-center justify-center rounded-full bg-[#4f46e5] px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#4338ca]"
          >
            Sign Up
          </Link>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm md:hidden"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label="Toggle navigation"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </nav>

      <div
        className={cn(
          'mx-auto mt-2 max-w-6xl overflow-hidden rounded-[1.25rem] bg-white shadow-sm transition-all md:hidden',
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 border-transparent opacity-0'
        )}
      >
        <div className="space-y-2 p-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="block rounded-2xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Link href="/login" className="flex h-10 items-center justify-center rounded-full border border-slate-100 text-sm font-medium">
              Login
            </Link>
            <Link href="/signup" className="flex h-10 items-center justify-center rounded-full bg-[#4f46e5] text-sm font-medium text-white">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
