/**
 * Granular Staff Permissions
 * 
 * Each permission maps to a specific module in the sidebar.
 * Stored in staff.permissions JSONB as { "manage_bookings": true, ... }
 * 
 * Owners & super_admins always have full access regardless of this field.
 */

export const PERMISSION_KEYS = [
  'manage_dashboard',
  'manage_bookings',
  'manage_inventory',
  'manage_customers',
  'manage_payments',
  'manage_washing',
  'manage_analytics',
  'manage_expenses',
  'manage_staff',
  'manage_settings',
] as const

export type PermissionKey = (typeof PERMISSION_KEYS)[number]

export interface PermissionDef {
  key: PermissionKey
  label: string
  description: string
}

export const PERMISSIONS: PermissionDef[] = [
  { key: 'manage_dashboard', label: 'Dashboard', description: 'View the main dashboard and stats' },
  { key: 'manage_bookings', label: 'Bookings', description: 'Create, view, and manage bookings' },
  { key: 'manage_inventory', label: 'Inventory', description: 'Add, edit, and view inventory items' },
  { key: 'manage_customers', label: 'Customers', description: 'View and manage customer records' },
  { key: 'manage_payments', label: 'Payments', description: 'View and record payments' },
  { key: 'manage_washing', label: 'Washing Queue', description: 'Manage the washing/cleaning queue' },
  { key: 'manage_analytics', label: 'Analytics', description: 'Access reports and analytics' },
  { key: 'manage_expenses', label: 'Expenses', description: 'Record and view business expenses' },
  { key: 'manage_staff', label: 'Staff Management', description: 'View and manage team members' },
  { key: 'manage_settings', label: 'Settings', description: 'Access business and app settings' },
]

/** Maps a sidebar href to the permission key required */
export const ROUTE_PERMISSION_MAP: Record<string, PermissionKey> = {
  '/dashboard': 'manage_dashboard',
  '/bookings': 'manage_bookings',
  '/inventory': 'manage_inventory',
  '/customers': 'manage_customers',
  '/payments': 'manage_payments',
  '/washing': 'manage_washing',
  '/analytics': 'manage_analytics',
  '/expenses': 'manage_expenses',
  '/staff': 'manage_staff',
  '/settings': 'manage_settings',
}

/**
 * Returns the default permission set — everything enabled.
 */
export function getDefaultPermissions(): Record<PermissionKey, boolean> {
  const perms: Record<string, boolean> = {}
  for (const key of PERMISSION_KEYS) {
    perms[key] = true
  }
  return perms as Record<PermissionKey, boolean>
}

/**
 * Check if a staff member has a specific permission.
 * Owners and super_admins always return true.
 */
export function hasPermission(
  role: string,
  permissions: Record<string, boolean> | null | undefined,
  key: PermissionKey
): boolean {
  // Owners and super_admins bypass all permission checks
  if (role === 'owner' || role === 'super_admin') return true

  // If permissions haven't been set yet, default to all-enabled
  if (!permissions || Object.keys(permissions).length === 0) return true

  // Explicit check
  return permissions[key] !== false
}

/**
 * Check if a staff member can access a specific route.
 */
export function canAccessRoute(
  role: string,
  permissions: Record<string, boolean> | null | undefined,
  pathname: string
): boolean {
  // Owners and super_admins can access everything
  if (role === 'owner' || role === 'super_admin') return true

  // Notifications are always accessible
  if (pathname.startsWith('/notifications')) return true

  // Find the matching route prefix
  const matchedRoute = Object.keys(ROUTE_PERMISSION_MAP).find(
    route => pathname === route || pathname.startsWith(route + '/')
  )

  if (!matchedRoute) return true // Unknown routes are accessible by default

  return hasPermission(role, permissions, ROUTE_PERMISSION_MAP[matchedRoute])
}
