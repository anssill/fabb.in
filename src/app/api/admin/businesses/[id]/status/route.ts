// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { safeJsonParse } from '@/lib/api-utils'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params
    const { status } = await safeJsonParse(req)

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Verify the caller is a super_admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: staff } = await supabaseAdmin
      .from('staff' as any)
      .select('role')
      .eq('id', user.id)
      .single()

    if (!staff || staff.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: super_admin role required' }, { status: 403 })
    }

    // Update business status
    const { data, error } = await supabaseAdmin
      .from('businesses' as any)
      .update({ status })
      .eq('id', businessId)
      .select('id, name, status')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, business: data })
  } catch (err: any) {
    console.error('Admin business status update error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

