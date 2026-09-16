import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual, createHash } from 'node:crypto'
import webpush from 'web-push'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { reminderStillValid, validPushEndpoint, PUSH_TITLES } from '@/lib/push/shared'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const secret = process.env.PUSH_WORKER_SECRET
  const provided = request.headers.get('authorization') || ''
  const expected = `Bearer ${secret}`
  if (!secret || Buffer.byteLength(provided) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return NextResponse.json({ error: 'Push delivery is not configured' }, { status: 503 })
  const db = getSupabaseAdmin() as any
  const reminders = await db.rpc('enqueue_push_reminders')
  if (reminders.error) return NextResponse.json({ error: 'Could not schedule reminders' }, { status: 500 })
  const claimed = await db.rpc('claim_push_deliveries')
  if (claimed.error) return NextResponse.json({ error: 'Could not claim deliveries' }, { status: 500 })
  let sent = 0, skipped = 0, failed = 0
  // Bounded concurrency keeps each invocation below its timeout; database claims prevent competing workers.
  const rows = claimed.data || []
  for (let offset = 0; offset < rows.length; offset += 10) await Promise.all(rows.slice(offset, offset + 10).map(async (row: any) => {
    const stop = async (reason: string) => {
      await db.from('message_outbox').update({ status: 'failed', attempt_count: 5, last_error: reason }).eq('id', row.id).eq('attempt_count', row.attempt_count)
      skipped++
    }
    try {
      const [subscriptionResult, branchResult, bookingResult] = await Promise.all([
        db.from('push_subscriptions').select('*').eq('id', row.recipient).maybeSingle(),
        db.from('branches').select('name,settings,status').eq('id', row.branch_id).eq('business_id', row.business_id).maybeSingle(),
        db.from('bookings').select('id,status,pickup_date,return_date').eq('id', row.booking_id).eq('business_id', row.business_id).eq('branch_id', row.branch_id).maybeSingle(),
      ])
      if (subscriptionResult.error || branchResult.error || bookingResult.error) throw new Error('Recipient lookup failed')
      const subscription = subscriptionResult.data, branch = branchResult.data, booking = bookingResult.data
      if (!subscription || !branch || !booking || subscription.business_id !== row.business_id || branch.status !== 'active') return stop('Recipient or booking no longer available')
      if (!PUSH_TITLES[row.payload?.event]) return stop('Unknown notification event')
      const push = branch.settings?.push
      if (push?.enabled === false || push?.events?.[row.payload.event] === false || !reminderStillValid(row.payload, booking, push)) return stop('Notification disabled or reminder changed')
      const allowed = await db.rpc('push_recipient_allowed', { p_staff: subscription.staff_id, p_business: row.business_id, p_branch: row.branch_id, p_event: row.payload.event })
      if (allowed.error) throw new Error('Access check failed')
      if (!allowed.data || !validPushEndpoint(subscription.endpoint)) return stop('Recipient no longer authorized')
      await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth_key } }, JSON.stringify({ title: PUSH_TITLES[row.payload.event], body: branch.name, url: `/bookings/${booking.id}`, tag: row.id }), {
        vapidDetails: { subject: 'https://www.fabbclothing.com', publicKey, privateKey }, TTL: 300, timeout: 7000,
        topic: createHash('sha256').update(row.id).digest('base64url').slice(0, 32),
      })
      const result = await db.from('message_outbox').update({ status: 'sent', sent_at: new Date().toISOString(), last_error: null }).eq('id', row.id).eq('attempt_count', row.attempt_count)
      if (result.error) throw new Error('Delivery acknowledgement failed')
      sent++
    } catch (error: any) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        await db.from('push_subscriptions').delete().eq('id', row.recipient)
        return stop('Expired device subscription')
      }
      failed++
      // Never persist provider bodies: they may contain device endpoint tokens.
      await db.from('message_outbox').update({ status: 'failed', last_error: `Push delivery failed${error.statusCode ? ` (${Number(error.statusCode)})` : ''}`, next_attempt_at: new Date(Date.now() + Math.min(3600, 60 * 2 ** row.attempt_count) * 1000).toISOString() }).eq('id', row.id).eq('attempt_count', row.attempt_count)
    }
  }))
  return NextResponse.json({ sent, skipped, failed })
}
