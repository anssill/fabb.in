const PRODUCTION_APP_ORIGIN = 'https://fabbin-xi.vercel.app'

export function getAuthRedirectUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (typeof window === 'undefined') {
    return `${process.env.NEXT_PUBLIC_APP_URL || PRODUCTION_APP_ORIGIN}${normalizedPath}`
  }

  const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
  const origin = isLocalhost
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || PRODUCTION_APP_ORIGIN

  return `${origin}${normalizedPath}`
}
