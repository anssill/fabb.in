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
  'view_dashboard_financials',
  'manage_bookings',
  'view_booking_calendar',
  'create_bookings',
  'edit_bookings',
  'add_booking_items',
  'cancel_bookings',
  'process_pickups',
  'process_returns',
  'manage_operations',
  'manage_fittings',
  'manage_alterations',
  'manage_delivery',
  'assign_tasks',
  'view_signatures',
  'override_fees',
  'manage_inventory',
  'create_inventory',
  'edit_inventory',
  'adjust_inventory_stock',
  'import_inventory',
  'sync_inventory',
  'manage_customers',
  'create_customers',
  'edit_customers',
  'manage_customer_blacklist',
  'manage_payments',
  'record_payments',
  'void_payments',
  'refund_deposits',
  'manage_washing',
  'log_washing',
  'complete_washing',
  'manage_analytics',
  'export_reports',
  'manage_expenses',
  'create_expenses',
  'edit_expenses',
  'manage_staff',
  'create_staff',
  'edit_staff',
  'manage_staff_permissions',
  'manage_settings',
  'manage_company_profile',
  'manage_branches',
  'manage_booking_rules',
  'manage_invoice_settings',
  'manage_display_preferences',
  'manage_sms_settings',
  'manage_integrations',
  'view_audit_log',
  'manage_notifications',
] as const

export type PermissionKey = (typeof PERMISSION_KEYS)[number]

export interface PermissionDef {
  key: PermissionKey
  label: string
  description: string
}

