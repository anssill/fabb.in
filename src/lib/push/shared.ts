export const PUSH_EVENTS = ['booking', 'payment', 'pickup', 'return', 'pickup_reminder', 'return_reminder', 'overdue'] as const
export const DEFAULT_REMINDERS = [
  { event: 'pickup_reminder', days_before: 1, time: '18:00' },
  { event: 'return_reminder', days_before: 1, time: '18:00' },
  { event: 'overdue', days_before: 0, time: '18:00' },
]
export function validPushEndpoint(endpoint: unknown): endpoint is string {
  if (typeof endpoint !== 'string' || endpoint.length > 4096) return false
  try {
    const url = new URL(endpoint)
    return url.protocol === 'https:' && !url.username && !url.password && !url.port &&
      (url.hostname === 'fcm.googleapis.com' || url.hostname === 'updates.push.services.mozilla.com' || url.hostname === 'web.push.apple.com' || url.hostname.endsWith('.notify.windows.com'))
  } catch { return false }
}
export function reminderStillValid(payload: any, booking: any, settings: any) {
  if (!payload.schedule) return true
  const schedule = payload.schedule
  const rules = settings?.reminders ?? DEFAULT_REMINDERS
  if (booking.pickup_date !== schedule.pickup_date || booking.return_date !== schedule.return_date) return false
  if (!rules.some((rule: any) => rule.event === schedule.rule?.event && rule.time === schedule.rule?.time && rule.days_before === schedule.rule?.days_before)) return false
  if (payload.event === 'pickup_reminder') return ['confirmed', 'hold'].includes(booking.status)
  return ['picked_up', 'partially_returned'].includes(booking.status)
}

export const PUSH_TITLES: Record<string, string> = { booking: 'New booking', payment: 'Payment recorded', pickup: 'Items picked up', return: 'Items received', pickup_reminder: 'Pickup reminder', return_reminder: 'Return reminder', overdue: 'Overdue return' }
