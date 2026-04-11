'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .or(`target_staff_id.eq.${user.id},target_staff_id.is.null`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }

  return notifications
}

export async function markAsRead(notificationId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .eq('id', notificationId)

  if (error) {
    console.error('Error marking notification as read:', error)
    return { success: false, error }
  }

  revalidatePath('/dashboard')
  revalidatePath('/notifications')
  return { success: true }
}

export async function markAllAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const { error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .match({ is_read: false })
    .or(`target_staff_id.eq.${user.id},target_staff_id.is.null`)

  if (error) {
    console.error('Error marking all notifications as read:', error)
    return { success: false, error }
  }

  revalidatePath('/dashboard')
  revalidatePath('/notifications')
  return { success: true }
}

export async function deleteNotification(notificationId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)

  if (error) {
    console.error('Error deleting notification:', error)
    return { success: false, error }
  }

  revalidatePath('/notifications')
  return { success: true }
}

export async function createInternalNotification({
  title,
  body,
  type = 'info',
  targetStaffId,
  actionUrl
}: {
  title: string
  body: string
  type?: string
  targetStaffId?: string
  actionUrl?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: staff } = await supabase
    .from('staff')
    .select('business_id, branch_id')
    .eq('id', user?.id)
    .single()

  const { error } = await supabase.from('notifications').insert({
    business_id: staff?.business_id,
    branch_id: staff?.branch_id,
    target_staff_id: targetStaffId,
    title,
    body,
    type,
    action_url: actionUrl,
    is_read: false
  })

  if (error) {
    console.error('Error creating notification:', error)
    return { success: false, error }
  }

  return { success: true }
}
