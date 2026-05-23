import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://fabbin-xi.vercel.app'),
  title: 'Fabb — Clothing Rental Management',
  description:
    'India\'s #1 SaaS for clothing rental businesses. Manage inventory, bookings, customers, and payments in one place.',
  keywords: ['clothing rental', 'rental management', 'SaaS', 'India', 'booking software', 'kerala fashion'],
  authors: [{ name: 'Fabb Team' }],
  icons: {
    icon: [
      { url: '/brand/fabb-icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/fabb-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/brand/fabb-icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Fabb — Clothing Rental Management',
    description: 'Transform your clothing rental business with professional management software.',
    url: 'https://fabbin-xi.vercel.app',
    siteName: 'Fabb',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Fabb Dashboard Preview',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fabb — Clothing Rental Management',
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
      <head>
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var t = 'dark';
                  var prefs = localStorage.getItem('fabb_display_prefs');
                  if (prefs) {
                    var parsed = JSON.parse(prefs);
                    if (parsed.theme) t = parsed.theme;
                  } else {
                    t = localStorage.getItem('theme') || 'dark';
                  }
                  if (t === 'system') {
                    t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  if (t === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e){}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
