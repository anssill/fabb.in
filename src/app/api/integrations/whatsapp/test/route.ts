import { NextResponse } from 'next/server'
import { WhatsAppService } from '@/lib/whatsapp'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const testSchema = z.object({ phone: z.string().trim().regex(/^\+?\d{10,15}$/) })

export async function POST(req: Request) {
  const supabase = await createClient()
  
  // Verify session for security
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: staff } = await supabase.from('staff').select('business_id, role, status, permissions').eq('id', user.id).single()
  if (!staff?.business_id || !['active', 'approved'].includes(staff.status)) return NextResponse.json({ error: 'Active staff account required' }, { status: 403 })
  let allowed = ['owner', 'super_admin'].includes(staff.role) || Boolean((staff.permissions as Record<string, boolean> | null)?.manage_settings)
  if (!allowed) {
    const { data: assignments } = await (supabase as any).from('staff_role_assignments').select('role:business_roles(permissions)').eq('staff_id', user.id)
    allowed = (assignments ?? []).some((assignment: any) => { const role = Array.isArray(assignment.role) ? assignment.role[0] : assignment.role; return role?.permissions?.manage_settings === true })
  }
  if (!allowed) return NextResponse.json({ error: 'Settings permission required' }, { status: 403 })

  try {
    const parsed = testSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Enter a valid phone number with country code' }, { status: 400 })
    const { phone } = parsed.data

    // Call the WhatsApp Service with the template 'hello_world' - Meta's official test template
    const result = await WhatsAppService.sendTemplate({
      phoneNumber: phone,
      templateName: 'hello_world',
      variables: ['Fabb.booking Test Panel']
    })

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('WhatsApp Test Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
