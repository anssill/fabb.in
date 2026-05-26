import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { safeJsonParse } from '@/lib/api-utils'
import { canManageBusiness, getCurrentStaffContext } from '@/lib/auth/current-staff'
import { supabaseAdmin } from '@/lib/supabase/admin'

const taskSelect = `
  id, title, description, status, priority, due_at, created_at, assigned_to, created_by,
  assignee:staff!booking_tasks_assigned_to_fkey(id, name, email, role),
  creator:staff!booking_tasks_created_by_fkey(id, name, email, role),
  booking:bookings(id, booking_number)
`

const createTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().nullable(),
  assigned_to: z.string().uuid(),
  priority: z.enum(['urgent', 'normal', 'low']).default('normal'),
  due_at: z.string().optional().nullable(),
})

const updateTaskSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(['pending', 'doing', 'done', 'blocked']).optional(),
  assigned_to: z.string().uuid().optional().nullable(),
  priority: z.enum(['urgent', 'normal', 'low']).optional(),
  due_at: z.string().optional().nullable(),
})

async function validateStaffAccess(staffId: string, businessId: string) {
  const { data, error } = await supabaseAdmin
    .from('staff')
    .select('id, name, email')
    .eq('id', staffId)
    .eq('business_id', businessId)
    .single()

  if (error || !data) return null
  return data
}

export async function POST(req: NextRequest) {
  try {
    const currentStaff = await getCurrentStaffContext()
    if (!canManageBusiness(currentStaff.role)) {
      return NextResponse.json({ error: 'You do not have permission to assign staff tasks' }, { status: 403 })
    }

    const body = await safeJsonParse(req)
    const validated = createTaskSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.flatten().fieldErrors }, { status: 400 })
    }

    const assignee = await validateStaffAccess(validated.data.assigned_to, currentStaff.business_id)
    if (!assignee) {
      return NextResponse.json({ error: 'Assigned staff member was not found' }, { status: 404 })
    }

    const { data: task, error } = await (supabaseAdmin as any)
      .from('booking_tasks')
      .insert({
        business_id: currentStaff.business_id,
        branch_id: currentStaff.branch_id,
        task_type: 'staff_custom',
        title: validated.data.title.trim(),
        description: validated.data.description?.trim() || null,
        assigned_to: validated.data.assigned_to,
        priority: validated.data.priority,
        due_at: validated.data.due_at || null,
        created_by: currentStaff.id,
      })
      .select(taskSelect)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabaseAdmin.from('audit_log').insert({
      business_id: currentStaff.business_id,
      branch_id: currentStaff.branch_id,
      staff_id: currentStaff.id,
      staff_name: currentStaff.name,
      action: 'ASSIGN_STAFF_TASK',
      table_name: 'booking_tasks',
      record_id: task.id,
      new_value: {
        title: task.title,
        assigned_to: validated.data.assigned_to,
        assignee_name: assignee.name || assignee.email,
        priority: task.priority,
        due_at: task.due_at,
      },
    })

    return NextResponse.json({ success: true, task })
  } catch (error: any) {
    console.error('Staff task create error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const currentStaff = await getCurrentStaffContext()
    if (!canManageBusiness(currentStaff.role)) {
      return NextResponse.json({ error: 'You do not have permission to update staff tasks' }, { status: 403 })
    }

    const body = await safeJsonParse(req)
    const validated = updateTaskSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.flatten().fieldErrors }, { status: 400 })
    }

    const { data: existingTask, error: existingError } = await (supabaseAdmin as any)
      .from('booking_tasks')
      .select('id, business_id, status, assigned_to, priority, due_at')
      .eq('id', validated.data.taskId)
      .single()

    if (existingError || !existingTask || existingTask.business_id !== currentStaff.business_id) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (validated.data.assigned_to) {
      const assignee = await validateStaffAccess(validated.data.assigned_to, currentStaff.business_id)
      if (!assignee) {
        return NextResponse.json({ error: 'Assigned staff member was not found' }, { status: 404 })
      }
    }

    const updatePayload = {
      ...(validated.data.status ? { status: validated.data.status } : {}),
      ...(validated.data.status === 'done' ? { completed_at: new Date().toISOString() } : {}),
      ...(validated.data.status && validated.data.status !== 'done' ? { completed_at: null } : {}),
      ...(Object.prototype.hasOwnProperty.call(validated.data, 'assigned_to') ? { assigned_to: validated.data.assigned_to } : {}),
      ...(validated.data.priority ? { priority: validated.data.priority } : {}),
      ...(Object.prototype.hasOwnProperty.call(validated.data, 'due_at') ? { due_at: validated.data.due_at || null } : {}),
    }

    const { data: task, error } = await (supabaseAdmin as any)
      .from('booking_tasks')
      .update(updatePayload)
      .eq('id', validated.data.taskId)
      .eq('business_id', currentStaff.business_id)
      .select(taskSelect)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabaseAdmin.from('audit_log').insert({
      business_id: currentStaff.business_id,
      branch_id: currentStaff.branch_id,
      staff_id: currentStaff.id,
      staff_name: currentStaff.name,
      action: 'UPDATE_STAFF_TASK',
      table_name: 'booking_tasks',
      record_id: task.id,
      old_value: existingTask,
      new_value: updatePayload,
    })

    return NextResponse.json({ success: true, task })
  } catch (error: any) {
    console.error('Staff task update error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
