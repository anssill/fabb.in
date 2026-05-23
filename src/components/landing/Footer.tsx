'use client'

import Link from 'next/link'
import { CalendarCheck } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#e9ebf5]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex items-center gap-2 text-slate-950">
          <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-white text-[#4f46e5] shadow-sm">
            <CalendarCheck className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold">Fabb.booking</span>
        </Link>
        <p className="text-sm text-slate-500">&copy; {currentYear} Fabb.booking. Rental operations, simplified.</p>
        <div className="flex gap-4 text-sm font-medium text-slate-600">
          <Link href="/login" className="hover:text-slate-950">Login</Link>
          <Link href="/signup" className="hover:text-slate-950">Sign Up</Link>
        </div>
      </div>
    </footer>
  )
}
