/** Only allow local destinations after authentication. */
export function safeAuthNextPath(value: string | null, fallback = '/dashboard'): string {
  if (!value?.startsWith('/') || value.startsWith('//')) return fallback
  try {
    const base = 'https://fabb.invalid'
    const destination = new URL(value, base)
    if (destination.origin !== base) return fallback
    return destination.pathname + destination.search + destination.hash
  } catch {
    return fallback
  }
}

export function getPostLoginPath(staff: { role: string; setup_completed: boolean | null }): string {
  if (staff.role === 'super_admin') return '/admin/dashboard'
  return staff.role === 'owner' && !staff.setup_completed ? '/setup' : '/dashboard'
}
