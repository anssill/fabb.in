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
  keywords: ['clothing rental', 'rental management', 'SaaS', 'India', 'booking software', 'kerala fashion'],
  authors: [{ name: 'Fabb.booking Team' }],
  openGraph: {
    title: 'Fabb.booking — Clothing Rental Management',
    description: 'Transform your clothing rental business with professional management software.',
    url: 'https://fabb-booking.com',
    siteName: 'Fabb.booking',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Fabb.booking Dashboard Preview',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fabb.booking — Clothing Rental Management',
    description: 'The all-in-one platform for professional clothing rental businesses.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning={true}>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
