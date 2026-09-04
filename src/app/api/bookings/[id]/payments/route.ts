import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidUuid, safeJsonParse } from '@/lib/api-utils'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isValidUuid(id)) return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await safeJsonParse(request)
    const amount = Number(body.amount)
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a valid payment amount')

    const { data, error } = await (supabase.rpc as any)('post_booking_payment', {
      p_booking_id: id,
      p_payment_type: body.type,
      p_amount: amount,
      p_payment_method: body.method,
      p_reference_number: body.reference || null,
      p_note: body.notes || null,
      p_idempotency_key: body.idempotencyKey || null,
    })
    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true, financialEntryId: data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Payment failed' }, { status: 400 })
  }
}
