'use server'
import { createClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/permissions'
export async function testSMSConnection() {
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }
  const { data: staff } = await client.from('staff').select('role,permissions').eq('id',user.id).single()
  if (!staff || !hasPermission(staff.role, staff.permissions as Record<string,boolean>, 'manage_settings')) return { success: false, error: 'Settings permission required' }
  return process.env.MSG91_AUTH_KEY ? { success: true, message: 'Server key is configured. An approved template is required for delivery.' } : { success: false, error: 'Add MSG91_AUTH_KEY in Vercel production environment settings, then redeploy.' }
}
