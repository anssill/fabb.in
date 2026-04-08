import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Fabb.booking — Clothing Rental Management',
  description:
    'India\'s #1 SaaS for clothing rental businesses. Manage inventory, bookings, customers, and payments in one place.',
  keywords: ['clothing rental', 'rental management', 'SaaS', 'India', 'booking software'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
