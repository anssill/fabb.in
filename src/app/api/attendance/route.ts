import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeJsonParse } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await safeJsonParse(request)
    const latitude = Number(body.latitude)
    const longitude = Number(body.longitude)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error('Valid GPS coordinates are required')
    const { data, error } = await (supabase.rpc as any)('record_daily_attendance', {
      p_latitude: latitude,
      p_longitude: longitude,
      p_accuracy_metres: Number.isFinite(Number(body.accuracy)) ? Number(body.accuracy) : null,
    })
    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true, attendance: data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Attendance failed' }, { status: 400 })
  }
}
