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
  metadataBase: new URL('https://www.fabbclothing.com'),
  title: 'Fabb booking',
  description: 'Internal rental operations for inventory, bookings, customers, finance and staff.',
  manifest: '/manifest.webmanifest',
  applicationName: 'Fabb booking',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Fabb booking' },
  authors: [{ name: 'Fabb Team' }],
  icons: {
    icon: [
      { url: '/brand/fabb-icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/fabb-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/brand/fabb-icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Fabb booking',
    description: 'Internal rental operations platform.',
    url: 'https://www.fabbclothing.com',
    siteName: 'Fabb booking',
    images: [
      {
        url: '/brand/fabb-booking-source.png',
        width: 1206,
        height: 1206,
        alt: 'Fabb booking logo',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fabb booking',
    description: 'Internal rental operations platform.',
    images: ['/brand/fabb-booking-source.png'],
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
                  var t = 'light';
                  var prefs = localStorage.getItem('fabb_display_prefs');
                  if (prefs) {
                    var parsed = JSON.parse(prefs);
                    if (parsed.theme) t = parsed.theme;
                  } else {
                    t = localStorage.getItem('theme') || 'light';
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

