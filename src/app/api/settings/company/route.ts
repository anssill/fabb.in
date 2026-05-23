import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { safeJsonParse } from '@/lib/api-utils'
import { canManageBusiness, getCurrentStaffContext } from '@/lib/auth/current-staff'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const companySchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  pincode: z.string().nullable().optional(),
  country: z.string().min(1).optional(),
  currency: z.string().min(1).optional(),
  timezone: z.string().min(1).optional(),
  gst_number: z.string().nullable().optional(),
  pan_number: z.string().nullable().optional(),
  logo_url: z.string().url().nullable().optional(),
})

export async function PATCH(req: NextRequest) {
  try {
    const currentStaff = await getCurrentStaffContext()
    if (!canManageBusiness(currentStaff.role)) {
      return NextResponse.json({ error: 'You do not have permission to edit company settings' }, { status: 403 })
    }

    const body = await safeJsonParse(req)
    const validated = companySchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.flatten().fieldErrors }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const { data: business, error } = await admin
      .from('businesses')
      .update({ ...validated.data, updated_at: new Date().toISOString() })
      .eq('id', currentStaff.business_id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, business })
  } catch (error) {
    console.error('Company settings update error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
