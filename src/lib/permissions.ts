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
  'manage_transfers',
  'manage_stocktakes',
  'manage_analytics',
  'manage_expenses',
  'manage_staff',
  'manage_payroll',
  'manage_reports',
  'view_legacy_archive',
  'override_availability',
  'settle_deposits',
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
  { key: 'manage_transfers', label: 'Branch Transfers', description: 'Dispatch and receive rental inventory' },
  { key: 'manage_stocktakes', label: 'Stocktakes', description: 'Count inventory and approve variances' },
  { key: 'manage_analytics', label: 'Analytics', description: 'Access reports and analytics' },
  { key: 'manage_expenses', label: 'Expenses', description: 'Record and view business expenses' },
  { key: 'manage_staff', label: 'Staff Management', description: 'View and manage team members' },
  { key: 'manage_payroll', label: 'Payroll', description: 'Calculate payroll and record payouts' },
  { key: 'manage_reports', label: 'Reports', description: 'View and export operational reports' },
  { key: 'view_legacy_archive', label: 'Legacy Archive', description: 'Search historical read-only bookings' },
  { key: 'override_availability', label: 'Overbook Rentals', description: 'Confirm a rental when date availability is insufficient' },
  { key: 'settle_deposits', label: 'Settle Deposits', description: 'Refund or deduct refundable deposits' },
  { key: 'manage_settings', label: 'Settings', description: 'Access business and app settings' },
]

/** Maps a sidebar href to the permission key required */
export const ROUTE_PERMISSION_MAP: Record<string, PermissionKey> = {
  '/dashboard': 'manage_dashboard',
  '/bookings': 'manage_bookings',
  '/inventory': 'manage_inventory',
  '/customers': 'manage_customers',
  '/payments': 'manage_payments',
  '/inventory/transfers': 'manage_transfers',
  '/inventory/stocktakes': 'manage_stocktakes',
  '/analytics': 'manage_analytics',
  '/expenses': 'manage_expenses',
  '/staff': 'manage_staff',
  '/payroll': 'manage_payroll',
  '/reports': 'manage_reports',
  '/archive': 'view_legacy_archive',
  '/settings': 'manage_settings',
}

/**
 * Returns a least-privilege default for a newly invited staff account.
 */
export function getDefaultPermissions(): Record<PermissionKey, boolean> {
  const perms: Record<string, boolean> = { manage_dashboard: true }
  for (const key of PERMISSION_KEYS) {
    if (key !== 'manage_dashboard') perms[key] = false
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

  // Empty legacy permission sets are intentionally least privilege.
  if (!permissions || Object.keys(permissions).length === 0) return false

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
  const matchedRoute = Object.keys(ROUTE_PERMISSION_MAP).sort((a, b) => b.length - a.length).find(
    route => pathname === route || pathname.startsWith(route + '/')
  )

  if (!matchedRoute) return true // Unknown routes are accessible by default

  return hasPermission(role, permissions, ROUTE_PERMISSION_MAP[matchedRoute])
}
