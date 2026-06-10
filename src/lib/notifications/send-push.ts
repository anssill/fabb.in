import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase/admin'

type SendBusinessPushArgs = {
  businessId: string
  title: string
  body: string
  url?: string
  userIds?: string[]
}

type SendRolePushArgs = Omit<SendBusinessPushArgs, 'userIds'> & {
  roles: string[]
}

export async function sendBusinessPush({ businessId, title, body, url, userIds }: SendBusinessPushArgs) {
  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        business_id: businessId,
        title,
        body,
        url,
        user_ids: userIds,
      },
    })

    if (error) {
      console.error('Push notification failed:', error)
    }
  } catch (error) {
    console.error('Push notification failed:', error)
  }
}

export async function sendRolePush({ businessId, title, body, url, roles }: SendRolePushArgs) {
  try {
    const supabase = getSupabaseAdmin()
    const { data: staffRows, error } = await supabase
      .from('staff')
      .select('id')
      .eq('business_id', businessId)
      .eq('status', 'active')
      .in('role', roles)

    if (error) throw error

    const userIds = (staffRows || []).map((staff) => staff.id).filter(Boolean)
    if (userIds.length === 0) return

    await sendBusinessPush({ businessId, title, body, url, userIds })
  } catch (error) {
    console.error('Role push notification failed:', error)
  }
}
