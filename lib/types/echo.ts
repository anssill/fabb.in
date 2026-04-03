// Shared Echo type definitions — strict, no `any`

// ─── Enums ────────────────────────────────────────────────────────────────────

export type StaffRole = 'super_admin' | 'manager' | 'floor_staff' | 'auditor' | 'custom'
export type StaffStatus = 'pending' | 'approved' | 'suspended' | 'rejected'
export type BookingStatus = 'draft' | 'confirmed' | 'active' | 'returned' | 'overdue' | 'cancelled'
export type WashingStage = 'queue' | 'washing' | 'drying' | 'ironing' | 'qc' | 'ready'
export type WashingPriority = 'urgent' | 'high' | 'normal' | 'low'
export type ItemStatus = 'available' | 'in_booking' | 'in_washing' | 'in_repair' | 'paused' | 'retired'
export type ItemCondition = 'A' | 'B' | 'C'
export type CustomerTier = 'bronze' | 'silver' | 'gold' | 'platinum'
export type RiskLevel = 'low' | 'medium' | 'high'
export type PaymentMethod = 'cash' | 'upi' | 'bank' | 'store_credit'
export type BookingSource = 'walk_in' | 'whatsapp' | 'referral' | 'phone_call'
export type BookingOccasion = 'wedding' | 'reception' | 'mehendi' | 'festival' | 'party' | 'other'

// ─── Core Entities ─────────────────────────────────────────────────────────────

export interface Staff {
  id: string
  business_id: string | null
  branch_id: string | null
  email: string
  name: string | null
  phone: string | null
  role: StaffRole
  status: StaffStatus
  custom_permissions: Record<string, boolean>
  google_id: string | null
  pin_code: string | null
  created_at: string
  last_login: string | null
}

export interface Branch {
  id: string
  business_id: string
  name: string
  address: string | null
  gst_number: string | null
  contact: string | null
  opening_hours: Record<string, string> | null
  logo_url: string | null
  settings: BranchSettings
  created_at: string
}

export interface BranchSettings {
  min_advance_pct?: number           // % of total required as advance
  buffer_days?: number               // days between bookings for washing
  advance_booking_days?: number      // max days ahead a booking can be made
  auto_add_to_washing?: boolean      // auto-add items to washing on return
  low_stock_threshold?: number
  sku_prefix?: string
  depreciation_pct?: number          // annual depreciation % per category
  receipt_header?: string
  receipt_footer?: string
  receipt_show_logo?: boolean
  receipt_font_size?: number
  sla_hours_by_category?: Record<string, number>
}

export interface Business {
  id: string
  name: string
  subdomain: string
  plan: 'basic' | 'pro' | 'enterprise' | 'trial'
  status: 'active' | 'suspended'
  owner_id: string | null
  trial_ends_at: string | null
  created_at: string
}

// ─── Notifications ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string
  business_id: string | null
  branch_id: string | null
  target_staff_id: string | null
  type: 'overdue' | 'approval_pending' | 'low_stock' | 'washing_urgent' | 'blacklist_attempt' | 'announcement' | 'payment_pending'
  title: string
  body: string | null
  action_url: string | null
  action_type: 'approve' | 'reject' | 'view' | null
  action_data: Record<string, unknown> | null
  is_read: boolean
  created_at: string
}

// ─── Checklist ─────────────────────────────────────────────────────────────────

export interface ChecklistItem {
  label: string
  done: boolean
}

export interface OpeningChecklist {
  id: string
  branch_id: string
  staff_id: string
  date: string
  completed_at: string | null
  items: ChecklistItem[]
}

// ─── Inventory ─────────────────────────────────────────────────────────────────

export interface Item {
  id: string
  business_id: string
  branch_id: string
  sku: string
  name: string
  category: string
  sub_category: string | null
  condition_grade: ItemCondition
  status: ItemStatus
  daily_rate: number
  deposit_pct: number
  storage_rack: string | null
  storage_shelf: string | null
  storage_bay: string | null
  colour: string | null
  internal_notes: string | null
  purchase_date: string | null
  purchase_cost: number | null
  cover_photo_url: string | null
  completeness_score: number
  qr_code: string | null
  notion_page_id: string | null
  created_by: string | null
  created_at: string
}

export interface ItemVariant {
  id: string
  item_id: string
  business_id: string
  branch_id: string
  size: string | null
  colour_variant: string | null
  sku: string
  status: ItemStatus
  qr_code: string | null
  created_at: string
}

export interface ItemPhoto {
  id: string
  item_id: string
  url: string
  is_cover: boolean
  display_order: number
  created_at: string
}

// ─── Customers ─────────────────────────────────────────────────────────────────

