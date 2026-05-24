import { NextRequest, NextResponse } from 'next/server'
import { safeJsonParse } from '@/lib/api-utils'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { canManageBusiness, getCurrentStaffContext } from '@/lib/auth/current-staff'
import { z } from 'zod'

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
  role: z.enum(['owner', 'admin', 'manager', 'staff']),
  phone: z.string().optional(),
  permissions: z.record(z.string(), z.boolean()).optional(),
  branch_id: z.string().uuid().optional().nullable(),
  accessible_branch_ids: z.array(z.string().uuid()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const currentStaff = await getCurrentStaffContext()
    if (!canManageBusiness(currentStaff.role)) {
      return NextResponse.json({ error: 'You do not have permission to add staff' }, { status: 403 })
    }

    const body = await safeJsonParse(req)
    const validated = inviteSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.flatten().fieldErrors }, { status: 400 })
    }

    const { email, name, password, role, phone, permissions, branch_id, accessible_branch_ids } = validated.data

    // 1. Check if user already exists in staff table
    const { data: existingStaff } = await supabaseAdmin
      .from('staff')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (existingStaff) {
      return NextResponse.json({ error: 'Staff member already exists with this email' }, { status: 400 })
    }

    const bizId = currentStaff.business_id

    const { data: activeBranches, error: branchError } = await supabaseAdmin
      .from('branches')
      .select('id')
      .eq('business_id', bizId)
      .eq('status', 'active')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })

    if (branchError || !activeBranches || activeBranches.length === 0) {
      return NextResponse.json({ error: 'No active branch found for this business' }, { status: 400 })
    }

    const validBranchIds = new Set(activeBranches.map(branch => branch.id))
    const requestedBranchIds = Array.from(new Set(accessible_branch_ids || []))
    const invalidBranchIds = requestedBranchIds.filter(id => !validBranchIds.has(id))
    if (invalidBranchIds.length > 0) {
      return NextResponse.json({ error: 'One or more selected branches are invalid' }, { status: 400 })
    }

    const resolvedAccessibleBranchIds = requestedBranchIds.length > 0
      ? requestedBranchIds
      : [activeBranches[0].id]
    const resolvedBranchId = branch_id && resolvedAccessibleBranchIds.includes(branch_id)
      ? branch_id
      : resolvedAccessibleBranchIds[0]

    // 3. Create Auth User with the admin-chosen password
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { name, business_id: bizId },
    })

    if (authError || !authUser.user) {
      return NextResponse.json({ error: authError?.message || 'Failed to create auth invite' }, { status: 500 })
    }

    // 4. Create Staff Record with primary branch and branch access.
    const { data: staffRecord, error: staffError } = await supabaseAdmin.from('staff').insert({
      id: authUser.user.id,
      business_id: bizId,
      branch_id: resolvedBranchId,
      accessible_branch_ids: resolvedAccessibleBranchIds,
      email: email.toLowerCase(),
      name,
      phone: phone?.trim() || null,
      role,
      status: 'active',
      permissions: permissions || {},
      setup_completed: true, // They are invited, not setting up a new business
    })
    .select('id, name, email, phone, role, status, branch_id, accessible_branch_ids, profile_photo_url, last_login, permissions')
    .single()

    if (staffError) {
      // Cleanup auth user if staff record fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ error: staffError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      staff: staffRecord,
      message: 'Staff created successfully. They can log in with their email and password.'
    })

  } catch (error) {
    console.error('Staff invite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
