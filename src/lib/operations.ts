export const OPERATION_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending: 'Pending',
  booked: 'Booked',
  fitting_pending: 'Fitting',
  alteration_pending: 'Alteration',
  ready_for_pickup: 'Ready',
  out: 'Out',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  return_due: 'Return due',
  overdue: 'Overdue',
  returned: 'Returned',
  in_washing: 'Washing',
  closed: 'Closed',
  cancelled: 'Cancelled',
}

export const OPERATION_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  pending: 'bg-amber-100 text-amber-700',
  booked: 'bg-blue-100 text-blue-700',
  fitting_pending: 'bg-fuchsia-100 text-fuchsia-700',
  alteration_pending: 'bg-purple-100 text-purple-700',
  ready_for_pickup: 'bg-emerald-100 text-emerald-700',
  out: 'bg-violet-100 text-violet-700',
  out_for_delivery: 'bg-sky-100 text-sky-700',
  delivered: 'bg-cyan-100 text-cyan-700',
  return_due: 'bg-orange-100 text-orange-700',
  overdue: 'bg-red-100 text-red-700',
  returned: 'bg-green-100 text-green-700',
  in_washing: 'bg-cyan-100 text-cyan-700',
  closed: 'bg-slate-900 text-white',
  cancelled: 'bg-red-100 text-red-700',
}

export const DEFAULT_CHECKLIST_ITEMS = [
  { section: 'customer', item_key: 'customer_verified', label: 'Customer verified', is_required: true, is_blocking: true, sort_order: 10 },
  { section: 'customer', item_key: 'id_proof_checked', label: 'ID proof checked', is_required: true, is_blocking: true, sort_order: 20 },
  { section: 'payment', item_key: 'advance_collected', label: 'Advance collected', is_required: true, is_blocking: false, sort_order: 30 },
  { section: 'payment', item_key: 'deposit_confirmed', label: 'Deposit collected or approved', is_required: true, is_blocking: true, sort_order: 40 },
  { section: 'fitting', item_key: 'fitting_confirmed', label: 'Fitting/alteration checked', is_required: false, is_blocking: false, sort_order: 50 },
  { section: 'prep', item_key: 'items_packed', label: 'Items packed', is_required: true, is_blocking: true, sort_order: 60 },
  { section: 'prep', item_key: 'accessories_packed', label: 'Accessories checked', is_required: false, is_blocking: false, sort_order: 70 },
  { section: 'pickup', item_key: 'item_scan_done', label: 'Item scan completed', is_required: true, is_blocking: true, sort_order: 80 },
  { section: 'pickup', item_key: 'pickup_signature', label: 'Pickup signature captured', is_required: true, is_blocking: true, sort_order: 90 },
  { section: 'return', item_key: 'return_condition_done', label: 'Return condition recorded', is_required: true, is_blocking: true, sort_order: 100 },
  { section: 'return', item_key: 'deposit_settled', label: 'Deposit settled/refunded', is_required: true, is_blocking: true, sort_order: 110 },
  { section: 'washing', item_key: 'washing_queue_created', label: 'Washing queue created', is_required: true, is_blocking: false, sort_order: 120 },
  { section: 'invoice', item_key: 'invoice_shared', label: 'Invoice/slip shared', is_required: false, is_blocking: false, sort_order: 130 },
] as const

export const DEFAULT_TASKS = [
  { task_type: 'prepare_item', title: 'Prepare item', priority: 'normal' },
  { task_type: 'call_customer', title: 'Call customer', priority: 'normal' },
  { task_type: 'fitting', title: 'Fitting follow-up', priority: 'low' },
  { task_type: 'collect_balance', title: 'Collect balance', priority: 'normal' },
  { task_type: 'pack_order', title: 'Pack order', priority: 'normal' },
  { task_type: 'pickup_handover', title: 'Pickup handover', priority: 'normal' },
  { task_type: 'return_inspection', title: 'Return inspection', priority: 'normal' },
  { task_type: 'send_to_washing', title: 'Send to washing', priority: 'normal' },
] as const

export function checklistRowsForBooking(booking: {
  id: string
  business_id: string
  branch_id: string | null
}) {
  return DEFAULT_CHECKLIST_ITEMS.map((item) => ({
    business_id: booking.business_id,
    branch_id: booking.branch_id,
    booking_id: booking.id,
    ...item,
  }))
}

export function taskRowsForBooking(booking: {
  id: string
  business_id: string
  branch_id: string | null
  pickup_date?: string | null
  return_date?: string | null
  created_by?: string | null
}) {
  return DEFAULT_TASKS.map((task) => ({
    business_id: booking.business_id,
    branch_id: booking.branch_id,
    booking_id: booking.id,
    ...task,
    assigned_to: booking.created_by || null,
    created_by: booking.created_by || null,
    due_at: task.task_type === 'return_inspection'
      ? booking.return_date ? `${booking.return_date}T18:00:00+05:30` : null
      : booking.pickup_date ? `${booking.pickup_date}T11:00:00+05:30` : null,
  }))
}

export function getOperationStatus(status?: string | null) {
  return OPERATION_STATUS_LABELS[status || ''] || status || 'Unknown'
}

export function getOperationStatusClass(status?: string | null) {
  return OPERATION_STATUS_COLORS[status || ''] || 'bg-slate-100 text-slate-700'
}