export interface Customer {
  id: string
  business_id: string
  branch_id: string
  name: string
  phone: string
  email: string | null
  tier: CustomerTier
  risk_score: number
  risk_level: RiskLevel
  blacklist_level: number
  blacklist_reason: string | null
  blacklisted_by: string | null
  blacklisted_at: string | null
  vip_flag: boolean
  loyalty_points: number
  debt_amount: number
  total_spend: number
  total_bookings: number
  avg_booking_value: number
  family_group_id: string | null
  aadhaar_front_url: string | null
  aadhaar_back_url: string | null
  created_by: string | null
  created_at: string
}

export interface CustomerNote {
  id: string
  customer_id: string
  branch_id: string
  staff_id: string
  note: string
  is_pinned: boolean
  created_at: string
}

export interface LoyaltyLedgerEntry {
  id: string
  customer_id: string
  branch_id: string
  business_id: string
  type: 'earn' | 'redeem' | 'expire'
  points: number
  reason: string
  booking_id: string | null
  staff_id: string | null
  created_at: string
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export interface Booking {
  id: string
  business_id: string
  branch_id: string
  customer_id: string
  status: BookingStatus
  pickup_date: string
  return_date: string
  total_amount: number
  advance_paid: number
  balance_due: number
  deposit_collected: number
  deposit_released: boolean
  price_override: boolean
  price_override_reason: string | null
  source: BookingSource | null
  occasion: BookingOccasion | null
  cctv_timestamp: string | null
  cctv_zone: string | null
  aadhaar_collected: boolean
  notion_page_id: string | null
  created_by: string | null
  last_edited_by: string | null
  created_at: string
  updated_at: string
  // joined
  customer?: Pick<Customer, 'id' | 'name' | 'phone' | 'tier'>
  created_by_staff?: Pick<Staff, 'id' | 'name'>
}

export interface BookingItem {
  id: string
  booking_id: string
  item_id: string
  variant_id: string | null
  quantity: number
  size: string | null
  daily_rate: number
  days: number
  subtotal: number
  condition_before: ItemCondition | null
  condition_after: ItemCondition | null
  before_photo_url: string | null
  // joined
  item?: Pick<Item, 'id' | 'name' | 'sku' | 'cover_photo_url'>
}

export interface BookingPayment {
  id: string
  booking_id: string
  branch_id: string
  business_id: string
  type: 'advance' | 'balance' | 'deposit' | 'penalty' | 'refund'
  amount: number
  method: PaymentMethod
  reference: string | null
  notes: string | null
  void: boolean
  void_reason: string | null
  voided_by: string | null
  staff_id: string | null
  created_at: string
}

export interface BookingNote {
  id: string
  booking_id: string
  staff_id: string
  note: string
  is_pinned: boolean
  created_at: string
}

export interface BookingTimeline {
  id: string
  booking_id: string
  staff_id: string | null
  action: string
  note: string | null
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  created_at: string
}

// ─── Washing ──────────────────────────────────────────────────────────────────

export interface WashingEntry {
  id: string
  business_id: string
  branch_id: string
  item_id: string
  variant_id: string | null
  booking_id: string | null
  stage: WashingStage
  priority: WashingPriority
  assigned_to: string | null
  cost: number | null
  notes: string | null
  vendor_name: string | null
  vendor_sent_at: string | null
  vendor_expected_at: string | null
  sla_hours: number | null
  entered_queue_at: string
  completed_at: string | null
  created_at: string
  // joined
  item?: Pick<Item, 'id' | 'name' | 'sku' | 'cover_photo_url'>
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export interface Expense {
  id: string
  business_id: string
  branch_id: string
  category: 'rent' | 'salary' | 'utility' | 'repair' | 'washing' | 'misc'
  amount: number
  description: string | null
  receipt_url: string | null
  staff_id: string | null
  washing_entry_id: string | null
  date: string
  created_at: string
}

// ─── Staff & HR ───────────────────────────────────────────────────────────────

export interface StaffAttendance {
  id: string
  staff_id: string
  branch_id: string
  business_id: string
  clock_in: string
  clock_out: string | null
  lat_in: number | null
  lng_in: number | null
  date: string
}

export interface StaffPerformanceTarget {
  id: string
  staff_id: string
  branch_id: string
  business_id: string
  month: string
  revenue_target: number
  booking_target: number
  revenue_actual: number
  bookings_actual: number
}

// ─── Finance ──────────────────────────────────────────────────────────────────

export interface CashReconciliation {
  id: string
  branch_id: string
  business_id: string
  date: string
  staff_id: string
  system_cash: number
  counted_cash: number
  discrepancy: number
  approved_by: string | null
  approved_at: string | null
  notes: string | null
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────

export interface WhatsAppLog {
  id: string
  business_id: string
  branch_id: string
  staff_id: string | null
  customer_id: string | null
  booking_id: string | null
  phone: string
  template_type: string
  message_body: string
  sent_at: string
  status: 'sent' | 'failed' | 'pending'
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string
  business_id: string | null
  branch_id: string | null
  staff_id: string | null
  action: string
  table_name: string | null
  record_id: string | null
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  timestamp: string
}