export interface PermissionGroup {
  id: string
  label: string
  description: string
  permissions: PermissionDef[]
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Home screen, counters, and quick business overview',
    permissions: [
      { key: 'manage_dashboard', label: 'Open dashboard', description: 'View the main dashboard and quick stats' },
      { key: 'view_dashboard_financials', label: 'View financial cards', description: 'See revenue, payment, and balance summaries' },
    ],
  },
  {
    id: 'bookings',
    label: 'Bookings',
    description: 'Booking creation, pickup, return, and cancellation flow',
    permissions: [
      { key: 'manage_bookings', label: 'Open bookings', description: 'View the booking list and booking details' },
      { key: 'view_booking_calendar', label: 'Calendar view', description: 'View scheduled pickups and returns on the booking calendar' },
      { key: 'create_bookings', label: 'Create bookings', description: 'Start a new booking and reserve stock' },
      { key: 'edit_bookings', label: 'Edit bookings', description: 'Change booking dates, items, notes, and status' },
      { key: 'add_booking_items', label: 'Add booked items', description: 'Add another product to an existing booked booking' },
      { key: 'cancel_bookings', label: 'Cancel bookings', description: 'Cancel bookings and release locked stock' },
      { key: 'process_pickups', label: 'Process pickups', description: 'Complete pickup handover and mark items out' },
      { key: 'process_returns', label: 'Process returns', description: 'Complete returns and record item condition' },
    ],
  },
  {
    id: 'operations',
    label: 'Store operations',
    description: 'Shop-floor mode, fittings, alterations, delivery, tasks, signatures, and fee controls',
    permissions: [
      { key: 'manage_operations', label: 'Open operations', description: 'Use the touch-friendly shop floor operations screen' },
      { key: 'manage_fittings', label: 'Fittings', description: 'Schedule and complete fitting appointments' },
      { key: 'manage_alterations', label: 'Alterations', description: 'Record measurements, tailor handoff, and alteration status' },
      { key: 'manage_delivery', label: 'Delivery', description: 'Assign delivery staff and update delivery status' },
      { key: 'assign_tasks', label: 'Assign tasks', description: 'Assign and update staff operation tasks' },
      { key: 'view_signatures', label: 'View signatures', description: 'View pickup, return, delivery, and rental agreement signatures' },
      { key: 'override_fees', label: 'Override fees', description: 'Override late, damage, delivery, and deposit adjustments' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    description: 'Products, variants, images, stock, import, and sync tools',
    permissions: [
      { key: 'manage_inventory', label: 'Open inventory', description: 'View inventory items and availability' },
      { key: 'create_inventory', label: 'Add inventory', description: 'Create products, sizes, colours, and stock' },
      { key: 'edit_inventory', label: 'Edit inventory', description: 'Update product details, pricing, and images' },
      { key: 'adjust_inventory_stock', label: 'Adjust stock', description: 'Change variant quantities and stock status' },
      { key: 'import_inventory', label: 'CSV import', description: 'Bulk upload products from CSV files' },
      { key: 'sync_inventory', label: 'Sync stock', description: 'Rebuild stock counts from bookings and returns' },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    description: 'Customer records, ID proof, notes, and blacklist controls',
    permissions: [
      { key: 'manage_customers', label: 'Open customers', description: 'View customer list and profiles' },
      { key: 'create_customers', label: 'Add customers', description: 'Create customer records during booking or directly' },
      { key: 'edit_customers', label: 'Edit customers', description: 'Update customer contact details and notes' },
      { key: 'manage_customer_blacklist', label: 'Blacklist customers', description: 'Block or unblock risky customers' },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    description: 'Advance, balance, deposit, refunds, and payment history',
    permissions: [
      { key: 'manage_payments', label: 'Open payments', description: 'View payments and balances' },
      { key: 'record_payments', label: 'Record payments', description: 'Collect advance, balance, and deposit amounts' },
      { key: 'void_payments', label: 'Void payments', description: 'Reverse incorrect payment records' },
      { key: 'refund_deposits', label: 'Refund deposits', description: 'Record refundable deposit returns' },
    ],
  },
  {
    id: 'washing',
    label: 'Washing',
    description: 'Garment care lifecycle, fitting, maintenance, and ready controls',
    permissions: [
      { key: 'manage_washing', label: 'Open washing queue', description: 'View washing and ready-for-use items' },
      { key: 'log_washing', label: 'Log washing', description: 'Send items to washing or cleaning' },
      { key: 'complete_washing', label: 'Complete washing', description: 'Mark washed items ready and update condition' },
    ],
  },
  {
    id: 'analytics_reports',
    label: 'Analytics & reports',
    description: 'Performance dashboards, exports, and business reporting',
    permissions: [
      { key: 'manage_analytics', label: 'Open analytics', description: 'View analytics dashboards and charts' },
      { key: 'export_reports', label: 'Export reports', description: 'Download reports for accounting or review' },
    ],
  },
  {
    id: 'expenses',
    label: 'Expenses',
    description: 'Business expense entry and corrections',
    permissions: [
      { key: 'manage_expenses', label: 'Open expenses', description: 'View business expense records' },
      { key: 'create_expenses', label: 'Add expenses', description: 'Record rent, salary, transport, or other expenses' },
      { key: 'edit_expenses', label: 'Edit expenses', description: 'Update or correct expense records' },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Internal alerts for bookings, washing, and operational follow-up',
    permissions: [
      { key: 'manage_notifications', label: 'Notifications', description: 'View and manage app notifications' },
    ],
  },
  {
    id: 'staff',
    label: 'Staff',
    description: 'Team members, passwords, roles, permissions, and branch access',
    permissions: [
      { key: 'manage_staff', label: 'Open staff', description: 'View team members and staff profiles' },
      { key: 'create_staff', label: 'Add staff', description: 'Create staff logins and passwords' },
      { key: 'edit_staff', label: 'Edit staff', description: 'Update staff role, status, and profile details' },
      { key: 'manage_staff_permissions', label: 'Manage permissions', description: 'Change module permissions and branch access' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Company, branches, invoice, rules, display, SMS, integrations, and audit logs',
    permissions: [
      { key: 'manage_settings', label: 'Open settings', description: 'Access the settings area' },
      { key: 'manage_company_profile', label: 'Company profile', description: 'Edit business name, logo, tax, and contact details' },
      { key: 'manage_branches', label: 'Branches', description: 'Create and update store branches' },
      { key: 'manage_booking_rules', label: 'Booking rules', description: 'Edit advance, deposit, date, and stock rules' },
      { key: 'manage_invoice_settings', label: 'Invoice settings', description: 'Configure invoice print, GST, footer, and Vyapar setup' },
      { key: 'manage_display_preferences', label: 'Display preferences', description: 'Change language, theme, currency, and app display' },
      { key: 'manage_sms_settings', label: 'SMS settings', description: 'Configure message provider and templates' },
      { key: 'manage_integrations', label: 'Integrations', description: 'Manage WhatsApp, email, weather, and external integrations' },
      { key: 'view_audit_log', label: 'Audit log', description: 'View business activity history' },
    ],
  },
]

export const PERMISSIONS: PermissionDef[] = PERMISSION_GROUPS.flatMap(group => group.permissions)

/** Maps a sidebar href to the permission key required */
export const ROUTE_PERMISSION_MAP: Record<string, PermissionKey> = {
  '/dashboard': 'manage_dashboard',
  '/bookings/new': 'create_bookings',
  '/bookings': 'manage_bookings',
  '/operations': 'manage_operations',
  '/inventory/new': 'create_inventory',
  '/inventory': 'manage_inventory',
  '/customers/new': 'create_customers',
  '/customers/blacklist': 'manage_customer_blacklist',
  '/customers': 'manage_customers',
  '/payments': 'manage_payments',
  '/washing': 'manage_washing',
  '/analytics': 'manage_analytics',
  '/expenses': 'manage_expenses',
  '/staff': 'manage_staff',
  '/settings/company': 'manage_company_profile',
  '/settings/branches': 'manage_branches',
  '/settings/booking-rules': 'manage_booking_rules',
  '/settings/invoice': 'manage_invoice_settings',
  '/settings/display': 'manage_display_preferences',
  '/settings/sms': 'manage_sms_settings',
  '/settings/integrations': 'manage_integrations',
  '/settings/audit-log': 'view_audit_log',
  '/settings/staff': 'manage_staff',
  '/settings': 'manage_settings',
  '/notifications': 'manage_notifications',
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
  const matchedRoute = Object.keys(ROUTE_PERMISSION_MAP)
    .sort((a, b) => b.length - a.length)
    .find(
      route => pathname === route || pathname.startsWith(route + '/')
    )

  if (!matchedRoute) return true // Unknown routes are accessible by default

  return hasPermission(role, permissions, ROUTE_PERMISSION_MAP[matchedRoute])
}
