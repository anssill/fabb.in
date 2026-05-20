import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isValidUuid } from '@/lib/api-utils'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params

    if (!isValidUuid(businessId)) {
      return NextResponse.json({ error: 'Invalid business ID format' }, { status: 400 })
    }

    // Verify the caller is a super_admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: staff } = await supabaseAdmin
      .from('staff')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!staff || staff.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: super_admin role required' }, { status: 403 })
    }

    // Fetch current trial_ends_at
    const { data: business, error: fetchError } = await supabaseAdmin
      .from('businesses')
      .select('id, trial_ends_at')
      .eq('id', businessId)
      .single()

    if (fetchError || !business) {
      return NextResponse.json({ error: fetchError?.message || 'Business not found' }, { status: 404 })
    }

    // Extend trial by 14 days from current trial_ends_at or from now if already expired
    const currentTrialEnd = business.trial_ends_at
      ? new Date(business.trial_ends_at)
      : new Date()

    // If trial has already expired, extend from today
    const base = currentTrialEnd < new Date() ? new Date() : currentTrialEnd
    const newTrialEnd = new Date(base)
    newTrialEnd.setDate(newTrialEnd.getDate() + 14)

    const { data, error } = await supabaseAdmin
      .from('businesses')
      .update({ trial_ends_at: newTrialEnd.toISOString() })
      .eq('id', businessId)
      .select('id, name, trial_ends_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, business: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('Admin business trial extension error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

