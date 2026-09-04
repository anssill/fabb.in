import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fabb Rental Management',
    short_name: 'Fabb',
    description: 'Internal clothing rental operations',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#e9ebf5',
    theme_color: '#4f46e5',
    orientation: 'any',
    icons: [
      { src: '/brand/fabb-icon-180.png', sizes: '180x180', type: 'image/png' },
      { src: '/brand/fabb-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/brand/fabb-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
