import { createClient } from '@/lib/supabase/client'

interface AuditParams {
  action: string
  tableName: string
  recordId?: string
  oldValue?: Record<string, unknown> | null
  newValue?: Record<string, unknown> | null
  branchId?: string | null
  businessId?: string | null
}

/**
 * Write an append-only audit log entry.
 * Call this after every write operation.
 * Failures are non-fatal — logged to console only.
 */
export async function writeAuditLog(params: AuditParams): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('audit_log').insert({
    staff_id: user?.id ?? null,
    action: params.action,
    table_name: params.tableName,
    record_id: params.recordId ?? null,
    old_value: params.oldValue ?? null,
    new_value: params.newValue ?? null,
    branch_id: params.branchId ?? null,
    business_id: params.businessId ?? null,
  })

  if (error) {
    console.error('[audit] Failed to write audit log:', error.message)
  }
}
