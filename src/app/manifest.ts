import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fabb booking',
    short_name: 'Fabb booking',
    description: 'Internal clothing rental operations',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#4f46e5',
    orientation: 'any',
    icons: [
      { src: '/brand/fabb-booking-icon-180.png', sizes: '180x180', type: 'image/png' },
      { src: '/brand/fabb-booking-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/brand/fabb-booking-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
