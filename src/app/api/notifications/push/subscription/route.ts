import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validPushEndpoint } from '@/lib/push/shared'

export async function GET() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })
  return NextResponse.json({ publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null }, { headers: { 'Cache-Control': 'no-store' } })
}
export async function POST(request: NextRequest) {
  const db = await createClient() as any
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })
  const subscription = await request.json().catch(() => null)
  if (!validPushEndpoint(subscription?.endpoint) || !/^[A-Za-z0-9_-]{87}=?$/.test(subscription?.keys?.p256dh || '') || !/^[A-Za-z0-9_-]{22}={0,2}$/.test(subscription?.keys?.auth || '')) return NextResponse.json({ error: 'Invalid browser subscription' }, { status: 400 })
  const { data: staff } = await db.from('staff').select('business_id,status').eq('id', user.id).single()
  if (!staff?.business_id || !['active', 'approved'].includes(staff.status)) return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
  const { error } = await db.from('push_subscriptions').upsert({ staff_id: user.id, business_id: staff.business_id, endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth_key: subscription.keys.auth, updated_at: new Date().toISOString() }, { onConflict: 'endpoint' })
  if (error) return NextResponse.json({ error: 'Could not save this device. Disable notifications and enable them again.' }, { status: 400 })
  return NextResponse.json({ success: true })
}
export async function DELETE(request: NextRequest) {
  const db = await createClient() as any
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })
  const body = await request.json().catch(() => null)
  if (typeof body?.endpoint !== 'string') return NextResponse.json({ error: 'Device endpoint required' }, { status: 400 })
  const { error } = await db.from('push_subscriptions').delete().eq('staff_id', user.id).eq('endpoint', body.endpoint)
  if (error) return NextResponse.json({ error: 'Could not remove this device' }, { status: 500 })
  return NextResponse.json({ success: true })
}
