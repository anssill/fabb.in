import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paymentParts } from '@/lib/payment-splits'
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

    const parts = paymentParts(amount, { method: body.method, reference: body.reference ?? undefined, splits: body.parts })
    const { data, error } = await (supabase.rpc as any)('post_booking_payment_split', {
      p_booking_id: id, p_payment_type: body.type, p_total: amount, p_parts: parts,
      p_note: body.notes || null, p_key: body.idempotencyKey || null,
    })
    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true, financialEntryIds: data.financialEntryIds })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Payment failed' }, { status: 400 })
  }
}
