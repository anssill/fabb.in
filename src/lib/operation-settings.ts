export type OperationSettings = {
  enabled: boolean
  showInSidebar: boolean
  bookingWorkspace: boolean
  checklist: boolean
  itemPrep: boolean
  tasks: boolean
  fittingAlterations: boolean
  delivery: boolean
  signatures: boolean
  staffNotes: boolean
  whatsappActions: boolean
  draftList: boolean
  realtimeUpdates: boolean
  pushNotifications: boolean
  featureToggles: Record<string, boolean>
}

export const OPERATION_FEATURE_GROUPS = [
  {
    id: 'booking_desk',
    label: 'Booking desk',
    features: [
      ['booking.smart_checklist', 'Smart booking checklist'],
      ['booking.customer_id_verification', 'Customer ID verification'],
      ['booking.advance_guard', 'Advance collection guard'],
      ['booking.deposit_guard', 'Deposit collection guard'],
      ['booking.conflict_warning', 'Customer conflict warning'],
      ['booking.item_overlap_warning', 'Item overlap warning'],
      ['booking.handoff_notes', 'Shift handoff notes'],
      ['booking.internal_notes', 'Internal staff notes'],
      ['booking.ready_for_pickup_status', 'Ready for pickup status'],
      ['booking.counter_mode', 'Counter mode'],
      ['booking.draft_resume', 'Draft resume'],
      ['booking.draft_delete', 'Draft delete'],
    ],
  },
  {
    id: 'pickup_return',
    label: 'Pickup and return',
    features: [
      ['pickup.balance_check', 'Pickup balance check'],
      ['pickup.deposit_check', 'Pickup deposit check'],
      ['pickup.id_verified', 'Pickup ID verified'],
      ['pickup.item_scan', 'Pickup item scan'],
      ['pickup.customer_signature', 'Pickup signature'],
      ['pickup.photo_capture', 'Pickup photos'],
      ['pickup.slip_print', 'Pickup slip print'],
      ['pickup.item_change_after_pickup', 'Change item after pickup'],
      ['pickup.item_cancel_after_pickup', 'Cancel item after pickup'],
      ['pickup.deposit_suggestions', 'Deposit suggestions'],
      ['return.condition_check', 'Return condition check'],
      ['return.damage_fee', 'Damage fee'],
      ['return.missing_item_flow', 'Missing item flow'],
      ['return.late_fee', 'Late fee'],
      ['return.deposit_refund', 'Deposit refund'],
      ['return.customer_signature', 'Return signature'],
      ['return.washing_queue_create', 'Create washing queue'],
    ],
  },
  {
    id: 'washing_care',
    label: 'Washing and care',
    features: [
      ['washing.group_by_booking', 'Group by booking'],
      ['washing.item_stage_edit', 'Individual item stage edit'],
      ['washing.bulk_ready', 'Bulk ready by booking'],
      ['washing.condition_ready', 'Ready condition selection'],
      ['washing.damage_found', 'Damage found action'],
      ['washing.vendor_assignment', 'Laundry vendor assignment'],
      ['washing.cost_tracking', 'Washing cost tracking'],
      ['washing.priority_queue', 'Priority queue'],
      ['washing.stage_timer', 'Stage timer'],
      ['washing.urgent_notifications', 'Urgent notifications'],
      ['washing.realtime_queue', 'Realtime washing updates'],
      ['washing.washing_staff_role', 'Washing staff role'],
    ],
  },
  {
    id: 'fitting_alterations',
    label: 'Fitting and alterations',
    features: [
      ['fitting.appointment', 'Fitting appointment'],
      ['fitting.whatsapp_reminder', 'Fitting WhatsApp reminder'],
      ['fitting.measurement_length', 'Length measurement'],
      ['fitting.measurement_waist', 'Waist measurement'],
      ['fitting.measurement_sleeve', 'Sleeve measurement'],
      ['fitting.measurement_shoulder', 'Shoulder measurement'],
      ['fitting.blouse_notes', 'Blouse notes'],
      ['alteration.status', 'Alteration status'],
      ['alteration.tailor_assignment', 'Tailor assignment'],
      ['alteration.before_photo', 'Before photo'],
      ['alteration.after_photo', 'After photo'],
      ['alteration.quality_check', 'Alteration quality check'],
    ],
  },
  {
    id: 'stock_prep',
    label: 'Stock prep',
    features: [
      ['prep.item_scan', 'Prep item scan'],
      ['prep.bag_hanger_code', 'Bag/hanger code'],
      ['prep.accessory_checklist', 'Accessory checklist'],
      ['prep.condition_before_pickup', 'Condition before pickup'],
      ['prep.packing_checklist', 'Packing checklist'],
      ['prep.missing_accessory_warning', 'Missing accessory warning'],
      ['prep.reservation_check', 'Reservation check'],
      ['prep.physical_status_check', 'Physical status check'],
      ['prep.staff_handover', 'Staff handover'],
      ['prep.ready_whatsapp', 'Ready WhatsApp'],
    ],
  },
  {
    id: 'delivery',
    label: 'Delivery',
    features: [
      ['delivery.mode', 'Delivery mode'],
      ['delivery.address', 'Delivery address'],
      ['delivery.contact_person', 'Contact person'],
      ['delivery.fee', 'Delivery fee'],
      ['delivery.staff_assignment', 'Staff assignment'],
      ['delivery.courier_tracking', 'Courier tracking'],
      ['delivery.out_status', 'Out for delivery status'],
      ['delivery.delivered_status', 'Delivered status'],
      ['delivery.failed_status', 'Failed delivery status'],
      ['delivery.whatsapp_update', 'Delivery WhatsApp update'],
    ],
  },
  {
    id: 'staff_tasks',
    label: 'Staff tasks',
    features: [
      ['tasks.auto_prepare', 'Auto prepare task'],
      ['tasks.auto_call_customer', 'Auto call customer task'],
      ['tasks.auto_fitting', 'Auto fitting task'],
      ['tasks.auto_collect_balance', 'Auto collect balance task'],
      ['tasks.auto_pack_order', 'Auto pack order task'],
      ['tasks.auto_pickup', 'Auto pickup task'],
      ['tasks.auto_return_inspection', 'Auto return inspection task'],
      ['tasks.auto_send_washing', 'Auto send washing task'],
      ['tasks.manual_assign', 'Manual task assignment'],
      ['tasks.status_pending', 'Pending task status'],
      ['tasks.status_doing', 'Doing task status'],
      ['tasks.status_done', 'Done task status'],
      ['tasks.status_blocked', 'Blocked task status'],
      ['tasks.manager_dashboard', 'Manager task dashboard'],
    ],
  },
  {
    id: 'shop_floor',
    label: 'Shop floor mode',
    features: [
      ['floor.pickups_tab', 'Pickups tab'],
      ['floor.returns_tab', 'Returns tab'],
      ['floor.fittings_tab', 'Fittings tab'],
      ['floor.washing_tab', 'Washing tab'],
      ['floor.payments_tab', 'Payments tab'],
      ['floor.delivery_tab', 'Delivery tab'],
      ['floor.tasks_tab', 'Tasks tab'],
      ['floor.touch_buttons', 'Touch-friendly buttons'],
      ['floor.today_lists', 'Today lists'],
      ['floor.quick_actions', 'Quick actions'],
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    features: [
      ['message.booking_ready', 'Booking ready message'],
      ['message.pickup_reminder', 'Pickup reminder'],
      ['message.return_reminder', 'Return reminder'],
      ['message.overdue_warning', 'Overdue warning'],
      ['message.deposit_refunded', 'Deposit refunded message'],
      ['message.fitting_scheduled', 'Fitting scheduled message'],
      ['message.delivery_update', 'Delivery update message'],
      ['message.preview_before_send', 'Preview before send'],
      ['message.sms_log', 'SMS log'],
      ['message.whatsapp_log', 'WhatsApp log'],
    ],
  },
  {
    id: 'risk_manager',
    label: 'Risk and manager',
    features: [
      ['risk.outstanding_balance', 'Outstanding balance risk'],
      ['risk.blacklist_flag', 'Blacklist flag'],
      ['risk.overdue_history', 'Overdue history'],
      ['risk.damage_history', 'Damage history'],
      ['risk.deposit_hold_warning', 'Deposit hold warning'],
      ['agreement.text', 'Rental agreement text'],
      ['agreement.signature_capture', 'Agreement signature capture'],
      ['manager.blocked_tasks', 'Blocked task dashboard'],
      ['manager.overdue_operations', 'Overdue operations'],
      ['manager.audit_track', 'Audit tracking'],
      ['notifications.realtime', 'Realtime notifications'],
      ['notifications.browser_push', 'Browser push notifications'],
      ['notifications.operation_alerts', 'Operation alerts'],
    ],
  },
] as const

export const DEFAULT_OPERATION_FEATURE_TOGGLES: Record<string, boolean> = Object.fromEntries(
  OPERATION_FEATURE_GROUPS.flatMap(group => [...group.features]).map(([key]) => [key, true])
)

export const DEFAULT_OPERATION_SETTINGS: OperationSettings = {
  enabled: true,
  showInSidebar: true,
  bookingWorkspace: true,
  checklist: true,
  itemPrep: true,
  tasks: true,
  fittingAlterations: true,
  delivery: true,
  signatures: true,
  staffNotes: true,
  whatsappActions: true,
  draftList: true,
  realtimeUpdates: true,
  pushNotifications: false,
  featureToggles: DEFAULT_OPERATION_FEATURE_TOGGLES,
}

export function getOperationSettings(settings: unknown): OperationSettings {
  const branchSettings = settings && typeof settings === 'object' && !Array.isArray(settings)
    ? settings as Record<string, unknown>
    : {}
  const operations = branchSettings.operations && typeof branchSettings.operations === 'object' && !Array.isArray(branchSettings.operations)
    ? branchSettings.operations as Partial<OperationSettings>
    : {}

  return {
    ...DEFAULT_OPERATION_SETTINGS,
    ...operations,
    featureToggles: {
      ...DEFAULT_OPERATION_FEATURE_TOGGLES,
      ...(operations.featureToggles && typeof operations.featureToggles === 'object' && !Array.isArray(operations.featureToggles)
        ? operations.featureToggles as Record<string, boolean>
        : {}),
    },
  }
}

export function isOperationFeatureEnabled(settings: OperationSettings, key: string) {
  return settings.enabled && settings.featureToggles[key] !== false
}
